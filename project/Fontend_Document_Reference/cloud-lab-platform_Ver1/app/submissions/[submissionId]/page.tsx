'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Code2,
  FileCode,
  CheckCircle,
  XCircle,
  RotateCcw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScoreDisplay } from '@/components/score-display';
import { StatusBadge } from '@/components/status-badge';
import { CodeEditor } from '@/components/code-editor';
import { sampleSubmissions, getLabById, getProfileById } from '@/lib/sample-data';
import type { TestCaseResult } from '@/lib/types';

interface PageProps {
  params: Promise<{ submissionId: string }>;
}

export default function SubmissionDetailPage({ params }: PageProps) {
  const { submissionId } = use(params);
  const router = useRouter();

  const submission = sampleSubmissions.find((s) => s.id === submissionId);
  const lab = submission ? getLabById(submission.lab_id) : undefined;
  const profile = lab ? getProfileById(lab.profileId) : undefined;

  if (!submission) {
    return (
      <div className="flex h-[calc(100vh-3.5rem)] items-center justify-center">
        <div className="text-center">
          <h2 className="text-lg font-semibold">Submission not found</h2>
          <p className="text-muted-foreground">
            The requested submission could not be found.
          </p>
          <Button className="mt-4" onClick={() => router.push('/submissions')}>
            Back to Submissions
          </Button>
        </div>
      </div>
    );
  }

  const resultData = submission.result_json
    ? JSON.parse(submission.result_json)
    : null;

  // Mock test results for display
  const mockTestResults: TestCaseResult[] = [
    {
      index: 0,
      input: 'hello world',
      expectedOutput: '{"md5": "5eb63b...", "sha1": "2aae6c...", "sha256": "b94d27..."}',
      actualOutput: '{"md5": "5eb63b...", "sha1": "2aae6c...", "sha256": "b94d27..."}',
      passed: true,
    },
    {
      index: 1,
      input: 'test',
      expectedOutput: '{"md5": "098f6b...", "sha1": "a94a8f...", "sha256": "9f86d0..."}',
      actualOutput: submission.score === 100 ? '{"md5": "098f6b...", "sha1": "a94a8f...", "sha256": "9f86d0..."}' : '',
      stderr: submission.score !== 100 ? 'Error in test case' : undefined,
      passed: submission.score === 100,
    },
  ];

  return (
    <div className="animate-fade-in-up p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/submissions">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-xl font-bold">{submission.lab_title}</h1>
            <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {new Date(submission.created_at).toLocaleDateString()}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {new Date(submission.created_at).toLocaleTimeString()}
              </span>
              <Badge variant="outline" className="capitalize">
                <Code2 className="mr-1 h-3 w-3" />
                {submission.language}
              </Badge>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={submission.status} />
          <Button asChild>
            <Link href={`/labs/${submission.lab_id}`}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Re-submit
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Score Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Score</CardTitle>
          </CardHeader>
          <CardContent>
            <ScoreDisplay
              score={submission.score}
              showProgress
              animated
              className="mb-4"
            />
            {resultData && (
              <p className="text-sm text-muted-foreground">
                Passed {resultData.passedTests} of {resultData.totalTests} test cases
              </p>
            )}
          </CardContent>
        </Card>

        {/* Metadata Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Submission ID</span>
              <code className="text-sm bg-muted px-2 py-0.5 rounded">
                {submission.id}
              </code>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Lab ID</span>
              <code className="text-sm bg-muted px-2 py-0.5 rounded">
                {submission.lab_id}
              </code>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Profile</span>
              <span className="text-sm">{profile?.displayName || 'Unknown'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Mode</span>
              <Badge variant="secondary" className="capitalize">
                {submission.mode}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Submitted Code */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <FileCode className="h-4 w-4" />
            Submitted Code
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="h-[300px] border-t border-border">
            <CodeEditor
              value={submission.code}
              onChange={() => {}}
              language={submission.language}
              readOnly
            />
          </div>
        </CardContent>
      </Card>

      {/* Test Results */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Test Results</h2>
        <div className="space-y-3">
          {mockTestResults.map((test) => (
            <Card
              key={test.index}
              className={
                test.passed
                  ? 'border-success/30 bg-success/5'
                  : 'border-destructive/30 bg-destructive/5'
              }
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-medium">Case #{test.index + 1}</span>
                  {test.passed ? (
                    <span className="flex items-center gap-1 text-sm text-success">
                      <CheckCircle className="h-4 w-4" />
                      PASSED
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-sm text-destructive">
                      <XCircle className="h-4 w-4" />
                      FAILED
                    </span>
                  )}
                </div>

                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Input:</span>
                    <pre className="mt-1 rounded bg-background/50 p-2 font-mono text-xs overflow-x-auto">
                      {test.input || '(empty)'}
                    </pre>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Expected:</span>
                    <pre className="mt-1 rounded bg-background/50 p-2 font-mono text-xs overflow-x-auto">
                      {test.expectedOutput || '(empty)'}
                    </pre>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Output:</span>
                    <pre className="mt-1 rounded bg-background/50 p-2 font-mono text-xs overflow-x-auto">
                      {test.actualOutput || '(empty)'}
                    </pre>
                  </div>
                  {test.stderr && (
                    <div>
                      <span className="text-destructive">Stderr:</span>
                      <pre className="mt-1 rounded bg-destructive/10 p-2 font-mono text-xs text-destructive overflow-x-auto">
                        {test.stderr}
                      </pre>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
