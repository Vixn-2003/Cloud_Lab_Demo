'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useAuthStore } from '@/lib/auth-store';
import { 
  Shield, 
  ShieldAlert, 
  RefreshCw, 
  AlertTriangle,
  Play,
  CheckCircle,
  XCircle,
  Eye,
  Settings,
  Scale
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  getSessions, 
  scanPlagiarism, 
  getPlagiarismCases, 
  updatePlagiarismCase 
} from '@/lib/api';
import { PracticeSession } from '@/lib/types';

export default function PlagiarismPage() {
  const t = useTranslations('navigation');
  const tCommon = useTranslations('common');
  const { user } = useAuthStore();

  const [sessions, setSessions] = useState<PracticeSession[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string>('');
  const [cases, setCases] = useState<any[]>([]);
  const [threshold, setThreshold] = useState<number>(70);
  const [scanning, setScanning] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Diff Compare Viewer State
  const [activeCase, setActiveCase] = useState<any | null>(null);

  const hasAccess = user?.role === 'instructor' || user?.role === 'admin';

  // Load sessions
  useEffect(() => {
    if (!hasAccess) return;
    getSessions().then((data) => {
      setSessions(data);
      if (data.length > 0) {
        setSelectedSessionId(data[0].id);
      }
    }).catch(console.error);
  }, [hasAccess]);

  // Load cases
  const loadCases = async () => {
    if (!selectedSessionId) return;
    setLoading(true);
    try {
      const data = await getPlagiarismCases(selectedSessionId);
      setCases(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedSessionId) {
      loadCases();
    }
  }, [selectedSessionId]);

  if (!hasAccess) {
    return (
      <div className="p-6">
        <Card className="border-red-950 bg-red-950/10">
          <CardHeader className="flex flex-row items-center gap-2">
            <ShieldAlert className="h-6 w-6 text-red-500" />
            <CardTitle className="text-red-400">{tCommon('error') || 'Lỗi phân quyền'}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-300">Bạn không có quyền truy cập trang này. Vui lòng liên hệ quản trị viên.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleRunScan = async () => {
    if (!selectedSessionId) return;
    setScanning(true);
    try {
      const parsedThreshold = threshold / 100;
      const res = await scanPlagiarism(selectedSessionId, parsedThreshold);
      if (res.success) {
        alert(`Quét hoàn tất! Phát hiện ${res.count} trường hợp nghi vấn sao chép.`);
        await loadCases();
      } else {
        alert("Quét thất bại");
      }
    } catch (err: any) {
      alert("Đã xảy ra lỗi khi quét: " + err.message);
    } finally {
      setScanning(false);
    }
  };

  const handleUpdateStatus = async (caseId: string, status: 'confirmed' | 'dismissed') => {
    try {
      const res = await updatePlagiarismCase(caseId, status);
      if (res.success) {
        await loadCases();
        if (activeCase && activeCase.id === caseId) {
          setActiveCase(null);
        }
      }
    } catch (err: any) {
      alert("Cập nhật trạng thái thất bại: " + err.message);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Đã xác nhận</Badge>;
      case 'dismissed':
        return <Badge className="bg-slate-800 text-slate-400 border-slate-700">Đã bác bỏ</Badge>;
      default:
        return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">Đang chờ duyệt</Badge>;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Shield className="h-6 w-6 text-red-500" />
            {t('plagiarism')}
          </h1>
          <p className="text-sm text-slate-400">
            Phát hiện sao chép mã nguồn, đối chiếu mức độ tương đồng giữa các bài nộp của học viên trong ca thi.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedSessionId}
            onChange={(e) => setSelectedSessionId(e.target.value)}
            className="bg-slate-900 border border-slate-800 text-sm text-white rounded-lg px-3 py-2 focus:ring-primary focus:border-primary outline-none"
          >
            {sessions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-1.5 border border-slate-800 rounded-lg px-2.5 py-1 bg-slate-900/40 text-xs">
            <Settings className="h-3.5 w-3.5 text-slate-400" />
            <span className="text-slate-400">Ngưỡng quét:</span>
            <input
              type="number"
              min="30"
              max="100"
              value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value))}
              className="w-10 bg-transparent text-white font-bold border-none outline-none focus:ring-0 text-center"
            />
            <span className="text-slate-400">%</span>
          </div>

          <Button 
            onClick={handleRunScan} 
            disabled={scanning || !selectedSessionId}
            className="bg-red-600 hover:bg-red-700 text-white font-semibold flex items-center gap-1.5"
          >
            <Play className={`h-4 w-4 ${scanning ? 'animate-spin' : ''}`} />
            <span>{scanning ? 'Đang quét...' : 'Quét sao chép'}</span>
          </Button>

          <Button 
            variant="outline" 
            size="icon" 
            onClick={loadCases} 
            className="border-slate-800 text-slate-400 hover:text-white"
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Main Grid layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Plagiarism Suspicion Queue (Left Column / 7 cols) */}
        <Card className="lg:col-span-7 bg-slate-950/20 border-slate-900 shadow-xl overflow-hidden">
          <CardHeader className="border-b border-slate-900">
            <CardTitle className="text-white text-base font-bold flex items-center gap-2">
              <Scale className="h-4.5 w-4.5 text-red-500" />
              Danh sách nghi vấn gian lận
            </CardTitle>
            <CardDescription className="text-slate-400">
              Chỉ các cặp bài nộp có mức tương đồng vượt quá {threshold}% được hiển thị.
            </CardDescription>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-300">
              <thead className="text-xs uppercase bg-slate-950/80 text-slate-400 border-b border-slate-900">
                <tr>
                  <th className="px-4 py-3 font-semibold">Bài Lab</th>
                  <th className="px-4 py-3 font-semibold">Sinh viên A</th>
                  <th className="px-4 py-3 font-semibold">Sinh viên B</th>
                  <th className="px-4 py-3 font-semibold text-center">Tương đồng</th>
                  <th className="px-4 py-3 font-semibold">Trạng thái</th>
                  <th className="px-4 py-3 font-semibold text-right">Xem & Duyệt</th>
                </tr>
              </thead>
              <tbody>
                {cases.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-slate-500">
                      Chưa phát hiện ca sao chép nào hoặc vui lòng thực hiện "Quét sao chép".
                    </td>
                  </tr>
                ) : (
                  cases.map((c) => {
                    const similarityPct = Math.round(c.similarity_score * 100);
                    return (
                      <tr key={c.id} className="border-b border-slate-900 hover:bg-slate-900/40 transition-colors">
                        <td className="px-4 py-3">
                          <span className="font-mono text-xs font-semibold text-slate-300 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                            {c.lab_id}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col">
                            <span className="font-semibold text-white text-xs">{c.student_a_name}</span>
                            <span className="font-mono text-[10px] text-slate-500">{c.student_a_code}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col">
                            <span className="font-semibold text-white text-xs">{c.student_b_name}</span>
                            <span className="font-mono text-[10px] text-slate-500">{c.student_b_code}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`font-bold font-mono text-sm ${
                            similarityPct >= 90 ? 'text-red-500' :
                            similarityPct >= 80 ? 'text-orange-500' : 'text-amber-500'
                          }`}>
                            {similarityPct}%
                          </span>
                        </td>
                        <td className="px-4 py-3">{getStatusBadge(c.status)}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center gap-1.5 justify-end">
                            <Button 
                              variant="secondary" 
                              size="sm"
                              onClick={() => setActiveCase(c)}
                              className="px-2 py-1 h-7 text-xs flex items-center gap-1"
                            >
                              <Eye className="h-3.5 w-3.5" />
                              <span>So sánh</span>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Side-by-side Diff Viewer Panel (Right Column / 5 cols) */}
        <Card className="lg:col-span-5 bg-slate-950/40 border-slate-900 shadow-xl overflow-hidden flex flex-col">
          {activeCase ? (
            <div className="p-4 flex flex-col gap-4 h-full">
              <div className="border-b border-slate-900 pb-3 flex items-start justify-between">
                <div>
                  <h3 className="text-white font-bold text-sm flex items-center gap-1.5">
                    <Scale className="h-4 w-4 text-red-500" />
                    Đối chiếu Code song song
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5 font-mono">
                    Bài Lab: {activeCase.lab_id} | Tương đồng: {Math.round(activeCase.similarity_score * 100)}%
                  </p>
                </div>
                
                <div className="flex gap-1">
                  <Button 
                    size="sm" 
                    onClick={() => handleUpdateStatus(activeCase.id, 'confirmed')}
                    className="bg-red-600 hover:bg-red-700 text-white text-xs px-2 h-7"
                    disabled={activeCase.status === 'confirmed'}
                  >
                    <CheckCircle className="h-3.5 w-3.5 mr-1" />
                    Xác nhận
                  </Button>
                  <Button 
                    variant="outline"
                    size="sm" 
                    onClick={() => handleUpdateStatus(activeCase.id, 'dismissed')}
                    className="border-slate-800 text-slate-400 hover:text-white text-xs px-2 h-7"
                    disabled={activeCase.status === 'dismissed'}
                  >
                    <XCircle className="h-3.5 w-3.5 mr-1" />
                    Bác bỏ
                  </Button>
                </div>
              </div>

              {/* Side by side columns */}
              <div className="grid grid-cols-2 gap-3 flex-1 min-h-[300px]">
                <div className="flex flex-col gap-1">
                  <div className="bg-slate-950 px-2 py-1 rounded-t border border-slate-800 border-b-0 text-[10px] text-slate-400 font-semibold flex justify-between items-center">
                    <span>SV A: {activeCase.student_a_name}</span>
                    <span className="font-mono text-slate-600">{activeCase.student_a_code}</span>
                  </div>
                  <textarea
                    readOnly
                    value={activeCase.codeA || ''}
                    className="w-full flex-1 p-2 bg-slate-950 text-slate-200 border border-slate-800 rounded-b font-mono text-[10px] leading-relaxed outline-none resize-none focus:border-slate-800"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <div className="bg-slate-950 px-2 py-1 rounded-t border border-slate-800 border-b-0 text-[10px] text-slate-400 font-semibold flex justify-between items-center">
                    <span>SV B: {activeCase.student_b_name}</span>
                    <span className="font-mono text-slate-600">{activeCase.student_b_code}</span>
                  </div>
                  <textarea
                    readOnly
                    value={activeCase.codeB || ''}
                    className="w-full flex-1 p-2 bg-slate-950 text-slate-200 border border-slate-800 rounded-b font-mono text-[10px] leading-relaxed outline-none resize-none focus:border-slate-800"
                  />
                </div>
              </div>

              <div className="bg-slate-950/40 p-2.5 rounded border border-slate-900 text-[11px] text-slate-500 leading-normal flex items-start gap-1.5">
                <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
                <span>
                  <strong>Hành vi xác nhận:</strong> Khi giảng viên nhấn nút <strong>Xác nhận</strong>, hệ thống sẽ đánh dấu vi phạm cho cả hai bài nộp, thiết lập điểm số về <strong>0 điểm (status: failed)</strong> và ghi nhận mã lỗi <strong>result_code = 'CPY'</strong>.
                </span>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center flex flex-col items-center justify-center h-full gap-2.5 text-slate-500">
              <Shield className="h-12 w-12 text-slate-700 animate-pulse" />
              <p className="text-sm font-semibold">Chọn một ca so khớp nghi vấn để đối chiếu.</p>
              <p className="text-xs text-slate-600 max-w-[220px]">
                Hệ thống sẽ đối chiếu mã nguồn song song từng dòng giúp bạn dễ dàng đưa ra quyết định.
              </p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
