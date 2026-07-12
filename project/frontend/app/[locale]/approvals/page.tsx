'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useAuthStore } from '@/lib/auth-store';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  ShieldAlert, 
  RefreshCw, 
  FileCheck,
  MessageSquare,
  ChevronRight,
  User,
  Calendar
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { getApprovals, updateApproval } from '@/lib/api';

export default function ApprovalsPage() {
  const t = useTranslations('navigation');
  const tCommon = useTranslations('common');
  const { user } = useAuthStore();

  const [requests, setRequests] = useState<any[]>([]);
  const [selectedReq, setSelectedReq] = useState<any | null>(null);
  const [comments, setComments] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const hasAccess = user?.role === 'admin';

  const loadRequests = async () => {
    if (!hasAccess) return;
    setLoading(true);
    try {
      const data = await getApprovals();
      setRequests(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, [hasAccess]);

  if (!hasAccess) {
    return (
      <div className="p-6">
        <Card className="border-red-950 bg-red-950/10">
          <CardHeader className="flex flex-row items-center gap-2">
            <ShieldAlert className="h-6 w-6 text-red-500" />
            <CardTitle className="text-red-400">{tCommon('error') || 'Lỗi phân quyền'}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-300">Bạn không có quyền truy cập trang này. Vui lòng đăng nhập với tư cách Quản trị viên hệ thống.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleAction = async (status: 'approved' | 'rejected') => {
    if (!selectedReq) return;
    setSubmitting(true);
    try {
      const res = await updateApproval(selectedReq.id, status, comments);
      if (res.success) {
        alert(status === 'approved' ? "Đã phê duyệt bài tập thành công!" : "Đã từ chối bài tập!");
        setComments('');
        setSelectedReq(null);
        await loadRequests();
      } else {
        alert("Thao tác thất bại");
      }
    } catch (e: any) {
      alert("Đã xảy ra lỗi: " + e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">Đã duyệt</Badge>;
      case 'rejected':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Từ chối</Badge>;
      default:
        return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 animate-pulse">Chờ duyệt</Badge>;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <FileCheck className="h-6 w-6 text-primary" />
            Phê duyệt Bài thực hành
          </h1>
          <p className="text-sm text-slate-400">
            Quản trị viên kiểm tra cấu hình, testcases và phê duyệt các đề xuất bài lab lập trình mới từ giảng viên.
          </p>
        </div>

        <Button 
          variant="outline" 
          size="icon" 
          onClick={loadRequests} 
          className="border-slate-800 text-slate-400 hover:text-white"
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Requests Queue */}
        <Card className="lg:col-span-7 bg-slate-950/20 border-slate-900 shadow-xl overflow-hidden">
          <CardHeader className="border-b border-slate-900 bg-slate-950/40">
            <CardTitle className="text-white text-base font-bold">Hàng chờ duyệt bài</CardTitle>
            <CardDescription className="text-slate-400">
              Danh sách đề xuất bài thực hành từ các giảng viên / tác giả.
            </CardDescription>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-300">
              <thead className="text-xs uppercase bg-slate-950/80 text-slate-400 border-b border-slate-900">
                <tr>
                  <th className="px-4 py-3 font-semibold">Bài Lab</th>
                  <th className="px-4 py-3 font-semibold">Người đề xuất</th>
                  <th className="px-4 py-3 font-semibold">Thời gian</th>
                  <th className="px-4 py-3 font-semibold">Trạng thái</th>
                  <th className="px-4 py-3 font-semibold text-right">Chi tiết</th>
                </tr>
              </thead>
              <tbody>
                {requests.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-slate-500">
                      Hiện tại không có yêu cầu phê duyệt nào.
                    </td>
                  </tr>
                ) : (
                  requests.map((r) => {
                    const isSelected = selectedReq?.id === r.id;
                    return (
                      <tr 
                        key={r.id} 
                        onClick={() => setSelectedReq(r)}
                        className={`border-b border-slate-900 hover:bg-slate-900/40 transition-colors cursor-pointer ${
                          isSelected ? 'bg-primary/5' : ''
                        }`}
                      >
                        <td className="px-4 py-3 font-mono font-semibold text-white text-xs">{r.lab_id}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5 text-xs">
                            <User className="h-3.5 w-3.5 text-slate-500" />
                            <span>{r.author_name || 'Giảng viên'}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-400">
                          {new Date(r.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">{getStatusBadge(r.status)}</td>
                        <td className="px-4 py-3 text-right">
                          <ChevronRight className="h-4 w-4 ml-auto text-slate-600" />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Action Panel */}
        <Card className="lg:col-span-5 bg-slate-950/40 border-slate-900 shadow-xl overflow-hidden flex flex-col">
          {selectedReq ? (
            <div className="p-5 flex flex-col gap-5 h-full">
              <div className="border-b border-slate-900 pb-3">
                <h3 className="text-white font-bold text-base flex items-center gap-2">
                  <FileCheck className="h-5 w-5 text-primary" />
                  Chi tiết đề xuất bài Lab
                </h3>
                <p className="text-xs text-slate-500 mt-1 font-mono">
                  Mã bài: {selectedReq.lab_id}
                </p>
              </div>

              <div className="space-y-3 text-xs flex-1">
                <div className="flex items-center justify-between border-b border-slate-900 pb-2">
                  <span className="text-slate-400 font-semibold">Tác giả đề xuất:</span>
                  <span className="text-white font-medium">{selectedReq.author_name || 'Giảng viên'}</span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-900 pb-2">
                  <span className="text-slate-400 font-semibold">Thời gian tạo:</span>
                  <span className="text-white font-mono">{new Date(selectedReq.created_at).toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-900 pb-2">
                  <span className="text-slate-400 font-semibold">Trạng thái:</span>
                  <span>{getStatusBadge(selectedReq.status)}</span>
                </div>

                {selectedReq.comments && (
                  <div className="bg-slate-900/60 p-2.5 rounded border border-slate-800 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Lời phê/Nhận xét trước đó</span>
                    <p className="text-slate-300 italic">"{selectedReq.comments}"</p>
                  </div>
                )}
              </div>

              {selectedReq.status === 'pending' && (
                <div className="space-y-4">
                  <div className="flex flex-col gap-1.5">
                    <span className="text-xs text-slate-400 font-semibold flex items-center gap-1">
                      <MessageSquare className="h-3.5 w-3.5" />
                      Ghi chú / Nhận xét phê duyệt
                    </span>
                    <textarea
                      placeholder="Viết hướng dẫn hoặc nhận xét phản hồi cho giảng viên..."
                      value={comments}
                      onChange={(e) => setComments(e.target.value)}
                      className="w-full p-2 bg-slate-900 text-slate-200 border border-slate-800 rounded text-xs outline-none focus:border-primary min-h-[90px] resize-none"
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      onClick={() => handleAction('approved')}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold flex items-center justify-center gap-1"
                      disabled={submitting}
                    >
                      <CheckCircle className="h-4 w-4" />
                      <span>Phê duyệt</span>
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => handleAction('rejected')}
                      className="flex-1 border-red-500/30 hover:bg-red-500/10 text-red-400 font-semibold flex items-center justify-center gap-1"
                      disabled={submitting}
                    >
                      <XCircle className="h-4 w-4" />
                      <span>Từ chối</span>
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-12 text-center flex flex-col items-center justify-center h-full gap-2.5 text-slate-500">
              <FileCheck className="h-12 w-12 text-slate-700 animate-pulse" />
              <p className="text-sm font-semibold">Chọn một yêu cầu phê duyệt ở danh sách bên cạnh.</p>
              <p className="text-xs text-slate-600 max-w-[220px]">
                Xem cấu hình chi tiết bài thực hành, viết đánh giá và thay đổi trạng thái phê duyệt bài.
              </p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
