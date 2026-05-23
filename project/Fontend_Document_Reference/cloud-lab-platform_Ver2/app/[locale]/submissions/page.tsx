'use client';

import { useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations, useFormatter } from 'next-intl';
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
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScoreBadge } from '@/components/score-display';
import { EmptyState } from '@/components/empty-state';
import { sampleAttempts, getLabById } from '@/lib/sample-data';
import type { Attempt } from '@/lib/types';

type FilterTab = 'all' | 'graded' | 'passed' | 'needs_revision' | 'pending';

// Group attempts by lab
function groupAttemptsByLab(attempts: Attempt[]) {
  const groups: Record<string, { lab: ReturnType<typeof getLabById>; attempts: Attempt[] }> = {};
  
  attempts.forEach((attempt) => {
    if (!groups[attempt.lab_id]) {
      groups[attempt.lab_id] = {
        lab: getLabById(attempt.lab_id),
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

export default function AttemptsPage() {
  const t = useTranslations('submissions');
  const tStatus = useTranslations('status');
  const tCommon = useTranslations('common');
  const format = useFormatter();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [activeTab, setActiveTab] = useState<FilterTab>(
    (searchParams.get('status') as FilterTab) || 'all'
  );

  const tabConfig: { value: FilterTab; label: string }[] = [
    { value: 'all', label: t('tabs.all') },
    { value: 'graded', label: t('tabs.graded') },
    { value: 'passed', label: t('tabs.passed') },
    { value: 'needs_revision', label: t('tabs.needsRevision') },
    { value: 'pending', label: t('tabs.pending') },
  ];

  function formatTimeAgo(dateString: string) {
    const date = new Date(dateString);
    return format.relativeTime(date);
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
      all: sampleAttempts.length,
      graded: 0,
      passed: 0,
      needs_revision: 0,
      pending: 0,
    };

    sampleAttempts.forEach((attempt) => {
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
  }, []);

  // Filter attempts
  const filteredAttempts = useMemo(() => {
    let result = [...sampleAttempts];

    // Tab filter
    if (activeTab !== 'all') {
      result = result.filter((attempt) => {
        if (activeTab === 'passed') {
          return attempt.status === 'graded' && attempt.score !== undefined && attempt.score >= 80;
        }
        return attempt.status === activeTab;
      });
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
  }, [activeTab, searchQuery]);

  // Group by lab for display
  const groupedAttempts = useMemo(() => groupAttemptsByLab(filteredAttempts), [filteredAttempts]);

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
          {Object.entries(groupedAttempts).map(([labId, { lab, attempts }]) => (
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
                  {t('attemptCount', { count: attempts.length })}
                </span>
              </div>

              {/* Attempts for this lab */}
              <div className="space-y-2 pl-4 border-l-2 border-border">
                {attempts.map((attempt) => (
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
          {t('showingCount', { shown: filteredAttempts.length, total: sampleAttempts.length })}
        </span>
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
      className={`block rounded-lg border bg-card p-4 transition-all hover:border-primary/50 hover:-translate-y-0.5 ${
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
