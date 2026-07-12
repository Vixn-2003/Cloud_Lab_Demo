'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useAuthStore } from '@/lib/auth-store';
import { 
  FileText, 
  ShieldAlert, 
  RefreshCw, 
  Search, 
  CheckCircle, 
  XCircle, 
  Edit,
  Code,
  Check,
  MessageSquare
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  getSessions, 
  getSubmissions, 
  gradeSubmission 
} from '@/lib/api';
import { PracticeSession } from '@/lib/types';

export default function GradingPage() {
  const t = useTranslations('navigation');
  const tCommon = useTranslations('common');
  const { user } = useAuthStore();

  const [sessions, setSessions] = useState<PracticeSession[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string>('');
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all'); // all, pending, graded
  const [loading, setLoading] = useState(false);

  // Modal State
  const [activeSubmission, setActiveSubmission] = useState<any | null>(null);
  const [scoreInput, setScoreInput] = useState<string>('100');
  const [commentInput, setCommentInput] = useState<string>('');
  const [gradingSubmit, setGradingSubmit] = useState(false);

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

  // Load submissions
  const loadSubmissions = async () => {
    if (!hasAccess) return;
    setLoading(true);
    try {
      const data = await getSubmissions();
      // Only keep submissions for the selected session
      const filtered = data.filter((s: any) => s.sessionId === selectedSessionId || s.session_id === selectedSessionId);
      setSubmissions(filtered);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedSessionId) {
      loadSubmissions();
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

  // Filter submissions
  const filteredSubmissions = submissions.filter(s => {
    const isPending = s.status === 'queued' || s.status === 'running' || s.status === 'pending';
    const matchesStatus = 
      filterStatus === 'all' ? true :
      filterStatus === 'pending' ? isPending :
      filterStatus === 'graded' ? (s.status === 'graded' || s.status === 'completed' || s.status === 'failed') : true;

    const term = searchTerm.toLowerCase();
    const matchesSearch = 
      s.student_code?.toLowerCase().includes(term) ||
      s.full_name?.toLowerCase().includes(term) ||
      s.labId?.toLowerCase().includes(term) ||
      s.lab_id?.toLowerCase().includes(term);

    return matchesStatus && matchesSearch;
  });

  const handleOpenGrading = (sub: any) => {
    setActiveSubmission(sub);
    setScoreInput(sub.score !== undefined && sub.score !== null ? String(sub.score) : '100');
    // Extract feedback from JSON if exists
    let feedback = '';
    if (sub.result && typeof sub.result === 'object') {
      feedback = sub.result.feedback || '';
    }
    setCommentInput(feedback);
  };

  const handleSaveGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSubmission) return;

    setGradingSubmit(true);
    try {
      const score = parseInt(scoreInput, 10);
      if (isNaN(score) || score < 0 || score > 100) {
        alert("Điểm số phải từ 0 đến 100");
        setGradingSubmit(false);
        return;
      }

      const res = await gradeSubmission(activeSubmission.id, score, commentInput);
      if (res.success) {
        // Refresh list
        await loadSubmissions();
        setActiveSubmission(null);
      } else {
        alert(res.message || "Chấm điểm thất bại");
      }
    } catch (err: any) {
      alert("Đã xảy ra lỗi khi chấm điểm: " + err.message);
    } finally {
      setGradingSubmit(false);
    }
  };

  const getStatusBadge = (status: string, resultCode?: string) => {
    const isPending = status === 'queued' || status === 'running' || status === 'pending';
    if (isPending) {
      return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 animate-pulse">Chờ chấm</Badge>;
    }
    if (resultCode === 'CPY') {
      return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Sao chép (CPY)</Badge>;
    }
    if (status === 'graded') {
      return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">Đã chấm</Badge>;
    }
    if (status === 'completed') {
      return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Hoàn thành (AC)</Badge>;
    }
    return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">WA</Badge>;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" />
            {t('grading')}
          </h1>
          <p className="text-sm text-slate-400">
            Chấm điểm thủ công các bài lập trình hoặc báo cáo, xem mã nguồn sinh viên nộp và gửi lời phê phản hồi.
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

          <Button 
            variant="outline" 
            size="icon" 
            onClick={loadSubmissions} 
            className="border-slate-800 text-slate-400 hover:text-white"
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Main Container */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Submissions Queue Table (Left 2 columns) */}
        <Card className="lg:col-span-2 bg-slate-950/20 border-slate-900 shadow-xl overflow-hidden">
          <div className="p-4 border-b border-slate-900 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
              <Input
                placeholder="Tìm MSSV, tên, lab..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 bg-slate-900/60 border-slate-800 text-white placeholder-slate-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <Button 
                variant={filterStatus === 'all' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setFilterStatus('all')}
                className="text-xs"
              >
                Tất cả
              </Button>
              <Button 
                variant={filterStatus === 'pending' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setFilterStatus('pending')}
                className="text-xs"
              >
                Chưa chấm
              </Button>
              <Button 
                variant={filterStatus === 'graded' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setFilterStatus('graded')}
                className="text-xs"
              >
                Đã chấm
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-300">
              <thead className="text-xs uppercase bg-slate-950/80 text-slate-400 border-b border-slate-900">
                <tr>
                  <th className="px-6 py-3 font-semibold">Sinh viên</th>
                  <th className="px-6 py-3 font-semibold">Bài tập</th>
                  <th className="px-6 py-3 font-semibold">Thời gian nộp</th>
                  <th className="px-6 py-3 font-semibold text-center">Điểm số</th>
                  <th className="px-6 py-3 font-semibold">Trạng thái</th>
                  <th className="px-6 py-3 font-semibold text-right">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {filteredSubmissions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-slate-500">
                      Không có bài nộp nào phù hợp bộ lọc hiện tại.
                    </td>
                  </tr>
                ) : (
                  filteredSubmissions.map((sub) => {
                    const dateText = sub.createdAt ? new Date(sub.createdAt).toLocaleTimeString() : '—';
                    return (
                      <tr key={sub.id} className="border-b border-slate-900 hover:bg-slate-900/40 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="font-semibold text-white">{sub.full_name || 'Học sinh'}</span>
                            <span className="font-mono text-xs text-slate-500">{sub.student_code || '—'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant="outline" className="border-slate-800 text-slate-300 font-mono text-xs">
                            {sub.labId || sub.lab_id}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-400">{dateText}</td>
                        <td className="px-6 py-4 text-center font-mono font-bold text-lg text-primary">
                          {sub.score !== undefined && sub.score !== null ? `${sub.score}` : '—'}
                        </td>
                        <td className="px-6 py-4">{getStatusBadge(sub.status, sub.resultCode || sub.result_code)}</td>
                        <td className="px-6 py-4 text-right">
                          <Button 
                            variant="secondary" 
                            size="sm"
                            onClick={() => handleOpenGrading(sub)}
                            className="flex items-center gap-1 ml-auto"
                          >
                            <Edit className="h-3.5 w-3.5" />
                            <span>Chấm</span>
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Live Grading Panel (Right column) */}
        <Card className="bg-slate-950/40 border-slate-900 shadow-xl overflow-hidden flex flex-col">
          {activeSubmission ? (
            <form onSubmit={handleSaveGrade} className="p-4 flex flex-col gap-4 h-full">
              <div className="border-b border-slate-900 pb-3">
                <h3 className="text-white font-bold flex items-center gap-1.5 text-base">
                  <Code className="h-4.5 w-4.5 text-primary" />
                  Chấm bài: {activeSubmission.full_name}
                </h3>
                <p className="text-xs text-slate-500 mt-1 font-mono">
                  Mã SV: {activeSubmission.student_code} | Bài: {activeSubmission.labId || activeSubmission.lab_id}
                </p>
              </div>

              {/* Source code viewer */}
              <div className="flex-1 min-h-[220px] flex flex-col gap-1.5">
                <span className="text-xs text-slate-400 font-semibold flex items-center gap-1">
                  Mã nguồn đã nộp ({activeSubmission.language || 'Python'}):
                </span>
                <textarea
                  readOnly
                  value={activeSubmission.code || '# Không có code được nộp'}
                  className="w-full flex-1 p-2 bg-slate-950 text-slate-200 border border-slate-800 rounded font-mono text-xs leading-relaxed outline-none resize-none focus:border-slate-800"
                />
              </div>

              {/* Form Input fields */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-slate-400 font-semibold">Điểm số (0-100)</span>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={scoreInput}
                    onChange={(e) => setScoreInput(e.target.value)}
                    required
                    className="bg-slate-900 border-slate-800 text-white"
                  />
                </div>
                <div className="flex flex-col gap-1 justify-end">
                  <Button 
                    type="submit" 
                    className="w-full bg-primary text-primary-foreground font-semibold flex items-center justify-center gap-1"
                    disabled={gradingSubmit}
                  >
                    {gradingSubmit ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                    <span>Lưu điểm</span>
                  </Button>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-xs text-slate-400 font-semibold flex items-center gap-1">
                  <MessageSquare className="h-3 w-3" />
                  Nhận xét & Lời phê
                </span>
                <textarea
                  placeholder="Viết nhận xét gửi đến sinh viên..."
                  value={commentInput}
                  onChange={(e) => setCommentInput(e.target.value)}
                  className="w-full p-2 bg-slate-900 text-slate-200 border border-slate-800 rounded text-xs outline-none focus:border-primary min-h-[80px]"
                />
              </div>
            </form>
          ) : (
            <div className="p-10 text-center flex flex-col items-center justify-center h-full gap-2 text-slate-500">
              <FileText className="h-12 w-12 text-slate-700 animate-pulse" />
              <p className="text-sm font-semibold">Chọn một sinh viên bên cạnh để bắt đầu chấm điểm.</p>
              <p className="text-xs text-slate-600 max-w-[200px]">
                Xem mã nguồn nộp, cho điểm trực tiếp và viết phản hồi lời phê.
              </p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
