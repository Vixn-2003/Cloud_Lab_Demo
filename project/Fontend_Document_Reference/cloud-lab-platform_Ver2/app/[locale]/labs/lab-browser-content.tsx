'use client';

import { useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Search,
  X,
  FlaskConical,
  Clock,
  Calendar,
  Play,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Eye,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { ScoreBadge } from '@/components/score-display';
import { EmptyState } from '@/components/empty-state';
import { sampleLabs } from '@/lib/sample-data';
import type { Lab, LabStatus } from '@/lib/types';

type FilterTab = 'all' | 'to_do' | 'in_progress' | 'submitted' | 'needs_attention' | 'completed';

const tabConfig: { value: FilterTab; label: string; statuses: LabStatus[] }[] = [
  { value: 'all', label: 'All', statuses: [] },
  { value: 'to_do', label: 'To Do', statuses: ['not_started'] },
  { value: 'in_progress', label: 'In Progress', statuses: ['in_progress'] },
  { value: 'submitted', label: 'Submitted', statuses: ['submitted'] },
  { value: 'needs_attention', label: 'Needs Attention', statuses: ['needs_revision', 'overdue'] },
  { value: 'completed', label: 'Completed', statuses: ['completed'] },
];

function formatDueDate(dateString?: string) {
  if (!dateString) return null;
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return { text: 'Overdue', urgent: true };
  if (diffDays === 0) return { text: 'Due today', urgent: true };
  if (diffDays === 1) return { text: 'Due tomorrow', urgent: true };
  if (diffDays <= 3) return { text: `Due in ${diffDays} days`, urgent: true };
  return { text: `Due in ${diffDays} days`, urgent: false };
}

function formatTimeAgo(dateString?: string) {
  if (!dateString) return null;
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

function getLabCTA(lab: Lab): { label: string; icon: typeof Play; variant: 'default' | 'outline' | 'destructive' } {
  switch (lab.status) {
    case 'not_started':
      return { label: 'Start Lab', icon: Play, variant: 'default' };
    case 'in_progress':
      return { label: 'Continue', icon: ArrowRight, variant: 'default' };
    case 'submitted':
      return { label: 'View Result', icon: Eye, variant: 'outline' };
    case 'needs_revision':
      return { label: 'Fix & Resubmit', icon: RotateCcw, variant: 'default' };
    case 'completed':
      return { label: 'Review', icon: CheckCircle2, variant: 'outline' };
    case 'overdue':
      return { label: 'Start Now', icon: AlertTriangle, variant: 'destructive' };
    default:
      return { label: 'Open', icon: ArrowRight, variant: 'outline' };
  }
}

function getStatusBadge(status?: LabStatus) {
  switch (status) {
    case 'not_started':
      return <Badge variant="secondary">Not Started</Badge>;
    case 'in_progress':
      return <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">In Progress</Badge>;
    case 'submitted':
      return <Badge variant="secondary" className="bg-info/10 text-info border-info/20">Submitted</Badge>;
    case 'needs_revision':
      return <Badge variant="secondary" className="bg-warning/10 text-warning border-warning/20">Needs Revision</Badge>;
    case 'completed':
      return <Badge variant="secondary" className="bg-success/10 text-success border-success/20">Completed</Badge>;
    case 'overdue':
      return <Badge variant="destructive">Overdue</Badge>;
    default:
      return null;
  }
}

export function LabBrowserContent() {
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [activeTab, setActiveTab] = useState<FilterTab>(
    (searchParams.get('status') as FilterTab) || 'all'
  );

  // Get counts for each tab
  const tabCounts = useMemo(() => {
    const counts: Record<FilterTab, number> = {
      all: sampleLabs.length,
      to_do: 0,
      in_progress: 0,
      submitted: 0,
      needs_attention: 0,
      completed: 0,
    };

    sampleLabs.forEach((lab) => {
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
        case 'overdue':
          counts.needs_attention++;
          break;
        case 'completed':
          counts.completed++;
          break;
      }
    });

    return counts;
  }, []);

  // Filter labs
  const filteredLabs = useMemo(() => {
    let result = [...sampleLabs];

    // Tab filter
    const tabStatuses = tabConfig.find((t) => t.value === activeTab)?.statuses || [];
    if (tabStatuses.length > 0) {
      result = result.filter((lab) => lab.status && tabStatuses.includes(lab.status));
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
  }, [activeTab, searchQuery]);

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)]">
      {/* Header */}
      <div className="p-6 pb-4 space-y-4">
        <div>
          <h1 className="text-2xl font-bold">My Labs</h1>
          <p className="text-sm text-muted-foreground">
            {filteredLabs.length} labs assigned to you
          </p>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as FilterTab)}>
          <div className="flex items-center justify-between gap-4">
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

            {/* Search */}
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
        </Tabs>
      </div>

      {/* Labs List */}
      <div className="flex-1 overflow-y-auto px-6 pb-6">
        {filteredLabs.length === 0 ? (
          <EmptyState
            icon={<FlaskConical className="h-8 w-8 text-muted-foreground" />}
            title={searchQuery ? 'No labs found' : 'No labs in this category'}
            description={
              searchQuery
                ? 'Try adjusting your search query.'
                : activeTab === 'completed'
                ? 'Complete labs to see them here.'
                : 'Check back later for new assignments.'
            }
            action={
              searchQuery && (
                <Button variant="outline" onClick={() => setSearchQuery('')}>
                  Clear Search
                </Button>
              )
            }
          />
        ) : (
          <div className="space-y-3">
            {filteredLabs.map((lab) => (
              <LabCard key={lab.id} lab={lab} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function LabCard({ lab }: { lab: Lab }) {
  const cta = getLabCTA(lab);
  const dueInfo = formatDueDate(lab.dueDate);
  const lastEdited = formatTimeAgo(lab.lastEditedAt);
  const isUrgent = lab.status === 'overdue' || lab.status === 'needs_revision';

  return (
    <div
      className={`group rounded-xl border bg-card p-5 transition-all hover:border-primary/50 hover:-translate-y-0.5 ${
        isUrgent ? 'border-destructive/30' : 'border-border'
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0 space-y-3">
          {/* Header: Status + Subject */}
          <div className="flex items-center gap-2 flex-wrap">
            {getStatusBadge(lab.status)}
            {lab.subjectTitle && (
              <span className="text-sm text-muted-foreground">{lab.subjectTitle}</span>
            )}
          </div>

          {/* Title */}
          <h3 className="text-lg font-semibold">{lab.title}</h3>

          {/* Metadata Row */}
          <div className="flex items-center gap-4 flex-wrap text-sm">
            {/* Due Date */}
            {dueInfo && (
              <span className={`flex items-center gap-1 ${dueInfo.urgent ? 'text-warning font-medium' : 'text-muted-foreground'}`}>
                <Calendar className="h-3.5 w-3.5" />
                {dueInfo.text}
              </span>
            )}

            {/* Last Activity */}
            {lastEdited && (
              <span className="flex items-center gap-1 text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                Last edited {lastEdited}
              </span>
            )}

            {/* Attempts */}
            {lab.attemptsCount !== undefined && lab.attemptsCount > 0 && (
              <span className="text-muted-foreground">
                {lab.attemptsCount} attempt{lab.attemptsCount > 1 ? 's' : ''}
              </span>
            )}

            {/* Score */}
            {lab.bestScore !== undefined && (
              <ScoreBadge score={lab.bestScore} />
            )}
          </div>

          {/* Progress Bar (for in-progress labs) */}
          {lab.status === 'in_progress' && lab.progress !== undefined && (
            <div className="space-y-1 max-w-xs">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium">{lab.progress}%</span>
              </div>
              <Progress value={lab.progress} className="h-1.5" />
            </div>
          )}

          {/* Tools */}
          {lab.toolset && lab.toolset.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {lab.toolset.map((tool) => (
                <Badge key={tool} variant="outline" className="text-xs font-normal">
                  {tool}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* CTA Button */}
        <Button variant={cta.variant} size="sm" asChild className="shrink-0">
          <Link href={`/labs/${lab.id}`}>
            <cta.icon className="mr-1.5 h-4 w-4" />
            {cta.label}
          </Link>
        </Button>
      </div>
    </div>
  );
}
