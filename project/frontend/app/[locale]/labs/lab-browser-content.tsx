'use client';

import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations, useFormatter, useNow } from 'next-intl';
import { Link } from '@/src/i18n/navigation';
import {
  Search,
  X,
  Clock,
  Calendar,
  Play,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Eye,
  Network,
  FileCode,
  Terminal,
  Shield,
  Database,
  Globe,
  Sparkles,
  Info,
  TrendingUp,
  Award,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { ScoreBadge } from '@/components/score-display';
import { EmptyState } from '@/components/empty-state';
import { getLabs, getSubjects, getSubmissions, getFaculties, getActiveSession, getSessionLeaderboard, getSessionMcqs, submitSessionMcqs, getSessionMcqAnswers } from '@/lib/api';
import { enrichLabs } from '@/lib/data-enrichment';
import { LabBrowserSkeleton } from './lab-browser-skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Lab, LabStatus, Faculty, Subject } from '@/lib/types';

type FilterTab = 'all' | 'to_do' | 'in_progress' | 'submitted' | 'needs_attention' | 'completed' | 'overdue';

export function LabBrowserContent() {
  const t = useTranslations('labs');
  const tCommon = useTranslations('common');
  const format = useFormatter();
  const now = useNow();
  const searchParams = useSearchParams();
  
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [activeTab, setActiveTab] = useState<FilterTab>(
    (searchParams.get('status') as FilterTab) || 'all'
  );
  
  const [loading, setLoading] = useState(true);
  const [labs, setLabs] = useState<Lab[]>([]);
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedFacultyId, setSelectedFacultyId] = useState<string>('all');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('all');
  const [selectedEnv, setSelectedEnv] = useState<string>('all');

  const [activeSession, setActiveSession] = useState<any | null>(null);
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);

  // MCQ State
  const [sessionMcqs, setSessionMcqs] = useState<any[]>([]);
  const [selectedMcqAnswers, setSelectedMcqAnswers] = useState<Record<string, number>>({});
  const [mcqResult, setMcqResult] = useState<any | null>(null);
  const [mcqSubmitting, setMcqSubmitting] = useState(false);
  const [activeExamTab, setActiveExamTab] = useState<'coding' | 'mcq'>('coding');

  const handleSelectOption = (questionId: string, optionIndex: number) => {
    setSelectedMcqAnswers(prev => ({
      ...prev,
      [questionId]: optionIndex
    }));
  };

  const handleSubmitMcq = async () => {
    if (sessionMcqs.length === 0) return;
    setMcqSubmitting(true);
    try {
      const answersPayload = Object.keys(selectedMcqAnswers).map(qId => ({
        questionId: qId,
        selectedOption: selectedMcqAnswers[qId]
      }));
      const res = await submitSessionMcqs(activeSession.id, answersPayload);
      setMcqResult(res);
      alert(`Nộp bài trắc nghiệm thành công! Kết quả: ${res.correct}/${res.total} câu đúng (${res.score} điểm).`);
    } catch (e: any) {
      alert("Nộp bài trắc nghiệm lỗi: " + e.message);
    } finally {
      setMcqSubmitting(false);
    }
  };

  const handleOpenLeaderboard = async () => {
    if (!activeSession) return;
    setShowLeaderboard(true);
    setLeaderboardLoading(true);
    try {
      const data = await getSessionLeaderboard(activeSession.id);
      setLeaderboard(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLeaderboardLoading(false);
    }
  };

  useEffect(() => {
    async function loadData() {
      try {
        const [rawLabs, rawSubjects, rawSubmissions, rawFaculties, activeSess] = await Promise.all([
          getLabs(),
          getSubjects(),
          getSubmissions(),
          getFaculties(),
          getActiveSession().catch(() => null),
        ]);

        setActiveSession(activeSess);

        // Proactive environment fix for Winlocker VB6 analysis lab as per Cloud Lab Spec Section 19
        const rawLabsWithFix = rawLabs.map(lab => {
          if (lab.title.includes("Winlocker") || lab.id === "malware-analysis") {
            return {
              ...lab,
              environmentType: 'single_machine' as const
            };
          }
          return lab;
        });

        // LOCKING PROCESS: Filter labs to only show active session labs if student is in an active session
        const filteredRawLabs = activeSess && activeSess.labIds
          ? rawLabsWithFix.filter(lab => activeSess.labIds.includes(lab.id))
          : rawLabsWithFix;

        const enriched = enrichLabs(filteredRawLabs, rawSubmissions, rawSubjects);
        setLabs(enriched);
        setSubjects(rawSubjects);
        setFaculties(rawFaculties);

        if (activeSess) {
          try {
            const mcqs = await getSessionMcqs(activeSess.id);
            setSessionMcqs(mcqs);
            const answers = await getSessionMcqAnswers(activeSess.id);
            const answerMap: Record<string, number> = {};
            for (const ans of answers) {
              answerMap[ans.question_id] = ans.selected_option;
            }
            setSelectedMcqAnswers(answerMap);
          } catch (e) {
            console.error("Failed to load session MCQs:", e);
          }
        }

        // Auto-filter based on search query params if provided
        const facultyIdParam = searchParams.get('facultyId');
        const subjectIdParam = searchParams.get('subjectId');
        if (facultyIdParam) setSelectedFacultyId(facultyIdParam);
        if (subjectIdParam) setSelectedSubjectId(subjectIdParam);
      } catch (err) {
        console.error('Failed to load labs browser data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [searchParams]);

  // Countdown timer logic
  useEffect(() => {
    if (!activeSession) return;

    const timer = setInterval(() => {
      const diffMs = new Date(activeSession.end_time).getTime() - new Date().getTime();
      if (diffMs <= 0) {
        setTimeLeft('ĐÃ HẾT GIỜ THI');
        clearInterval(timer);
      } else {
        const hours = Math.floor(diffMs / (1000 * 60 * 60));
        const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
        
        const pad = (num: number) => num.toString().padStart(2, '0');
        setTimeLeft(`${pad(hours)}:${pad(minutes)}:${pad(seconds)}`);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [activeSession]);

  const handleFacultyChange = (facultyId: string) => {
    setSelectedFacultyId(facultyId);
    setSelectedSubjectId('all');
  };

  const handleSubjectChange = (subjectId: string) => {
    setSelectedSubjectId(subjectId);
  };

  const tabConfig: { value: FilterTab; label: string; statuses: LabStatus[] }[] = [
    { value: 'all', label: 'Tất cả', statuses: [] },
    { value: 'to_do', label: 'Chưa bắt đầu', statuses: ['not_started'] },
    { value: 'in_progress', label: 'Đang làm', statuses: ['in_progress'] },
    { value: 'submitted', label: 'Đã nộp', statuses: ['submitted'] },
    { value: 'needs_attention', label: 'Cần chú ý', statuses: ['needs_revision'] },
    { value: 'completed', label: 'Hoàn thành', statuses: ['completed'] },
    { value: 'overdue', label: 'Quá hạn', statuses: ['overdue'] },
  ];

  function formatDueDate(dateString?: string) {
    if (!dateString) return null;
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { text: 'Quá hạn', urgent: true };
    if (diffDays === 0) return { text: 'Hết hạn hôm nay', urgent: true };
    if (diffDays === 1) return { text: 'Hết hạn ngày mai', urgent: true };
    if (diffDays <= 3) return { text: `Còn ${diffDays} ngày`, urgent: true };
    return { text: `Còn ${diffDays} ngày`, urgent: false };
  }

  function formatTimeAgo(dateString?: string) {
    if (!dateString) return null;
    const date = new Date(dateString);
    return format.relativeTime(date, { now });
  }

  function getLabCTA(lab: Lab): { label: string; icon: any; variant: 'default' | 'outline' | 'secondary' | 'destructive' } {
    switch (lab.status) {
      case 'not_started':
        return { label: 'Bắt đầu lab', icon: Play, variant: 'default' };
      case 'in_progress':
        return { label: 'Tiếp tục làm lab', icon: ArrowRight, variant: 'default' };
      case 'submitted':
        return { label: 'Xem kết quả', icon: Eye, variant: 'outline' };
      case 'needs_revision':
        return { label: 'Sửa và nộp lại', icon: RotateCcw, variant: 'default' };
      case 'completed':
        return { label: 'Xem lại', icon: CheckCircle2, variant: 'outline' };
      case 'overdue':
        return { label: 'Xem chi tiết', icon: AlertTriangle, variant: 'destructive' };
      default:
        return { label: 'Mở bài lab', icon: ArrowRight, variant: 'outline' };
    }
  }

  function getStatusBadge(status?: LabStatus) {
    switch (status) {
      case 'not_started':
        return <Badge variant="secondary" className="font-semibold text-xs py-0.5 select-none border-border/80 bg-muted/40">Chưa bắt đầu</Badge>;
      case 'in_progress':
        return <Badge variant="secondary" className="bg-primary/15 text-primary border-primary/20 font-semibold text-xs py-0.5 select-none animate-pulse">Đang làm</Badge>;
      case 'submitted':
        return <Badge variant="secondary" className="bg-blue-500/15 text-blue-400 border-blue-500/20 font-semibold text-xs py-0.5 select-none">Đã nộp</Badge>;
      case 'needs_revision':
        return <Badge variant="secondary" className="bg-amber-500/15 text-amber-400 border-amber-500/20 font-semibold text-xs py-0.5 select-none">Cần chú ý</Badge>;
      case 'completed':
        return <Badge variant="secondary" className="bg-emerald-500/15 text-emerald-400 border-emerald-500/20 font-semibold text-xs py-0.5 select-none">Hoàn thành</Badge>;
      case 'overdue':
        return <Badge variant="destructive" className="font-semibold text-xs py-0.5 select-none">Quá hạn</Badge>;
      default:
        return null;
    }
  }

  // Get counts for each tab
  const tabCounts = useMemo(() => {
    const counts: Record<FilterTab, number> = {
      all: labs.length,
      to_do: 0,
      in_progress: 0,
      submitted: 0,
      needs_attention: 0,
      completed: 0,
      overdue: 0,
    };

    labs.forEach((lab) => {
      switch (lab.status) {
        case 'not_started':
          counts.to_do++;
          break;
        case 'in_progress':
          counts.in_progress++;
          break;
        case 'submitted':
          counts.submitted++;
          break;
        case 'needs_revision':
          counts.needs_attention++;
          break;
        case 'completed':
          counts.completed++;
          break;
        case 'overdue':
          counts.overdue++;
          break;
      }
    });

    return counts;
  }, [labs]);

  // Priority algorithm to pick the most relevant continue lab (CLOUD_LAB_MY_LABS_UI_UPGRADE_SPEC Section 6)
  const continueLab = useMemo(() => {
    if (labs.length === 0) return null;
    
    // 1. Needs revision
    const needsRevision = labs.find(l => l.status === 'needs_revision');
    if (needsRevision) return needsRevision;

    // 2. In progress
    const inProgress = labs.find(l => l.status === 'in_progress');
    if (inProgress) return inProgress;

    // 3. Overdue
    const overdue = labs.find(l => l.status === 'overdue');
    if (overdue) return overdue;

    // 4. Recently submitted or latest attempted (has attempt count)
    const recentlyAttempted = [...labs]
      .filter(l => l.attemptsCount && l.attemptsCount > 0)
      .sort((a, b) => {
        const dateA = a.lastEditedAt ? new Date(a.lastEditedAt).getTime() : 0;
        const dateB = b.lastEditedAt ? new Date(b.lastEditedAt).getTime() : 0;
        return dateB - dateA;
      });
    if (recentlyAttempted.length > 0) return recentlyAttempted[0];

    return null;
  }, [labs]);

  // Filter labs
  const filteredLabs = useMemo(() => {
    let result = [...labs];

    // Tab filter
    const tabStatuses = tabConfig.find((t) => t.value === activeTab)?.statuses || [];
    if (tabStatuses.length > 0) {
      result = result.filter((lab) => lab.status && tabStatuses.includes(lab.status));
    }

    // Faculty filter
    if (selectedFacultyId && selectedFacultyId !== 'all') {
      const allowedSubjectIds = subjects
        .filter((s) => s.facultyId === selectedFacultyId)
        .map((s) => s.id);
      result = result.filter((lab) => lab.subjectId && allowedSubjectIds.includes(lab.subjectId));
    }

    // Subject filter
    if (selectedSubjectId && selectedSubjectId !== 'all') {
      result = result.filter((lab) => lab.subjectId === selectedSubjectId);
    }

    // Environment Filter
    if (selectedEnv && selectedEnv !== 'all') {
      result = result.filter((lab) => lab.environmentType === selectedEnv);
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter((lab) =>
        lab.title.toLowerCase().includes(query) ||
        lab.subjectTitle?.toLowerCase().includes(query) ||
        lab.toolset?.some((t) => t.toLowerCase().includes(query))
      );
    }

    // Sort by urgency: overdue > needs_revision > due soon > in_progress > others
    result.sort((a, b) => {
      const statusPriority: Record<string, number> = {
        overdue: 0,
        needs_revision: 1,
        in_progress: 2,
        not_started: 3,
        submitted: 4,
        completed: 5,
      };
      const aPriority = statusPriority[a.status || 'not_started'] ?? 6;
      const bPriority = statusPriority[b.status || 'not_started'] ?? 6;
      
      if (aPriority !== bPriority) return aPriority - bPriority;
      
      // Secondary sort by due date
      if (a.dueDate && b.dueDate) {
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      }
      return 0;
    });

    return result;
  }, [activeTab, searchQuery, labs, selectedFacultyId, selectedSubjectId, selectedEnv, subjects]);

  // Tab dynamic empty state texts
  const emptyStateData = useMemo(() => {
    switch (activeTab) {
      case 'in_progress':
        return {
          title: 'Bạn chưa có bài lab đang làm',
          desc: 'Hãy bắt đầu một bài lab mới từ danh sách bên dưới để tích lũy kiến thức.'
        };
      case 'needs_attention':
        return {
          title: 'Không có bài lab nào cần chú ý',
          desc: 'Tuyệt vời! Bạn đang theo kịp tiến độ học tập và không có bài nào cần sửa.'
        };
      case 'completed':
        return {
          title: 'Bạn chưa hoàn thành bài lab nào',
          desc: 'Hoàn thành bài thực hành của bạn và nhận phản hồi chi tiết để xem tại đây.'
        };
      case 'overdue':
        return {
          title: 'Không có bài lab quá hạn',
          desc: 'Bạn đang làm bài rất xuất sắc và theo đúng tiến độ kế hoạch học tập.'
        };
      default:
        return {
          title: searchQuery ? 'Không tìm thấy bài lab phù hợp' : 'Không có bài lab nào',
          desc: searchQuery ? 'Hãy thử thay đổi từ khóa hoặc đặt lại các bộ lọc tìm kiếm.' : 'Chưa có bài lab nào được giao trong môn học này.'
        };
    }
  }, [activeTab, searchQuery]);

  if (loading) {
    return <LabBrowserSkeleton />;
  }

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)]">
      {/* Active Exam Session Banner */}
      {activeSession && (
        <div className="mx-6 mt-6 p-4 rounded-xl border border-red-500/25 bg-red-950/15 backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-4 animate-pulse-subtle shrink-0">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant="destructive" className="bg-red-650 text-white animate-pulse uppercase tracking-wider text-[9px] font-bold">Ca thi hoạt động</Badge>
              <h2 className="text-sm font-extrabold text-white">{activeSession.name}</h2>
            </div>
            <p className="text-[11px] text-slate-400">
              Phòng thi: <span className="text-slate-300 font-semibold">{activeSession.location || 'Phòng máy'}</span> | 
              Lớp: <span className="text-slate-300 font-semibold">{activeSession.class_name}</span> |
              Mã đề: <span className="text-primary font-bold font-mono">{activeSession.variant_code || 'Tự do'}</span>
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={handleOpenLeaderboard}
              className="border-red-500/30 hover:bg-red-500/20 text-red-400 hover:text-white flex items-center gap-1.5 h-10 px-3"
            >
              <Award className="h-4 w-4" />
              <span>Bảng xếp hạng</span>
            </Button>
            <div className="bg-slate-900/85 border border-slate-800 px-4 py-2 rounded-lg flex flex-col items-center min-w-[130px] h-10 justify-center">
              <span className="text-[9px] uppercase font-bold text-slate-500 leading-none mb-0.5">Thời gian còn lại</span>
              <span className="text-sm font-extrabold text-red-500 font-mono tracking-wider leading-none">{timeLeft}</span>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="p-6 pb-4 space-y-5 shrink-0 border-b border-border/40 bg-card/10">
        <div>
          <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">{t('title')}</h1>
          <p className="text-xs text-muted-foreground mt-1">
            {activeSession
              ? 'Lưu ý: Bạn đang tham gia ca thi thực hành. Hệ thống đã tự động khóa cứng danh sách bài thực hành của ca thi.'
              : 'Theo dõi tiến độ học tập, bắt đầu bài thực hành mới hoặc tiếp tục hoàn thiện các lab đang làm dở.'}
          </p>
        </div>

        {/* Continue Lab Section */}
        {continueLab && (
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4.5 space-y-3.5 shadow-xs relative overflow-hidden backdrop-blur-xs">
            <div className="absolute right-3 top-3 opacity-15 pointer-events-none">
              <TrendingUp className="h-28 w-28 text-primary" />
            </div>

            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5 select-none">
                <Sparkles className="h-4 w-4 animate-pulse" />
                Tiếp tục làm lab
              </h3>
              <div className="flex items-center gap-2">
                {getStatusBadge(continueLab.status)}
                {continueLab.dueDate && (
                  <span className={`text-[10px] font-semibold flex items-center gap-1 px-2 py-0.5 rounded-full border bg-background/50 border-border/60 ${
                    formatDueDate(continueLab.dueDate)?.urgent ? 'text-destructive border-destructive/25' : 'text-muted-foreground'
                  }`}>
                    <Calendar className="h-3 w-3" />
                    {formatDueDate(continueLab.dueDate)?.text}
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-1">
              <div className="space-y-1.5">
                <h2 className="text-lg font-extrabold text-foreground tracking-tight">{continueLab.title}</h2>
                <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground font-medium">
                  <span>{continueLab.subjectTitle}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    {continueLab.environmentType === 'single_machine' ? <Terminal className="h-3.5 w-3.5" /> : 
                     continueLab.environmentType === 'multi_node' ? <Network className="h-3.5 w-3.5" /> : <FileCode className="h-3.5 w-3.5" />}
                    {getEnvironmentLabel(continueLab)}
                  </span>
                  {continueLab.lastEditedAt && (
                    <>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        Lưu {formatTimeAgo(continueLab.lastEditedAt)}
                      </span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
                {continueLab.status === 'in_progress' && continueLab.progress !== undefined && (
                  <div className="text-right shrink-0 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground block">Tiến độ</span>
                    <span className="text-sm font-extrabold text-primary font-mono">{continueLab.progress}%</span>
                  </div>
                )}

                <Button size="sm" className="shadow-md shrink-0 w-full md:w-auto" asChild>
                  <Link href={`/labs/${continueLab.id}`}>
                    <Play className="mr-1.5 h-3.5 w-3.5 fill-current" />
                    Tiếp tục làm lab
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Tabs and Filters Row */}
        {!activeSession ? (
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as FilterTab)}>
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
              <TabsList className="h-9.5 p-1 bg-muted/30 border border-border/50 rounded-lg w-fit overflow-x-auto">
                {tabConfig.map((tab) => (
                  <TabsTrigger key={tab.value} value={tab.value} className="text-xs h-7.5 px-3 py-1 font-semibold transition-all">
                    {tab.label}
                    <span className={`ml-1.5 text-[10px] rounded-full px-1.5 py-0.2 select-none ${
                      tabCounts[tab.value] > 0
                        ? 'bg-primary/15 text-primary font-extrabold'
                        : 'text-muted-foreground opacity-55 font-normal'
                    }`}>
                      {tabCounts[tab.value]}
                    </span>
                  </TabsTrigger>
                ))}
              </TabsList>

              <div className="flex items-center gap-3 flex-wrap md:flex-nowrap">
                {/* Faculty Filter */}
                <Select value={selectedFacultyId} onValueChange={handleFacultyChange}>
                  <SelectTrigger id="faculty-select" size="sm" className="w-[130px] bg-background/50 border-border/70 hover:bg-accent/40 text-xs h-9">
                    <SelectValue placeholder="Khoa" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="text-xs">Tất cả Khoa</SelectItem>
                    {faculties.map((f) => (
                      <SelectItem key={f.id} value={f.id} className="text-xs">
                        {f.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Subject Filter */}
                <Select value={selectedSubjectId} onValueChange={handleSubjectChange}>
                  <SelectTrigger id="subject-select" size="sm" className="w-[140px] bg-background/50 border-border/70 hover:bg-accent/40 text-xs h-9" disabled={selectedFacultyId === 'all'}>
                    <SelectValue placeholder="Môn học" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="text-xs">Tất cả Môn học</SelectItem>
                    {subjects
                      .filter((s) => s.facultyId === selectedFacultyId)
                      .map((s) => (
                        <SelectItem key={s.id} value={s.id} className="text-xs">
                          {s.title}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>

                {/* Environment Filter */}
                <Select value={selectedEnv} onValueChange={setSelectedEnv}>
                  <SelectTrigger id="env-type-select" size="sm" className="w-[150px] bg-background/50 border-border/70 hover:bg-accent/40 text-xs h-9">
                    <SelectValue placeholder="Loại môi trường" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="text-xs">Tất cả Môi trường</SelectItem>
                    <SelectItem value="single_runtime" className="text-xs">Python/Java Runtime</SelectItem>
                    <SelectItem value="single_machine" className="text-xs">Ubuntu CLI (VM)</SelectItem>
                    <SelectItem value="multi_node" className="text-xs">Mạng nhiều node</SelectItem>
                  </SelectContent>
                </Select>

                {/* Search */}
                <div className="relative w-full md:w-64 min-w-[180px]">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder={t('searchPlaceholder')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 h-9 text-xs"
                  />
                  {searchQuery && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
                      onClick={() => setSearchQuery('')}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </Tabs>
        ) : (
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">
              Bài thi thực hành được chỉ định:
            </span>
            {sessionMcqs.length > 0 && (
              <div className="flex items-center bg-slate-900/60 p-1 border border-slate-800 rounded-lg shrink-0">
                <Button
                  variant={activeExamTab === 'coding' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveExamTab('coding')}
                  className="text-xs h-7 px-3 py-1 font-semibold"
                >
                  Phần Lập trình ({labs.length})
                </Button>
                <Button
                  variant={activeExamTab === 'mcq' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveExamTab('mcq')}
                  className="text-xs h-7 px-3 py-1 font-semibold flex items-center gap-1"
                >
                  <span>Phần Trắc nghiệm ({sessionMcqs.length})</span>
                  {mcqResult && <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[9px] h-4 py-0 px-1">{mcqResult.score}đ</Badge>}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Labs List */}
      <div className="flex-1 overflow-y-auto px-6 py-5 bg-background/25">
        {activeExamTab === 'mcq' ? (
          <div className="max-w-3xl mx-auto space-y-6">
            <Card className="bg-slate-950/40 border-slate-900 shadow-md">
              <CardHeader>
                <CardTitle className="text-white text-base font-bold">Phần thi Trắc nghiệm (MCQ Exam)</CardTitle>
                <CardDescription className="text-slate-400">
                  Trả lời toàn bộ câu hỏi trắc nghiệm dưới đây và nhấn "Nộp bài trắc nghiệm" để hoàn tất.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {sessionMcqs.map((q, idx) => {
                  return (
                    <div key={q.id} className="space-y-3 p-4 bg-slate-900/40 border border-slate-800/80 rounded-lg">
                      <h4 className="text-slate-200 font-semibold text-sm">
                        Câu {idx + 1}: {q.question_text}
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1.5">
                        {q.options.map((option: string, optIdx: number) => {
                          const isSelected = selectedMcqAnswers[q.id] === optIdx;
                          return (
                            <button
                              key={optIdx}
                              type="button"
                              onClick={() => handleSelectOption(q.id, optIdx)}
                              className={`p-3 text-left text-xs rounded border transition-all ${
                                isSelected
                                  ? 'bg-primary/10 border-primary text-primary font-bold shadow-sm shadow-primary/5'
                                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                              }`}
                            >
                              {option}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}

                <div className="pt-4 border-t border-slate-900 flex justify-between items-center">
                  <span className="text-xs text-slate-500">
                    Đã tích chọn: {Object.keys(selectedMcqAnswers).length}/{sessionMcqs.length} câu
                  </span>
                  <Button
                    onClick={handleSubmitMcq}
                    disabled={mcqSubmitting || Object.keys(selectedMcqAnswers).length === 0}
                    className="bg-primary text-primary-foreground font-bold flex items-center gap-1.5"
                  >
                    {mcqSubmitting ? <RotateCcw className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                    <span>Nộp bài trắc nghiệm</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : filteredLabs.length === 0 ? (
          <EmptyState
            icon={<Info className="h-8 w-8 text-muted-foreground" />}
            title={emptyStateData.title}
            description={emptyStateData.desc}
            action={
              (searchQuery || selectedFacultyId !== 'all' || selectedSubjectId !== 'all' || selectedEnv !== 'all') && (
                <Button variant="outline" size="sm" onClick={() => {
                  setSearchQuery('');
                  setSelectedFacultyId('all');
                  setSelectedSubjectId('all');
                  setSelectedEnv('all');
                }}>
                  Đặt lại bộ lọc
                </Button>
              )
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 lab-grid-container">
            {filteredLabs.map((lab) => (
              <LabCard
                key={lab.id}
                lab={lab}
                formatDueDate={formatDueDate}
                formatTimeAgo={formatTimeAgo}
                getLabCTA={getLabCTA}
                getStatusBadge={getStatusBadge}
              />
            ))}
          </div>
        )}
      </div>

      {showLeaderboard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-slate-950 border border-slate-900 w-full max-w-4xl rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-900 flex items-center justify-between bg-slate-950/80 sticky top-0 z-10">
              <div>
                <h3 className="text-white font-extrabold text-base flex items-center gap-2">
                  <Award className="h-5 w-5 text-yellow-500 animate-pulse" />
                  Bảng xếp hạng ca thi (ACM-ICPC Mode)
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Xếp hạng dựa trên số bài giải đúng (Accepted) và tổng thời gian phạt (Penalty).
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowLeaderboard(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              {leaderboard[0]?.isFrozen && (
                <div className="bg-amber-950/20 border border-amber-500/25 p-3 rounded-lg flex items-start gap-2.5">
                  <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-bold text-amber-400">Bảng xếp hạng Đang bị đóng băng!</h4>
                    <p className="text-[11px] text-slate-400">
                      Thời gian thi đã bước vào giai đoạn đóng băng (Freeze Window). Kết quả nộp bài mới của bạn và các thí sinh khác sẽ hiển thị là Đang chấm (?) trên bảng điểm công khai của học sinh.
                    </p>
                  </div>
                </div>
              )}

              {leaderboardLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
                  <RefreshCw className="h-8 w-8 animate-spin text-primary" />
                  <span className="text-xs font-medium">Đang tải bảng điểm xếp hạng...</span>
                </div>
              ) : leaderboard.length === 0 ? (
                <div className="text-center py-20 text-slate-500 text-xs font-semibold">
                  Chưa có dữ liệu xếp hạng của ca thi này.
                </div>
              ) : (
                <div className="overflow-x-auto border border-slate-900 rounded-lg">
                  <table className="w-full text-xs text-left text-slate-300">
                    <thead className="text-[10px] uppercase bg-slate-950 text-slate-400 border-b border-slate-900">
                      <tr>
                        <th className="px-4 py-2.5 font-bold text-center w-12">Hạng</th>
                        <th className="px-4 py-2.5 font-bold">MSSV</th>
                        <th className="px-4 py-2.5 font-bold">Thí sinh</th>
                        <th className="px-4 py-2.5 font-bold text-center w-16">Đề</th>
                        <th className="px-4 py-2.5 font-bold text-center w-24">Bài giải được</th>
                        <th className="px-4 py-2.5 font-bold text-center w-24">Tổng Penalty</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leaderboard.map((item, idx) => {
                        const isTop3 = item.rank <= 3;
                        const rankColor = 
                          item.rank === 1 ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                          item.rank === 2 ? 'bg-slate-300/20 text-slate-300 border-slate-300/30' :
                          item.rank === 3 ? 'bg-amber-600/20 text-amber-500 border-amber-600/30' : 
                          'bg-slate-900 text-slate-400 border-slate-800';

                        return (
                          <tr 
                            key={item.userId} 
                            className={`border-b border-slate-900 hover:bg-slate-900/30 transition-colors ${
                              item.userId === user?.id ? 'bg-primary/5 border-l-2 border-l-primary' : ''
                            }`}
                          >
                            <td className="px-4 py-3 text-center">
                              <Badge className={`font-mono font-bold w-6 h-6 rounded-full flex items-center justify-center p-0 border ${rankColor}`}>
                                {item.rank}
                              </Badge>
                            </td>
                            <td className="px-4 py-3 font-mono font-bold text-white">{item.studentCode || '—'}</td>
                            <td className="px-4 py-3 font-semibold text-white">
                              <div className="flex items-center gap-2">
                                <span>{item.fullName}</span>
                                {item.userId === user?.id && (
                                  <Badge className="bg-primary/10 text-primary border-primary/20 text-[9px]">Bạn</Badge>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <Badge variant="outline" className="border-slate-800 text-slate-400 font-mono text-[10px]">
                                {item.variantCode || 'Mặc định'}
                              </Badge>
                            </td>
                            <td className="px-4 py-3 text-center text-sm font-extrabold text-emerald-400">
                              {item.solvedCount}
                            </td>
                            <td className="px-4 py-3 text-center font-mono font-semibold text-slate-300">
                              {item.totalPenalty} <span className="text-[10px] text-slate-500">phút</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            
            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-900 flex justify-end bg-slate-950">
              <Button onClick={() => setShowLeaderboard(false)} className="bg-slate-900 hover:bg-slate-800 text-white font-semibold">
                Đóng bảng xếp hạng
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function getEnvironmentLabel(lab: Lab) {
  if (lab.environmentType === 'single_machine') {
    return 'Ubuntu CLI VM';
  }
  if (lab.environmentType === 'multi_node') {
    return 'Mạng nhiều node';
  }
  
  if (lab.title.toLowerCase().includes('python') || lab.toolset?.some(t => t.toLowerCase().includes('python'))) {
    return 'Python Runtime';
  }
  if (lab.title.toLowerCase().includes('java') || lab.toolset?.some(t => t.toLowerCase().includes('java'))) {
    return 'Java Runtime';
  }
  if (lab.title.toLowerCase().includes('bash') || lab.title.toLowerCase().includes('shell') || lab.toolset?.some(t => t.toLowerCase().includes('bash'))) {
    return 'Bash Runtime';
  }
  return 'Sandboxed Runtime';
}

function getEnvIcon(envType?: string) {
  switch (envType) {
    case 'single_machine':
      return <Terminal className="h-3.5 w-3.5 text-sky-400" />;
    case 'multi_node':
      return <Network className="h-3.5 w-3.5 text-purple-400" />;
    default:
      return <FileCode className="h-3.5 w-3.5 text-emerald-400" />;
  }
}

interface LabCardProps {
  lab: Lab;
  formatDueDate: (dateString?: string) => { text: string; urgent: boolean } | null;
  formatTimeAgo: (dateString?: string) => string | null;
  getLabCTA: (lab: Lab) => { label: string; icon: any; variant: 'default' | 'outline' | 'secondary' | 'destructive' };
  getStatusBadge: (status?: LabStatus) => JSX.Element | null;
}

function LabCard({ lab, formatDueDate, formatTimeAgo, getLabCTA, getStatusBadge }: LabCardProps) {
  const cta = getLabCTA(lab);
  const dueInfo = formatDueDate(lab.dueDate);
  const lastEdited = formatTimeAgo(lab.lastEditedAt);
  const isUrgent = lab.status === 'overdue' || lab.status === 'needs_revision';
  
  // Estimate time for labs (CLOUD_LAB_MY_LABS_UI_UPGRADE_SPEC Section 9)
  const estTime = lab.environmentType === 'single_machine' || lab.environmentType === 'multi_node' ? 45 : 30;

  return (
    <div
      className={`group lab-card rounded-xl border bg-card/30 p-5 transition-all hover:border-primary/50 hover:-translate-y-0.5 flex flex-col justify-between md:flex-row gap-4.5 ${
        isUrgent ? 'border-destructive/30 bg-destructive/2' : 'border-border'
      }`}
    >
      <div className="flex-1 min-w-0 space-y-3">
        {/* Header: Status + Subject */}
        <div className="flex items-center gap-2 flex-wrap">
          {getStatusBadge(lab.status)}
          {lab.subjectTitle && (
            <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider select-none">{lab.subjectTitle}</span>
          )}
        </div>

        {/* Title */}
        <h3 className="text-base font-bold text-foreground group-hover:text-primary transition-colors tracking-tight line-clamp-1">{lab.title}</h3>

        {/* Environment badges */}
        <div className="flex items-center gap-2 flex-wrap pt-0.5">
          <Badge variant="outline" className="text-[10px] font-semibold py-0.5 select-none bg-background/50 border-border/70 flex items-center gap-1.5">
            {getEnvIcon(lab.environmentType)}
            {getEnvironmentLabel(lab)}
          </Badge>
          
          <Badge variant="outline" className="text-[10px] font-semibold py-0.5 select-none bg-background/50 border-border/70 flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3 text-emerald-400" />
            Tự động chấm
          </Badge>

          {lab.toolset && lab.toolset.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {lab.toolset.map((tool) => (
                <Badge key={tool} variant="secondary" className="text-[10px] font-mono font-medium py-0 px-2 bg-accent/40 text-accent-foreground border-none select-none">
                  {tool}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Metadata Row */}
        <div className="flex items-center gap-4.5 flex-wrap text-xs text-muted-foreground font-medium pt-1.5 border-t border-border/40">
          {/* Due Date */}
          {dueInfo ? (
            <span className={`flex items-center gap-1.5 ${dueInfo.urgent ? 'text-destructive font-bold' : ''}`}>
              <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              {dueInfo.text}
            </span>
          ) : (
            <span className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 shrink-0" />
              Không có hạn nộp
            </span>
          )}

          {/* Estimate time */}
          <span className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 shrink-0" />
            Ước tính {estTime} phút
          </span>

          {/* Attempts count */}
          <span className="flex items-center gap-1.5 select-none">
            <Award className="h-3.5 w-3.5 shrink-0" />
            {lab.attemptsCount && lab.attemptsCount > 0 ? `${lab.attemptsCount} lần nộp` : '0 lần nộp'}
          </span>

          {/* Scores */}
          {lab.status === 'completed' && lab.bestScore !== undefined && (
            <span className="flex items-center gap-1.5 font-bold text-emerald-400/90 bg-emerald-500/5 px-2 py-0.5 rounded-md border border-emerald-500/10 select-none">
              Điểm tốt nhất: {lab.bestScore}/100
            </span>
          )}

          {lab.status === 'needs_revision' && lab.bestScore !== undefined && (
            <span className="flex items-center gap-1.5 font-bold text-amber-400/90 bg-amber-500/5 px-2 py-0.5 rounded-md border border-amber-500/10 select-none">
              Điểm gần nhất: {lab.bestScore}/100 (Sai 2 test case)
            </span>
          )}

          {lab.status === 'submitted' && lab.bestScore !== undefined && (
            <span className="flex items-center gap-1.5 font-bold text-blue-400/90 bg-blue-500/5 px-2 py-0.5 rounded-md border border-blue-500/10 select-none">
              Điểm gần nhất: {lab.bestScore}/100
            </span>
          )}

          {/* Last Activity */}
          {lastEdited && (
            <span className="flex items-center gap-1 text-[11px] select-none text-muted-foreground/80 md:ml-auto">
              Lưu {lastEdited}
            </span>
          )}
        </div>

        {/* Progress Bar (for in-progress labs) */}
        {lab.status === 'in_progress' && lab.progress !== undefined && (
          <div className="space-y-1 max-w-xs pt-1">
            <div className="flex items-center justify-between text-[11px] font-semibold">
              <span className="text-muted-foreground">Tiến độ làm bài</span>
              <span className="text-primary font-mono">{lab.progress}%</span>
            </div>
            <Progress value={lab.progress} className="h-1" />
          </div>
        )}
      </div>

      {/* CTA Button */}
      <div className="flex items-center shrink-0 w-full md:w-auto pt-2 md:pt-0">
        <Button variant={cta.variant} size="sm" asChild className="w-full md:w-auto shadow-xs font-semibold select-none group-hover:scale-[1.02] transition-transform">
          <Link href={`/labs/${lab.id}`}>
            <cta.icon className="mr-1.5 h-3.5 w-3.5 fill-current" />
            {cta.label}
          </Link>
        </Button>
      </div>
    </div>
  );
}
