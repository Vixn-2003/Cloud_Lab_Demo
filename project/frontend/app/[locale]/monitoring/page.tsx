'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useAuthStore } from '@/lib/auth-store';
import { 
  Activity, 
  ShieldAlert, 
  RefreshCw, 
  Search, 
  Download, 
  Users, 
  CheckCircle, 
  AlertTriangle,
  Monitor,
  Clock
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  getSessions, 
  getSessionMonitoringData, 
  getSessionLeaderboard,
  getSession 
} from '@/lib/api';
import { PracticeSession } from '@/lib/types';

export default function MonitoringPage() {
  const t = useTranslations('navigation');
  const tCommon = useTranslations('common');
  const { user } = useAuthStore();

  const [sessions, setSessions] = useState<PracticeSession[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string>('');
  const [sessionDetail, setSessionDetail] = useState<PracticeSession | null>(null);
  const [monitoringData, setMonitoringData] = useState<any[]>([]);
  const [leaderboardData, setLeaderboardData] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  // 1. Check permissions
  const hasAccess = user?.role === 'instructor' || user?.role === 'admin';

  // Load active/scheduled sessions
  useEffect(() => {
    if (!hasAccess) return;
    getSessions().then((data) => {
      // Sort so active sessions are first
      const sorted = [...data].sort((a, b) => {
        if (a.status === 'active' && b.status !== 'active') return -1;
        if (a.status !== 'active' && b.status === 'active') return 1;
        return 0;
      });
      setSessions(sorted);
      if (sorted.length > 0) {
        setSelectedSessionId(sorted[0].id);
      }
    }).catch(console.error);
  }, [hasAccess]);

  // Load monitoring and leaderboard data when selectedSessionId changes
  const fetchData = async () => {
    if (!selectedSessionId) return;
    setLoading(true);
    try {
      const [detail, mon, lead] = await Promise.all([
        getSession(selectedSessionId),
        getSessionMonitoringData(selectedSessionId),
        getSessionLeaderboard(selectedSessionId)
      ]);
      setSessionDetail(detail);
      setMonitoringData(mon);
      setLeaderboardData(lead);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedSessionId) {
      fetchData();
    }
  }, [selectedSessionId]);

  // Auto refresh loop
  useEffect(() => {
    if (!autoRefresh || !selectedSessionId) return;
    const interval = setInterval(() => {
      fetchData();
    }, 5000);
    return () => clearInterval(interval);
  }, [autoRefresh, selectedSessionId]);

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

  // Calculate statistics
  const totalStudents = monitoringData.length;
  
  // Solved at least 1 lab
  const activeStudents = monitoringData.filter(s => s.solvedCount > 0).length;

  // Warning state: Sharing same IP or Hostname with another student, or having > 15 attempts on a lab
  const warningList = monitoringData.filter((student, _, arr) => {
    if (!student.seat_ip) return false;
    const sharedIp = arr.some(other => other.user_id !== student.user_id && other.seat_ip === student.seat_ip);
    const excessiveAttempts = student.totalAttempts > 15;
    return sharedIp || excessiveAttempts;
  });
  const totalWarnings = warningList.length;

  // Filter students based on search term
  const filteredData = monitoringData.filter(item => {
    const term = searchTerm.toLowerCase();
    return (
      item.full_name?.toLowerCase().includes(term) ||
      item.student_code?.toLowerCase().includes(term) ||
      item.seat_ip?.toLowerCase().includes(term) ||
      item.hostname?.toLowerCase().includes(term)
    );
  });

  // Export to CSV helper
  const handleExportCSV = () => {
    if (filteredData.length === 0) return;
    const headers = ['Mã SV', 'Họ Tên', 'IP Phòng máy', 'Tên Máy (Hostname)', 'Đề Thi', 'Số Bài Đúng', 'Số Lần Thử', 'Trạng Thái Cuối'];
    const rows = filteredData.map(item => [
      item.student_code || '',
      item.full_name || '',
      item.seat_ip || '',
      item.hostname || '',
      item.variant_code || 'Mặc định',
      item.solvedCount || 0,
      item.totalAttempts || 0,
      item.lastSubmitStatus || 'Chưa nộp'
    ]);

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Giam_Sat_Ca_Thi_${sessionDetail?.name || 'export'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
      case 'graded':
        return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">Hoàn thành (AC)</Badge>;
      case 'failed':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Thất bại (WA)</Badge>;
      case 'running':
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 animate-pulse">Đang chạy</Badge>;
      case 'none':
        return <Badge variant="outline" className="text-slate-400 border-slate-700">Chưa nộp bài</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Activity className="h-6 w-6 text-red-500 animate-pulse" />
            {t('monitoring')}
          </h1>
          <p className="text-sm text-slate-400">
            Theo dõi thời gian thực IP, máy trạm và tiến trình nộp bài của sinh viên trong phòng thi.
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
                {s.name} ({s.status === 'active' ? 'Đang diễn ra' : s.status === 'ended' ? 'Đã kết thúc' : 'Nháp/Chờ'})
              </option>
            ))}
          </select>

          <Button 
            variant="outline" 
            size="icon" 
            onClick={fetchData} 
            className="border-slate-800 text-slate-400 hover:text-white"
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>

          <Button 
            variant="secondary" 
            onClick={handleExportCSV}
            className="flex items-center gap-1.5"
            disabled={filteredData.length === 0}
          >
            <Download className="h-4 w-4" />
            <span>Xuất CSV</span>
          </Button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-slate-950/40 border-slate-900 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Sinh viên trong phòng</CardTitle>
            <Users className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{totalStudents}</div>
            <p className="text-xs text-slate-500 mt-1">Đã được gán tham gia ca thi</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-950/40 border-slate-900 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-emerald-400">{"Đã giải bài (>= 1 bài)"}</CardTitle>
            <CheckCircle className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-400">{activeStudents}</div>
            <p className="text-xs text-slate-500 mt-1">
              Tỷ lệ: {totalStudents ? Math.round((activeStudents / totalStudents) * 100) : 0}%
            </p>
          </CardContent>
        </Card>

        <Card className="bg-slate-950/40 border-slate-900 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-amber-500">Cảnh báo trùng thiết bị</CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-500">{totalWarnings}</div>
            <p className="text-xs text-slate-500 mt-1">Chung IP hoặc có nhiều lần thử</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-950/40 border-slate-900 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Trạng thái tự động làm mới</CardTitle>
            <Clock className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-white">
                {autoRefresh ? 'Bật (Mỗi 5s)' : 'Tắt'}
              </div>
              <p className="text-[10px] text-slate-500 mt-1">Cập nhật lúc: {lastUpdated || 'Chưa có'}</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={autoRefresh} 
                onChange={(e) => setAutoRefresh(e.target.checked)} 
                className="sr-only peer" 
              />
              <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-300 after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </CardContent>
        </Card>
      </div>

      {/* Main Monitoring Table */}
      <Card className="bg-slate-950/20 border-slate-900 shadow-xl overflow-hidden">
        <div className="p-4 border-b border-slate-900 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
            <Input
              placeholder="Tìm theo tên, mã SV, IP..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-slate-900/60 border-slate-800 text-white placeholder-slate-500"
            />
          </div>
          
          <div className="text-xs text-slate-500 flex items-center gap-2">
            <Monitor className="h-3.5 w-3.5" />
            <span>Màn hình giám sát phòng máy: Chỉ hiển thị sinh viên được gán vào ca thi này.</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-slate-300">
            <thead className="text-xs uppercase bg-slate-950/80 text-slate-400 border-b border-slate-900">
              <tr>
                <th className="px-6 py-3 font-semibold">Mã SV</th>
                <th className="px-6 py-3 font-semibold">Họ và Tên</th>
                <th className="px-6 py-3 font-semibold">IP Phòng máy</th>
                <th className="px-6 py-3 font-semibold">Hostname Máy</th>
                <th className="px-6 py-3 font-semibold">Đề thi</th>
                <th className="px-6 py-3 font-semibold text-center">Tiến độ bài đúng</th>
                <th className="px-6 py-3 font-semibold text-center">Số lần nộp</th>
                <th className="px-6 py-3 font-semibold">Bài nộp cuối</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-slate-500">
                    Không tìm thấy sinh viên nào hoặc ca thi chưa có sinh viên đăng nhập làm bài.
                  </td>
                </tr>
              ) : (
                filteredData.map((student) => {
                  // Check duplicate IP for warning highlight
                  const isIpWarning = student.seat_ip && monitoringData.some(
                    other => other.user_id !== student.user_id && other.seat_ip === student.seat_ip
                  );

                  return (
                    <tr 
                      key={student.user_id} 
                      className={`border-b border-slate-900 hover:bg-slate-900/40 transition-colors ${
                        isIpWarning ? 'bg-amber-950/5' : ''
                      }`}
                    >
                      <td className="px-6 py-4 font-mono font-medium text-white">{student.student_code || '—'}</td>
                      <td className="px-6 py-4 font-medium text-white">
                        <div className="flex flex-col">
                          <span>{student.full_name}</span>
                          <span className="text-[10px] text-slate-500">{student.email}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`font-mono text-xs ${isIpWarning ? 'text-amber-400 font-bold flex items-center gap-1' : ''}`}>
                          {isIpWarning && <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />}
                          {student.seat_ip || 'Chưa kết nối'}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-slate-400">{student.hostname || '—'}</td>
                      <td className="px-6 py-4">
                        <Badge variant="outline" className="border-slate-800 text-slate-300 font-mono text-xs">
                          {student.variant_code || 'Mặc định'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`text-sm font-bold ${student.solvedCount > 0 ? 'text-emerald-400' : 'text-slate-400'}`}>
                          {student.solvedCount} bài AC
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center font-mono">{student.totalAttempts}</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          {getStatusBadge(student.lastSubmitStatus)}
                          {student.lastSubmitTime && (
                            <span className="text-[10px] text-slate-500">
                              Lúc: {new Date(student.lastSubmitTime).toLocaleTimeString()}
                            </span>
                          )}
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
    </div>
  );
}
