import Link from 'next/link';
import {
  FlaskConical,
  CheckCircle2,
  Trophy,
  FileText,
  ArrowRight,
  Shield,
  Code2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { KpiCard } from '@/components/kpi-card';
import { ScoreBadge } from '@/components/score-display';
import { StatusBadge } from '@/components/status-badge';
import {
  sampleFaculties,
  sampleSubjects,
  sampleLabs,
  sampleSubmissions,
} from '@/lib/sample-data';

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

function getDashboardStats() {
  const totalLabs = sampleLabs.length;
  const completedLabs = new Set(
    sampleSubmissions.filter((s) => s.score === 100).map((s) => s.lab_id)
  ).size;
  const scores = sampleSubmissions.filter((s) => s.score !== undefined).map((s) => s.score!);
  const averageScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
  const totalSubmissions = sampleSubmissions.length;

  return { totalLabs, completedLabs, averageScore, totalSubmissions };
}

function getRecentSubmissions() {
  return sampleSubmissions
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);
}

function getFacultyStats() {
  return sampleFaculties.map((faculty) => {
    const subjects = sampleSubjects.filter((s) => s.facultyId === faculty.id);
    const subjectIds = subjects.map((s) => s.id);
    const labs = sampleLabs.filter((l) => {
      const labSubject = sampleSubjects.find((s) => {
        // Find subject that contains this lab
        return sampleLabs.some((lab) => lab.id === l.id);
      });
      return labSubject && subjectIds.includes(labSubject.id);
    });
    return {
      ...faculty,
      labCount: faculty.id === 'info_sec' ? 5 : 1,
      subjectCount: subjects.length,
    };
  });
}

export function DashboardContent() {
  const stats = getDashboardStats();
  const recentSubmissions = getRecentSubmissions();
  const facultyStats = getFacultyStats();
  const lastLab = sampleLabs[1]; // Mock last visited lab

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {getGreeting()}, Student
        </h1>
        <p className="text-muted-foreground">
          Your learning progress at a glance
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Total Labs"
          value={stats.totalLabs}
          icon={FlaskConical}
          href="/labs"
          linkLabel="Browse"
        />
        <KpiCard
          title="Completed"
          value={stats.completedLabs}
          icon={CheckCircle2}
          href="/submissions?status=graded"
          linkLabel="View All"
        />
        <KpiCard
          title="Avg Score"
          value={`${stats.averageScore}/100`}
          icon={Trophy}
          href="/submissions"
          linkLabel="Details"
        />
        <KpiCard
          title="Submissions"
          value={stats.totalSubmissions}
          icon={FileText}
          href="/submissions"
          linkLabel="History"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Submissions */}
        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-semibold">
              Recent Submissions
            </CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/submissions">
                View All <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentSubmissions.map((submission) => (
                <Link
                  key={submission.id}
                  href={`/submissions/${submission.id}`}
                  className="flex items-center justify-between rounded-lg border border-border bg-background/50 p-3 transition-colors hover:bg-accent"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                      <FileText className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium line-clamp-1">
                        {submission.lab_title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(submission.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <ScoreBadge score={submission.score} />
                    <StatusBadge status={submission.status} />
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Continue Learning */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-base font-semibold">
              Continue Learning
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-border bg-background/50 p-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Shield className="h-4 w-4" />
                  <span>Faculty of Information Security</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Code2 className="h-4 w-4" />
                  <span>Cryptographic Fundamentals</span>
                </div>
                <div className="pt-2">
                  <h3 className="font-semibold">{lastLab.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                    Continue where you left off in your cryptography journey.
                  </p>
                </div>
              </div>
            </div>
            <Button asChild className="w-full">
              <Link href={`/labs/${lastLab.id}`}>
                Continue <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Labs by Faculty */}
      <div>
        <h2 className="mb-4 text-lg font-semibold">Labs by Faculty</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {facultyStats.map((faculty) => (
            <Link
              key={faculty.id}
              href={`/labs?facultyId=${faculty.id}`}
              className="group rounded-xl border border-border bg-card p-5 transition-all hover:border-primary/50 hover:bg-accent/50 hover:-translate-y-0.5"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-[oklch(0.6_0.22_290)]">
                  {faculty.id === 'info_sec' ? (
                    <Shield className="h-5 w-5 text-primary-foreground" />
                  ) : (
                    <Code2 className="h-5 w-5 text-primary-foreground" />
                  )}
                </div>
                <div>
                  <h3 className="font-semibold">{faculty.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {faculty.labCount} labs · {faculty.subjectCount} subjects
                  </p>
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                Explore <ArrowRight className="ml-1 h-4 w-4" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
