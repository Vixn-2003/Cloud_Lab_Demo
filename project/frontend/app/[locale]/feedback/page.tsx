'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/src/i18n/navigation';
import { 
  MessageSquare, 
  Calendar, 
  ChevronRight, 
  Eye, 
  CheckCircle,
  AlertTriangle,
  Award,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScoreBadge } from '@/components/score-display';
import { getSubmissions, getLabs } from '@/lib/api';
import type { Attempt, Lab } from '@/lib/types';

export default function FeedbackPage() {
  const [loading, setLoading] = useState(true);
  const [feedbacks, setFeedbacks] = useState<Attempt[]>([]);
  const [labMap, setLabMap] = useState<Map<string, Lab>>(new Map());

  useEffect(() => {
    async function loadData() {
      try {
        const [rawLabs, rawSubmissions] = await Promise.all([
          getLabs(),
          getSubmissions(),
        ]);
        const map = new Map(rawLabs.map((l) => [l.id, l]));
        setLabMap(map);

        // Filter attempts that have feedback or graded score
        const list = rawSubmissions
          .filter(s => s.feedback || s.score !== undefined)
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        
        setFeedbacks(list);
      } catch (err) {
        console.error('Failed to load feedback page:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="p-6 space-y-6 animate-pulse">
        <div className="space-y-2">
          <div className="h-8 w-48 bg-muted rounded" />
          <div className="h-4 w-72 bg-muted rounded" />
        </div>
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-32 bg-muted rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in-up">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <MessageSquare className="h-7 w-7 text-primary" />
          Phản hồi của giảng viên
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Xem lại các nhận xét, đóng góp ý kiến và hướng dẫn khắc phục từ hội đồng chuyên môn.
        </p>
      </div>

      {/* Feedback List */}
      {feedbacks.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-16 text-center rounded-xl border border-dashed border-border bg-card/20">
          <MessageSquare className="h-10 w-10 text-muted-foreground mb-4" />
          <h3 className="font-semibold text-lg">Chưa có phản hồi nào</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm">
            Nộp bài thực hành của bạn để giảng viên và hệ thống kiểm tra, phản hồi sẽ hiển thị chi tiết tại đây.
          </p>
          <Button className="mt-4" asChild>
            <Link href="/labs">Đến Bài lab của tôi</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-4 feedback-list-container">
          {feedbacks.map((f) => {
            const labObj = labMap.get(f.lab_id);
            const isPassed = f.score !== undefined && f.score >= 80;
            const feedbackText = f.feedback || (isPassed 
              ? "Bài làm rất tốt, các testcase đều vượt qua hoàn hảo. Hãy tiếp tục phát huy!" 
              : "Có một số testcase chưa đạt yêu cầu. Vui lòng kiểm tra lại log kiểm thử và chỉnh sửa mã nguồn.");

            return (
              <div 
                key={f.id} 
                className={`rounded-xl border bg-card/30 p-5 space-y-3.5 hover:border-primary/50 transition-all shadow-xs backdrop-blur-xs flex flex-col md:flex-row justify-between items-start gap-4 ${
                  !isPassed ? 'border-warning/20 hover:border-warning/45' : 'border-border'
                }`}
              >
                <div className="space-y-2.5 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className="text-[10px] uppercase font-mono bg-accent/40 text-accent-foreground border-border/60">
                      {labObj?.title || 'Bài thực hành'}
                    </Badge>
                    <Badge variant="secondary" className={
                      isPassed ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'
                    }>
                      {isPassed ? (
                        <>
                          <CheckCircle className="mr-1 h-3.5 w-3.5" />
                          Đạt yêu cầu
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="mr-1 h-3.5 w-3.5" />
                          Cần chỉnh sửa
                        </>
                      )}
                    </Badge>
                    <ScoreBadge score={f.score} />
                  </div>

                  <div className="p-3.5 rounded-lg bg-background/50 border border-border/30 font-medium text-sm text-foreground/90 leading-relaxed">
                    {feedbackText}
                  </div>

                  <div className="flex items-center gap-3 text-xs text-muted-foreground select-none">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {new Date(f.created_at).toLocaleDateString('vi-VN')}
                    </span>
                    <span>•</span>
                    <span>{new Date(f.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>

                <div className="shrink-0 flex md:flex-col gap-2 w-full md:w-auto items-end">
                  <Button size="sm" variant="outline" className="text-xs w-full md:w-auto" asChild>
                    <Link href={`/submissions/${f.id}`}>
                      <Eye className="mr-1.5 h-3.5 w-3.5" />
                      Xem bài nộp
                    </Link>
                  </Button>
                  {!isPassed && (
                    <Button size="sm" className="text-xs w-full md:w-auto" asChild>
                      <Link href={`/labs/${f.lab_id}`}>
                        Sửa & Nộp lại
                        <ChevronRight className="ml-1 h-3.5 w-3.5" />
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Mini Tips */}
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-4.5 flex items-start gap-3">
        <Award className="h-5 w-5 text-primary shrink-0 mt-0.5" />
        <div className="text-xs space-y-1 text-primary-foreground/90">
          <h4 className="font-bold flex items-center gap-1">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            Tầm quan trọng của phản hồi
          </h4>
          <p className="text-muted-foreground">
            Phản hồi từ hội đồng chuyên môn là cơ sở để bạn khắc phục các lỗ hổng kiến thức và hoàn thiện kỹ năng thực tế. Lịch sử bài làm xuất sắc cũng là yếu tố đánh giá năng lực tuyển dụng sau khóa học.
          </p>
        </div>
      </div>
    </div>
  );
}
