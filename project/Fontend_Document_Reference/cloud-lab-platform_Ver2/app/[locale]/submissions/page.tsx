'use client';

import { useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
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

const tabConfig: { value: FilterTab; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'graded', label: 'Graded' },
  { value: 'passed', label: 'Passed' },
  { value: 'needs_revision', label: 'Needs Revision' },
  { value: 'pending', label: 'Pending' },
];

function formatTimeAgo(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffHours < 1) return 'Just now';
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  return `${diffDays} days ago`;
}

function getAttemptCTA(attempt: Attempt) {
  if (attempt.status === 'pending') {
    return { label: 'Pending', icon: Clock, variant: 'secondary' as const };
  }
  if (attempt.status === 'needs_revision' && attempt.canRetry) {
    return { label: 'Fix & Resubmit', icon: RotateCcw, variant: 'default' as const };
  }
  return { label: 'View Feedback', icon: Eye, variant: 'outline' as const };
}

function getStatusBadge(attempt: Attempt) {
  const isPassed = attempt.score !== undefined && attempt.score >= 80;
  
  switch (attempt.status) {
    case 'pending':
      return <Badge variant="secondary" className="bg-info/10 text-info border-info/20">Pending</Badge>;
    case 'graded':
      return isPassed 
        ? <Badge variant="secondary" className="bg-success/10 text-success border-success/20">Passed</Badge>
        : <Badge variant="secondary" className="bg-warning/10 text-warning border-warning/20">Graded</Badge>;
    case 'needs_revision':
      return <Badge variant="secondary" className="bg-warning/10 text-warning border-warning/20">Needs Revision</Badge>;
    case 'failed':
      return <Badge variant="destructive">Failed</Badge>;
    default:
      return null;
  }
}

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
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [activeTab, setActiveTab] = useState<FilterTab>(
    (searchParams.get('status') as FilterTab) || 'all'
  );

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
        <h1 className="text-2xl font-bold">My Attempts</h1>
        <p className="text-muted-foreground">
          View your submission history and feedback
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
            placeholder="Search labs..."
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
          title={searchQuery ? 'No attempts found' : 'No attempts in this category'}
          description={
            searchQuery
              ? 'Try adjusting your search query.'
              : activeTab === 'all'
              ? 'Submit a lab to see your attempts here.'
              : 'No attempts match this filter.'
          }
          action={
            searchQuery ? (
              <Button variant="outline" onClick={() => setSearchQuery('')}>
                Clear Search
              </Button>
            ) : (
              <Button asChild>
                <Link href="/labs">Go to My Labs</Link>
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
                  {lab?.title || 'Unknown Lab'}
                  <ChevronRight className="h-4 w-4" />
                </Link>
                <span className="text-sm text-muted-foreground">
                  {attempts.length} attempt{attempts.length > 1 ? 's' : ''}
                </span>
              </div>

              {/* Attempts for this lab */}
              <div className="space-y-2 pl-4 border-l-2 border-border">
                {attempts.map((attempt) => (
                  <AttemptCard key={attempt.id} attempt={attempt} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between text-sm text-muted-foreground pt-4">
        <span>
          Showing {filteredAttempts.length} of {sampleAttempts.length} attempts
        </span>
      </div>
    </div>
  );
}

function AttemptCard({ attempt }: { attempt: Attempt }) {
  const cta = getAttemptCTA(attempt);
  const isPassed = attempt.score !== undefined && attempt.score >= 80;

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
            <span className="font-medium">Attempt #{attempt.attemptNumber}</span>
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
            <span>{new Date(attempt.created_at).toLocaleDateString()}</span>
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
