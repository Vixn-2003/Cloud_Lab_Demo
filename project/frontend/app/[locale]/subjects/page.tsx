'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/src/i18n/navigation';
import { 
  GraduationCap, 
  BookOpen, 
  CheckCircle, 
  ArrowRight, 
  Search,
  Sparkles,
  Bookmark
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { getSubjects, getLabs, getSubmissions } from '@/lib/api';
import { enrichLabs } from '@/lib/data-enrichment';
import type { Subject, Lab } from '@/lib/types';

export default function SubjectsPage() {
  const tCommon = useTranslations('common');
  const [loading, setLoading] = useState(true);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [subjectStats, setSubjectStats] = useState<Record<string, { total: number; completed: number; scoreSum: number }>>({});
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        const [rawLabs, rawSubjects, rawSubmissions] = await Promise.all([
          getLabs(),
          getSubjects(),
          getSubmissions(),
        ]);

        const enrichedLabs = enrichLabs(rawLabs, rawSubmissions, rawSubjects);
        
        // Calculate dynamic stats
        const stats: Record<string, { total: number; completed: number; scoreSum: number }> = {};
        rawSubjects.forEach((sub) => {
          stats[sub.id] = { total: 0, completed: 0, scoreSum: 0 };
        });

        enrichedLabs.forEach((lab) => {
          if (lab.subjectId && stats[lab.subjectId]) {
            stats[lab.subjectId].total++;
            if (lab.status === 'completed') {
              stats[lab.subjectId].completed++;
              stats[lab.subjectId].scoreSum += lab.bestScore || 0;
            }
          }
        });

        setSubjects(rawSubjects);
        setSubjectStats(stats);
      } catch (err) {
        console.error('Failed to load subjects dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const filteredSubjects = subjects.filter(s => 
    s.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="p-6 space-y-6 animate-pulse">
        <div className="space-y-2">
          <div className="h-8 w-48 bg-muted rounded" />
          <div className="h-4 w-72 bg-muted rounded" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-44 bg-muted rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in-up">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <GraduationCap className="h-7 w-7 text-primary" />
            Chương trình đào tạo
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Theo dõi tiến độ học tập và kết quả của từng môn học chuyên ngành.
          </p>
        </div>

        {/* Search */}
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm môn học..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
      </div>

      {/* Grid of Subjects */}
      {filteredSubjects.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center rounded-xl border border-dashed border-border bg-card/20">
          <GraduationCap className="h-10 w-10 text-muted-foreground mb-4" />
          <h3 className="font-semibold text-lg">Không tìm thấy môn học nào</h3>
          <p className="text-sm text-muted-foreground mt-1">Thử thay đổi từ khóa tìm kiếm của bạn.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredSubjects.map((sub) => {
            const stats = subjectStats[sub.id] || { total: 0, completed: 0, scoreSum: 0 };
            const progress = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
            const avgScore = stats.completed > 0 ? Math.round(stats.scoreSum / stats.completed) : 0;

            return (
              <div 
                key={sub.id} 
                className="group rounded-xl border border-border bg-card/30 p-5 space-y-4 hover:border-primary/50 transition-all shadow-xs backdrop-blur-xs flex flex-col justify-between min-h-[200px]"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-[10px] uppercase font-mono tracking-wider bg-primary/5 text-primary border-primary/20 select-none">
                      <Bookmark className="mr-1 h-3 w-3" />
                      Chuyên ngành
                    </Badge>
                    {stats.completed === stats.total && stats.total > 0 ? (
                      <Badge variant="secondary" className="bg-success/15 text-success border-success/20 select-none">
                        <CheckCircle className="mr-1 h-3.5 w-3.5" />
                        Đã hoàn thành
                      </Badge>
                    ) : null}
                  </div>

                  <div>
                    <h3 className="font-bold text-lg group-hover:text-primary transition-colors line-clamp-1">{sub.title}</h3>
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5 font-medium">
                      <BookOpen className="h-3.5 w-3.5 text-muted-foreground" />
                      {stats.total} bài thực hành được giao
                    </p>
                  </div>
                </div>

                <div className="space-y-4 pt-2 border-t border-border/40">
                  {/* Progress */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-muted-foreground flex items-center gap-1">
                        Tiến độ học tập
                      </span>
                      <span className="text-foreground">{progress}% ({stats.completed}/{stats.total})</span>
                    </div>
                    <Progress value={progress} className="h-1.5" />
                  </div>

                  <div className="flex items-center justify-between gap-4 pt-1">
                    <div className="text-xs">
                      <span className="text-muted-foreground block font-medium">Điểm số trung bình</span>
                      <span className="text-sm font-bold text-foreground">
                        {avgScore > 0 ? `${avgScore} / 100` : '—'}
                      </span>
                    </div>

                    <Button size="sm" variant="outline" className="group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-all text-xs" asChild>
                      <Link href={`/labs?subjectId=${sub.id}`}>
                        Vào học
                        <ArrowRight className="ml-1 h-3.5 w-3.5" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Mini Tips */}
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-4.5 flex items-start gap-3">
        <Sparkles className="h-5 w-5 text-primary shrink-0 mt-0.5" />
        <div className="text-xs space-y-1 text-primary-foreground/90">
          <h4 className="font-bold">Mẹo tối ưu hóa học trình</h4>
          <p className="text-muted-foreground line-clamp-2">
            Hãy bắt đầu trước các môn học có tiến độ thấp để đảm bảo không bị dồn bài thực hành sát thời hạn nộp. Điểm số trung bình trên 80 là mức điểm tối thiểu để được cấp chứng chỉ bài thi.
          </p>
        </div>
      </div>
    </div>
  );
}
