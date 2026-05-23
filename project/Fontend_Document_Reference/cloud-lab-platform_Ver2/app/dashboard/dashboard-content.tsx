'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Play,
  Clock,
  AlertTriangle,
  CheckCircle2,
  MessageSquare,
  Trophy,
  Flame,
  Calendar,
  RotateCcw,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScoreBadge } from '@/components/score-display';
import {
  getCurrentLab,
  getLabsDueSoon,
  getLabsNeedingAttention,
  getRecentFeedback,
  getStudentStats,
  getLabById,
} from '@/lib/sample-data';
import type { Lab, Attempt } from '@/lib/types';

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

function useGreeting() {
  const [greeting, setGreeting] = useState('Welcome back');
  
  useEffect(() => {
    setGreeting(getGreeting());
  }, []);
  
  return greeting;
}

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

function formatDueDate(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return 'Overdue';
  if (diffDays === 0) return 'Due today';
  if (diffDays === 1) return 'Due tomorrow';
  return `Due in ${diffDays} days`;
}

function getLabCTA(lab: Lab) {
  switch (lab.status) {
    case 'not_started':
      return { label: 'Start Lab', icon: Play };
    case 'in_progress':
      return { label: 'Continue Coding', icon: ArrowRight };
    case 'submitted':
      return { label: 'View Result', icon: CheckCircle2 };
    case 'needs_revision':
      return { label: 'Fix and Resubmit', icon: RotateCcw };
    case 'completed':
      return { label: 'Review', icon: CheckCircle2 };
    case 'overdue':
      return { label: 'Start Now', icon: AlertTriangle };
    default:
      return { label: 'Open Lab', icon: ArrowRight };
  }
}

export function DashboardContent() {
  const greeting = useGreeting();
  const currentLab = getCurrentLab();
  const labsDueSoon = getLabsDueSoon();
  const labsNeedingAttention = getLabsNeedingAttention();
  const recentFeedback = getRecentFeedback();
  const stats = getStudentStats();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {greeting}
        </h1>
        <p className="text-muted-foreground">
          {currentLab ? 'Pick up where you left off' : 'Ready to start learning?'}
        </p>
      </div>

      {/* Primary CTA: Continue where you left off */}
      {currentLab && (
        <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
          <CardContent className="p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="bg-primary/10 text-primary">
                    In Progress
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {currentLab.subjectTitle}
                  </span>
                </div>
                <h2 className="text-xl font-semibold">{currentLab.title}</h2>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    Last edited {formatTimeAgo(currentLab.lastEditedAt!)}
                  </span>
                  {currentLab.dueDate && (
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {formatDueDate(currentLab.dueDate)}
                    </span>
                  )}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium">{currentLab.progress}%</span>
                  </div>
                  <Progress value={currentLab.progress} className="h-2" />
                </div>
              </div>
              <Button size="lg" asChild className="shrink-0">
                <Link href={`/labs/${currentLab.id}`}>
                  Continue Coding
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Due Soon */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Clock className="h-4 w-4 text-warning" />
              Due Soon
            </CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/labs?status=not_started,in_progress">
                View All <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {labsDueSoon.length > 0 ? (
              <div className="space-y-3">
                {labsDueSoon.map((lab) => {
                  const cta = getLabCTA(lab);
                  return (
                    <Link
                      key={lab.id}
                      href={`/labs/${lab.id}`}
                      className="flex items-center justify-between rounded-lg border border-border bg-background/50 p-3 transition-colors hover:bg-accent"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{lab.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-warning font-medium">
                            {formatDueDate(lab.dueDate!)}
                          </span>
                          {lab.progress !== undefined && lab.progress > 0 && (
                            <span className="text-xs text-muted-foreground">
                              {lab.progress}% complete
                            </span>
                          )}
                        </div>
                      </div>
                      <Button variant="outline" size="sm" className="ml-3 shrink-0">
                        <cta.icon className="mr-1 h-3.5 w-3.5" />
                        {cta.label}
                      </Button>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <CheckCircle2 className="h-8 w-8 text-success mb-2" />
                <p className="text-sm text-muted-foreground">No urgent deadlines</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Needs Attention */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              Needs Attention
            </CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/labs?status=needs_revision,overdue">
                View All <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {labsNeedingAttention.length > 0 ? (
              <div className="space-y-3">
                {labsNeedingAttention.map((lab) => {
                  const cta = getLabCTA(lab);
                  const isOverdue = lab.status === 'overdue';
                  return (
                    <Link
                      key={lab.id}
                      href={`/labs/${lab.id}`}
                      className={`flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-accent ${
                        isOverdue ? 'border-destructive/30 bg-destructive/5' : 'border-warning/30 bg-warning/5'
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{lab.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge
                            variant="outline"
                            className={isOverdue ? 'border-destructive/50 text-destructive' : 'border-warning/50 text-warning'}
                          >
                            {isOverdue ? 'Overdue' : 'Needs Revision'}
                          </Badge>
                          {lab.bestScore !== undefined && (
                            <span className="text-xs text-muted-foreground">
                              Score: {lab.bestScore}/{lab.maxScore}
                            </span>
                          )}
                        </div>
                      </div>
                      <Button
                        variant={isOverdue ? 'destructive' : 'outline'}
                        size="sm"
                        className="ml-3 shrink-0"
                      >
                        <cta.icon className="mr-1 h-3.5 w-3.5" />
                        {cta.label}
                      </Button>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <CheckCircle2 className="h-8 w-8 text-success mb-2" />
                <p className="text-sm text-muted-foreground">All caught up!</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Feedback */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-primary" />
            Recent Feedback
          </CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/submissions">
              View All <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {recentFeedback.length > 0 ? (
            <div className="space-y-3">
              {recentFeedback.map((attempt) => {
                const lab = getLabById(attempt.lab_id);
                const needsRevision = attempt.status === 'needs_revision';
                return (
                  <Link
                    key={attempt.id}
                    href={`/submissions/${attempt.id}`}
                    className="block rounded-lg border border-border bg-background/50 p-4 transition-colors hover:bg-accent"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium truncate">{attempt.lab_title}</p>
                          <ScoreBadge score={attempt.score} />
                        </div>
                        {attempt.feedback && (
                          <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                            {attempt.feedback}
                          </p>
                        )}
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                          <span>Attempt #{attempt.attemptNumber}</span>
                          <span>{formatTimeAgo(attempt.created_at)}</span>
                        </div>
                      </div>
                      {needsRevision && lab?.canResubmit && (
                        <Button variant="outline" size="sm" className="shrink-0" asChild>
                          <Link href={`/labs/${attempt.lab_id}`}>
                            <RotateCcw className="mr-1 h-3.5 w-3.5" />
                            Fix
                          </Link>
                        </Button>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <MessageSquare className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">No feedback yet</p>
              <p className="text-xs text-muted-foreground mt-1">Submit a lab to receive feedback</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats (Secondary) */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card className="bg-card/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <CheckCircle2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.completedLabs}/{stats.totalLabs}</p>
                <p className="text-xs text-muted-foreground">Labs Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
                <Trophy className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.averageScore}%</p>
                <p className="text-xs text-muted-foreground">Average Score</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10">
                <Flame className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.streak}</p>
                <p className="text-xs text-muted-foreground">Day Streak</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50">
          <CardContent className="p-4">
            <Link href="/labs" className="flex items-center gap-3 group">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted group-hover:bg-primary/10 transition-colors">
                <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <div>
                <p className="text-sm font-medium group-hover:text-primary transition-colors">Browse Labs</p>
                <p className="text-xs text-muted-foreground">Find your next challenge</p>
              </div>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
