'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useAuthStore } from '@/lib/auth-store';
import { getSessions, deleteSession } from '@/lib/api';
import { PracticeSession } from '@/lib/types';
import {
  Calendar,
  Plus,
  Edit,
  Trash2,
  Users,
  BookOpen,
  ShieldAlert,
  Play,
  Clock,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Import,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SessionForm } from '@/components/session-form';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function SessionsPage() {
  const t = useTranslations('navigation');
  const tCommon = useTranslations('common');
  const { user } = useAuthStore();

  const [sessions, setSessions] = useState<PracticeSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<PracticeSession | null>(null);
  const [deletingSessionId, setDeletingSessionId] = useState<string | null>(null);

  const fetchSessions = async () => {
    setIsLoading(true);
    try {
      const data = await getSessions();
      setSessions(data);
    } catch (err) {
      console.error(err);
      toast.error('Lỗi khi tải danh sách ca thực hành.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'instructor' || user?.role === 'admin') {
      fetchSessions();
    }
  }, [user]);

  const handleEdit = (session: PracticeSession) => {
    setEditingSession(session);
    setFormOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingSessionId) return;

    try {
      await deleteSession(deletingSessionId);
      toast.success('Đã xóa ca thực hành thành công.');
      fetchSessions();
    } catch (err: any) {
      console.error(err);
      toast.error('Lỗi khi xóa: ' + err.message);
    } finally {
      setDeletingSessionId(null);
    }
  };

  if (user?.role !== 'instructor' && user?.role !== 'admin') {
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

  // Calculate stats
  const totalSessions = sessions.length;
  const activeSessions = sessions.filter((s) => s.status === 'active').length;
  const endedSessions = sessions.filter((s) => s.status === 'ended').length;

  const getStatusBadge = (status: PracticeSession['status']) => {
    switch (status) {
      case 'draft':
        return <Badge variant="secondary" className="bg-slate-800 text-slate-300 border-slate-700">Draft</Badge>;
      case 'scheduled':
        return <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20">Scheduled</Badge>;
      case 'active':
        return (
          <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 animate-pulse flex items-center gap-1">
            <Play className="h-2 w-2 fill-emerald-400" /> Active
          </Badge>
        );
      case 'frozen':
        return <Badge className="bg-cyan-500/10 text-cyan-400 border-cyan-500/20">Frozen</Badge>;
      case 'ended':
        return <Badge variant="destructive" className="bg-red-500/10 text-red-400 border-red-500/20">Ended</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDateTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch (e) {
      return isoString;
    }
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in-up">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Calendar className="h-7 w-7 text-primary" />
            {t('sessions')}
          </h1>
          <p className="text-sm text-slate-400">
            Quản lý và giám sát các ca thi thực hành chuyên môn của bạn.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingSession(null);
            setFormOpen(true);
          }}
          className="bg-gradient-to-r from-primary to-[oklch(0.6_0.22_290)] text-white hover:opacity-90 gap-2 w-fit shadow-lg shadow-primary/20"
        >
          <Plus className="h-4 w-4" />
          {t('createSession') || 'Tạo ca thực hành'}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="backdrop-blur-md bg-slate-950/40 border-slate-900 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Tổng số ca thi</CardTitle>
            <Calendar className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{totalSessions}</div>
            <p className="text-xs text-slate-500">Mã nguồn đồng bộ từ DB</p>
          </CardContent>
        </Card>

        <Card className="backdrop-blur-md bg-slate-950/40 border-slate-900 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Ca đang diễn ra</CardTitle>
            <Clock className="h-4 w-4 text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-400">{activeSessions}</div>
            <p className="text-xs text-slate-500">Đang khóa cứng học trình SV</p>
          </CardContent>
        </Card>

        <Card className="backdrop-blur-md bg-slate-950/40 border-slate-900 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Ca đã kết thúc</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-300">{endedSessions}</div>
            <p className="text-xs text-slate-500">Sẵn sàng xuất điểm và báo cáo</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Card Table */}
      <Card className="backdrop-blur-md bg-slate-950/20 border-slate-900 shadow-xl overflow-hidden">
        <CardHeader>
          <CardTitle className="text-lg text-white">Danh sách Ca thi & Ca thực hành</CardTitle>
          <CardDescription className="text-slate-500">
            Hiển thị thông tin tổng hợp của từng ca thi do bạn phụ trách.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              <p className="text-sm text-slate-500">Đang tải danh sách...</p>
            </div>
          ) : sessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
              <AlertCircle className="h-10 w-10 text-slate-600" />
              <p className="text-slate-400 font-medium">Chưa có ca thực hành nào được tạo</p>
              <p className="text-xs text-slate-600 max-w-sm">
                Hãy nhấn nút "Tạo ca thực hành" ở góc trên bên phải để bắt đầu lên lịch bài thi đầu tiên.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider text-xs border-b border-slate-900">
                  <tr>
                    <th className="px-6 py-4">Tên ca thi</th>
                    <th className="px-6 py-4">Phòng máy</th>
                    <th className="px-6 py-4">Lớp liên kết</th>
                    <th className="px-6 py-4">Thời gian</th>
                    <th className="px-6 py-4">Trạng thái</th>
                    <th className="px-6 py-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900/60 bg-transparent">
                  {sessions.map((session) => (
                    <tr key={session.id} className="hover:bg-slate-900/10 transition-colors">
                      <td className="px-6 py-4 font-semibold text-white">
                        <div className="flex flex-col">
                          <span>{session.name}</span>
                          <span className="text-[10px] text-slate-500 font-mono mt-0.5">ID: {session.id}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-300">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 text-slate-500" />
                          <span>{session.location || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-300">
                        {session.class_name || 'Lớp mẫu'}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-400 space-y-0.5">
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] uppercase text-emerald-400 font-semibold w-7">Bắt đầu:</span>
                          <span>{formatDateTime(session.start_time)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] uppercase text-red-400 font-semibold w-7">Kết thúc:</span>
                          <span>{formatDateTime(session.end_time)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(session.status)}
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(session)}
                          className="text-slate-400 hover:text-white hover:bg-slate-900 h-8 w-8"
                          tooltip="Chỉnh sửa ca thi"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeletingSessionId(session.id)}
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-8 w-8"
                          tooltip="Xóa ca thi"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Session Creation/Edit Modal */}
      <SessionForm
        open={formOpen}
        onOpenChange={setFormOpen}
        sessionToEdit={editingSession}
        onSuccess={fetchSessions}
      />

      {/* Deletion Dialog */}
      <AlertDialog
        open={!!deletingSessionId}
        onOpenChange={(open) => !open && setDeletingSessionId(null)}
      >
        <AlertDialogContent className="bg-slate-950 border-slate-800 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Xác nhận xóa ca thực hành</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              Hành động này sẽ xóa hoàn toàn ca thực hành này và các dữ liệu liên kết khỏi cơ sở dữ liệu. Dữ liệu nộp bài của sinh viên sẽ không bị mất nhưng sẽ không còn liên kết với ca thi này. Bạn có chắc muốn tiếp tục?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-slate-800 text-slate-300 hover:bg-slate-900">
              Hủy
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              Xóa ca thi
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
