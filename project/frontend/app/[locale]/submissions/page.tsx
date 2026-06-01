'use client';

import { useState, useMemo, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations, useFormatter, useNow } from 'next-intl';
import { Link } from '@/src/i18n/navigation';
import {
  Search,
  X,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  RotateCcw,
  Eye,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScoreBadge } from '@/components/score-display';
import { EmptyState } from '@/components/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { getLabs, getSubmissions, getSubjects, getFaculties } from '@/lib/api';
import type { Attempt, Lab, Faculty, Subject } from '@/lib/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type FilterTab = 'all' | 'graded' | 'passed' | 'needs_revision' | 'pending';

// Group attempts by lab using labMap
function groupAttemptsByLab(attempts: Attempt[], labMap: Map<string, Lab>) {
  const groups: Record<string, { lab: Lab | undefined; attempts: Attempt[] }> = {};
  
  attempts.forEach((attempt) => {
    if (!groups[attempt.lab_id]) {
      groups[attempt.lab_id] = {
        lab: labMap.get(attempt.lab_id),
        attempts: [],
      };
    }
    groups[attempt.lab_id].attempts.push(attempt);
  });

  // Sort attempts within each group by date (newest first)
  Object.values(groups).forEach((group) => {
    group.attempts.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  });

  return groups;
}

function AttemptsPageContent() {
  const t = useTranslations('submissions');
  const tStatus = useTranslations('status');
  const tCommon = useTranslations('common');
  const format = useFormatter();
  const now = useNow();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [activeTab, setActiveTab] = useState<FilterTab>(
    (searchParams.get('status') as FilterTab) || 'all'
  );

  const [loading, setLoading] = useState(true);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [labMap, setLabMap] = useState<Map<string, Lab>>(new Map());
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [labs, setLabs] = useState<Lab[]>([]);
  const [selectedFacultyId, setSelectedFacultyId] = useState<string>('all');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('all');
  const [selectedLabId, setSelectedLabId] = useState<string>('all');

  useEffect(() => {
    async function loadData() {
      try {
        const [rawLabs, rawSubmissions, rawSubjects, rawFaculties] = await Promise.all([
          getLabs(),
          getSubmissions(),
          getSubjects(),
          getFaculties(),
        ]);
        const map = new Map(rawLabs.map((l) => [l.id, l]));
        setLabMap(map);
        setLabs(rawLabs);
        setSubjects(rawSubjects);
        setFaculties(rawFaculties);

        // Group attempts by lab to number them correctly
        const grouped = {} as Record<string, Attempt[]>;
        rawSubmissions.forEach((sub) => {
          if (!grouped[sub.lab_id]) grouped[sub.lab_id] = [];
          grouped[sub.lab_id].push(sub);
        });

        const enriched = rawSubmissions.map((sub) => {
          const labAttempts = grouped[sub.lab_id] || [];
          const sorted = [...labAttempts].sort(
            (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          );
          const attemptIndex = sorted.findIndex((a) => a.id === sub.id);
          return {
            ...sub,
            lab_title: map.get(sub.lab_id)?.title || sub.lab_title || 'Lab Task',
            attemptNumber: attemptIndex !== -1 ? attemptIndex + 1 : 1,
            canRetry: sub.status !== 'graded' || (sub.score !== undefined && sub.score < 100),
          };
        });

        setAttempts(enriched);
      } catch (err) {
        console.error('Failed to load submissions:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleFacultyChange = (facultyId: string) => {
    setSelectedFacultyId(facultyId);
    setSelectedSubjectId('all');
    setSelectedLabId('all');
  };

  const handleSubjectChange = (subjectId: string) => {
    setSelectedSubjectId(subjectId);
    setSelectedLabId('all');
  };

  const handleLabChange = (labId: string) => {
    setSelectedLabId(labId);
  };

  const tabConfig: { value: FilterTab; label: string }[] = [
    { value: 'all', label: t('tabs.all') },
    { value: 'graded', label: t('tabs.graded') },
    { value: 'passed', label: t('tabs.passed') },
    { value: 'needs_revision', label: t('tabs.needsRevision') },
    { value: 'pending', label: t('tabs.pending') },
  ];

  function formatTimeAgo(dateString: string) {
    const date = new Date(dateString);
    return format.relativeTime(date, { now });
  }

  function getAttemptCTA(attempt: Attempt) {
    if (attempt.status === 'pending') {
      return { label: tStatus('pending'), icon: Clock, variant: 'secondary' as const };
    }
    if (attempt.status === 'needs_revision' && attempt.canRetry) {
      return { label: t('fixResubmit'), icon: RotateCcw, variant: 'default' as const };
    }
    return { label: t('viewFeedback'), icon: Eye, variant: 'outline' as const };
  }

  function getStatusBadge(attempt: Attempt) {
    const isPassed = attempt.score !== undefined && attempt.score >= 80;
    
    switch (attempt.status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-info/10 text-info border-info/20">{tStatus('pending')}</Badge>;
      case 'graded':
        return isPassed 
          ? <Badge variant="secondary" className="bg-success/10 text-success border-success/20">{tStatus('passed')}</Badge>
          : <Badge variant="secondary" className="bg-warning/10 text-warning border-warning/20">{tStatus('graded')}</Badge>;
      case 'needs_revision':
        return <Badge variant="secondary" className="bg-warning/10 text-warning border-warning/20">{tStatus('needsRevision')}</Badge>;
      case 'failed':
        return <Badge variant="destructive">{tStatus('failed')}</Badge>;
      default:
        return null;
    }
  }

  // Get counts for each tab
  const tabCounts = useMemo(() => {
    const counts: Record<FilterTab, number> = {
      all: attempts.length,
      graded: 0,
      passed: 0,
      needs_revision: 0,
      pending: 0,
    };

    attempts.forEach((attempt) => {
      if (attempt.status === 'graded') {
        counts.graded++;
        if (attempt.score !== undefined && attempt.score >= 80) {
          counts.passed++;
        }
      } else if (attempt.status === 'needs_revision') {
        counts.needs_revision++;
      } else if (attempt.status === 'pending') {
        counts.pending++;
      }
    });

    return counts;
  }, [attempts]);

  // Filter attempts
  const filteredAttempts = useMemo(() => {
    let result = [...attempts];

    // Tab filter
    if (activeTab !== 'all') {
      result = result.filter((attempt) => {
        if (activeTab === 'passed') {
          return attempt.status === 'graded' && attempt.score !== undefined && attempt.score >= 80;
        }
        return attempt.status === activeTab;
      });
    }

    // Faculty filter
    if (selectedFacultyId && selectedFacultyId !== 'all') {
      const allowedSubjectIds = subjects
        .filter((s) => s.facultyId === selectedFacultyId)
        .map((s) => s.id);
      result = result.filter((attempt) => {
        const labObj = labMap.get(attempt.lab_id);
        return labObj?.subjectId && allowedSubjectIds.includes(labObj.subjectId);
      });
    }

    // Subject filter
    if (selectedSubjectId && selectedSubjectId !== 'all') {
      result = result.filter((attempt) => {
        const labObj = labMap.get(attempt.lab_id);
        return labObj?.subjectId === selectedSubjectId;
      });
    }

    // Lab filter
    if (selectedLabId && selectedLabId !== 'all') {
      result = result.filter((attempt) => attempt.lab_id === selectedLabId);
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter((attempt) =>
        attempt.lab_title?.toLowerCase().includes(query)
      );
    }

    // Sort by date (newest first)
    result.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    return result;
  }, [activeTab, searchQuery, attempts, selectedFacultyId, selectedSubjectId, selectedLabId, subjects, labMap]);

  // Group by lab for display
  const groupedAttempts = useMemo(() => groupAttemptsByLab(filteredAttempts, labMap), [filteredAttempts, labMap]);

  if (loading) {
    return (
      <div className="p-6 space-y-6 animate-pulse">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="flex gap-4">
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-9 w-40" />
        </div>
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <CardPlaceholder key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in-up p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t('title')}</h1>
        <p className="text-muted-foreground">
          {t('subtitle')}
        </p>
      </div>

      {/* Tabs and Search */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as FilterTab)}>
          <TabsList className="h-9">
            {tabConfig.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value} className="text-sm">
                {tab.label}
                {tabCounts[tab.value] > 0 && (
                  <span className="ml-1.5 text-xs text-muted-foreground">
                    {tabCounts[tab.value]}
                  </span>
                )}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Faculty Filter */}
          <Select value={selectedFacultyId} onValueChange={handleFacultyChange}>
            <SelectTrigger size="sm" className="w-[130px] bg-background/50 border-border/70 hover:bg-accent/40 text-xs h-9">
              <SelectValue placeholder="All Faculties" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">All Faculties</SelectItem>
              {faculties.map((f) => (
                <SelectItem key={f.id} value={f.id} className="text-xs">
                  {f.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Subject Filter */}
          <Select value={selectedSubjectId} onValueChange={handleSubjectChange}>
            <SelectTrigger size="sm" className="w-[140px] bg-background/50 border-border/70 hover:bg-accent/40 text-xs h-9" disabled={selectedFacultyId === 'all'}>
              <SelectValue placeholder="All Subjects" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">All Subjects</SelectItem>
              {subjects
                .filter((s) => s.facultyId === selectedFacultyId)
                .map((s) => (
                  <SelectItem key={s.id} value={s.id} className="text-xs">
                    {s.title}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>

          {/* Lab Filter */}
          <Select value={selectedLabId} onValueChange={handleLabChange}>
            <SelectTrigger size="sm" className="w-[150px] bg-background/50 border-border/70 hover:bg-accent/40 text-xs h-9" disabled={selectedSubjectId === 'all'}>
              <SelectValue placeholder="All Labs" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">All Labs</SelectItem>
              {labs
                .filter((l) => l.subjectId === selectedSubjectId)
                .map((l) => (
                  <SelectItem key={l.id} value={l.id} className="text-xs">
                    {l.title}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>

          {/* Search */}
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t('searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9"
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

      {/* Attempts grouped by Lab */}
      {filteredAttempts.length === 0 ? (
        <EmptyState
          icon={<FileText className="h-8 w-8 text-muted-foreground" />}
          title={searchQuery ? t('noAttemptsFound') : t('noAttemptsInCategory')}
          description={
            searchQuery
              ? t('adjustSearch')
              : activeTab === 'all'
              ? t('submitLabToSee')
              : t('noAttemptsMatch')
          }
          action={
            searchQuery ? (
              <Button variant="outline" onClick={() => setSearchQuery('')}>
                {t('clearSearch')}
              </Button>
            ) : (
              <Button asChild>
                <Link href="/labs">{t('goToMyLabs')}</Link>
              </Button>
            )
          }
        />
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedAttempts).map(([labId, { lab, attempts: labAttempts }]) => (
            <div key={labId} className="space-y-3">
              {/* Lab Header */}
              <div className="flex items-center justify-between">
                <Link
                  href={`/labs/${labId}`}
                  className="font-semibold hover:text-primary transition-colors flex items-center gap-2"
                >
                  {lab?.title || t('unknownLab')}
                  <ChevronRight className="h-4 w-4" />
                </Link>
                <span className="text-sm text-muted-foreground">
                  {t('attemptCount', { count: labAttempts.length })}
                </span>
              </div>

              {/* Attempts for this lab */}
              <div className="space-y-2 pl-4 border-l-2 border-border">
                {labAttempts.map((attempt) => (
                  <AttemptCard
                    key={attempt.id}
                    attempt={attempt}
                    t={t}
                    formatTimeAgo={formatTimeAgo}
                    getAttemptCTA={getAttemptCTA}
                    getStatusBadge={getStatusBadge}
                    format={format}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between text-sm text-muted-foreground pt-4">
        <span>
          {t('showingCount', { shown: filteredAttempts.length, total: attempts.length })}
        </span>
      </div>
    </div>
  );
}

function CardPlaceholder() {
  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-3">
      <div className="flex items-center space-x-3">
        <Skeleton className="h-5 w-20" />
        <Skeleton className="h-5 w-16" />
      </div>
      <Skeleton className="h-4 w-3/4 animate-pulse" />
      <div className="flex space-x-4">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-24" />
      </div>
    </div>
  );
}

interface AttemptCardProps {
  attempt: Attempt;
  t: ReturnType<typeof useTranslations>;
  formatTimeAgo: (dateString: string) => string;
  getAttemptCTA: (attempt: Attempt) => { label: string; icon: typeof Clock; variant: 'default' | 'outline' | 'secondary' };
  getStatusBadge: (attempt: Attempt) => JSX.Element | null;
  format: ReturnType<typeof useFormatter>;
}

function AttemptCard({ attempt, t, formatTimeAgo, getAttemptCTA, getStatusBadge, format }: AttemptCardProps) {
  const cta = getAttemptCTA(attempt);

  return (
    <Link
      href={`/submissions/${attempt.id}`}
      className={`block submission-row rounded-lg border bg-card p-4 transition-all hover:border-primary/50 hover:-translate-y-0.5 ${
        attempt.status === 'needs_revision' ? 'border-warning/30' : 'border-border'
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0 space-y-2">
          {/* Header */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium">{t('attemptNumber', { number: attempt.attemptNumber })}</span>
            {getStatusBadge(attempt)}
            <ScoreBadge score={attempt.score} />
          </div>

          {/* Feedback preview */}
          {attempt.feedback && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {attempt.feedback}
            </p>
          )}

          {/* Meta */}
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {formatTimeAgo(attempt.created_at)}
            </span>
            <span>{format.dateTime(new Date(attempt.created_at), { dateStyle: 'medium' })}</span>
          </div>
        </div>

        {/* CTA */}
        <Button variant={cta.variant} size="sm" className="shrink-0">
          <cta.icon className="mr-1.5 h-4 w-4" />
          {cta.label}
        </Button>
      </div>
    </Link>
  );
}

export default function AttemptsPage() {
  return (
    <Suspense fallback={
      <div className="flex h-[calc(100vh-3.5rem)] items-center justify-center space-y-3">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    }>
      <AttemptsPageContent />
    </Suspense>
  );
}
