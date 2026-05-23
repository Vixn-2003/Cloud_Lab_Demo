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
  Trophy,
  Target,
  Lightbulb,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ScoreDisplay } from '@/components/score-display';
import { StatusBadge } from '@/components/status-badge';
import { CodeEditor } from '@/components/code-editor';
import { sampleSubmissions, getLabById, getProfileById } from '@/lib/sample-data';
import type { TestCaseResult } from '@/lib/types';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface PageProps {
  params: Promise<{ submissionId: string }>;
}

export default function ResultFeedbackPage({ params }: PageProps) {
  const { submissionId } = use(params);
  const router = useRouter();
  const [expandedTests, setExpandedTests] = useState<number[]>([]);
  const [copiedCode, setCopiedCode] = useState(false);

  const submission = sampleSubmissions.find((s) => s.id === submissionId);
  const lab = submission ? getLabById(submission.lab_id) : undefined;
  const profile = lab ? getProfileById(lab.profileId) : undefined;

  if (!submission) {
    return (
      <div className="flex h-[calc(100vh-3.5rem)] items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-lg font-semibold">Result not found</h2>
          <p className="text-muted-foreground mt-1">
            We couldn&apos;t find the result you&apos;re looking for.
          </p>
          <Button className="mt-4" onClick={() => router.push('/submissions')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to My Attempts
          </Button>
        </div>
      </div>
    );
  }

  const resultData = submission.result_json
    ? JSON.parse(submission.result_json)
    : null;

  const passedTests = resultData?.passedTests ?? (submission.score === 100 ? 2 : 1);
  const totalTests = resultData?.totalTests ?? 2;
  const passRate = Math.round((passedTests / totalTests) * 100);

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

  // Generate feedback based on score
  const getFeedback = () => {
    if (submission.score === 100) {
      return {
        type: 'success' as const,
        title: 'Excellent Work!',
        message: 'You passed all test cases. Great job understanding the concepts!',
        tips: [
          'Consider optimizing your solution for better performance',
          'Try solving similar problems to reinforce your learning',
        ],
      };
    } else if (submission.score >= 50) {
      return {
        type: 'partial' as const,
        title: 'Good Progress!',
        message: `You passed ${passedTests} out of ${totalTests} test cases. Keep going!`,
        tips: [
          'Review the failed test cases carefully',
          'Check edge cases in your solution',
          'Consider different input scenarios',
        ],
      };
    } else {
      return {
        type: 'needsWork' as const,
        title: 'Keep Trying!',
        message: 'Review the test results and try again. Learning takes practice!',
        tips: [
          'Re-read the problem description carefully',
          'Start with the simplest test case first',
          'Break down the problem into smaller steps',
        ],
      };
    }
  };

  const feedback = getFeedback();

  const toggleTestExpand = (index: number) => {
    setExpandedTests((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  const handleCopyCode = async () => {
    await navigator.clipboard.writeText(submission.code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="animate-fade-in-up p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header with Back Navigation */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/submissions">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Your Result</h1>
          <p className="text-muted-foreground">{submission.lab_title}</p>
        </div>
      </div>

      {/* Result Summary Card */}
      <Card
        className={cn(
          'border-2',
          submission.score === 100
            ? 'border-success/50 bg-success/5'
            : submission.score >= 50
              ? 'border-warning/50 bg-warning/5'
              : 'border-destructive/50 bg-destructive/5'
        )}
      >
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-center gap-6">
            {/* Score Circle */}
            <div className="flex-shrink-0">
              <div
                className={cn(
                  'relative w-32 h-32 rounded-full flex items-center justify-center',
                  submission.score === 100
                    ? 'bg-success/20'
                    : submission.score >= 50
                      ? 'bg-warning/20'
                      : 'bg-destructive/20'
                )}
              >
                <div className="text-center">
                  <span className="text-4xl font-bold">{submission.score}</span>
                  <span className="text-lg text-muted-foreground">/100</span>
                </div>
                {submission.score === 100 && (
                  <Trophy className="absolute -top-2 -right-2 h-8 w-8 text-warning" />
                )}
              </div>
            </div>

            {/* Feedback Message */}
            <div className="flex-1 text-center md:text-left">
              <h2 className="text-xl font-semibold mb-2">{feedback.title}</h2>
              <p className="text-muted-foreground mb-4">{feedback.message}</p>
              <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                <Badge variant="outline" className="gap-1">
                  <Target className="h-3 w-3" />
                  {passedTests}/{totalTests} Tests Passed
                </Badge>
                <Badge variant="outline" className="gap-1 capitalize">
                  <Code2 className="h-3 w-3" />
                  {submission.language}
                </Badge>
                <Badge variant="outline" className="gap-1">
                  <Clock className="h-3 w-3" />
                  {new Date(submission.created_at).toLocaleString()}
                </Badge>
              </div>
            </div>

            {/* Action Button */}
            <div className="flex-shrink-0">
              <Button asChild size="lg">
                <Link href={`/labs/${submission.lab_id}`}>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Try Again
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Test Results Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="h-4 w-4" />
            Test Results
          </CardTitle>
          <CardDescription>
            {passedTests} of {totalTests} test cases passed ({passRate}%)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Progress value={passRate} className="h-3 mb-4" />

          <div className="space-y-3">
            {mockTestResults.map((test) => (
              <div
                key={test.index}
                className={cn(
                  'rounded-lg border overflow-hidden',
                  test.passed
                    ? 'border-success/30 bg-success/5'
                    : 'border-destructive/30 bg-destructive/5'
                )}
              >
                {/* Test Header - Always Visible */}
                <button
                  onClick={() => toggleTestExpand(test.index)}
                  className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {test.passed ? (
                      <CheckCircle className="h-5 w-5 text-success" />
                    ) : (
                      <XCircle className="h-5 w-5 text-destructive" />
                    )}
                    <span className="font-medium">Test Case #{test.index + 1}</span>
                    <Badge variant={test.passed ? 'default' : 'destructive'} className="text-xs">
                      {test.passed ? 'PASSED' : 'FAILED'}
                    </Badge>
                  </div>
                  {expandedTests.includes(test.index) ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>

                {/* Test Details - Expandable */}
                {expandedTests.includes(test.index) && (
                  <div className="border-t border-border/50 p-4 space-y-3 text-sm">
                    <div>
                      <span className="text-muted-foreground font-medium">Input:</span>
                      <pre className="mt-1 rounded bg-background/50 p-2 font-mono text-xs overflow-x-auto">
                        {test.input || '(empty)'}
                      </pre>
                    </div>
                    <div>
                      <span className="text-muted-foreground font-medium">Expected Output:</span>
                      <pre className="mt-1 rounded bg-background/50 p-2 font-mono text-xs overflow-x-auto">
                        {test.expectedOutput || '(empty)'}
                      </pre>
                    </div>
                    <div>
                      <span className="text-muted-foreground font-medium">Your Output:</span>
                      <pre
                        className={cn(
                          'mt-1 rounded p-2 font-mono text-xs overflow-x-auto',
                          test.passed ? 'bg-background/50' : 'bg-destructive/10'
                        )}
                      >
                        {test.actualOutput || '(no output)'}
                      </pre>
                    </div>
                    {test.stderr && (
                      <div>
                        <span className="text-destructive font-medium">Error Message:</span>
                        <pre className="mt-1 rounded bg-destructive/10 p-2 font-mono text-xs text-destructive overflow-x-auto">
                          {test.stderr}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tips for Improvement */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-warning" />
            Tips for Improvement
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {feedback.tips.map((tip, index) => (
              <li key={index} className="flex items-start gap-2 text-sm">
                <span className="text-primary mt-0.5">•</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Your Submitted Code */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <FileCode className="h-4 w-4" />
              Your Submitted Code
            </CardTitle>
            <CardDescription>
              Review your solution and identify areas for improvement
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={handleCopyCode}>
            {copiedCode ? (
              <>
                <Check className="mr-1 h-3 w-3" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="mr-1 h-3 w-3" />
                Copy Code
              </>
            )}
          </Button>
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

      {/* Attempt Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Attempt Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground block">Submitted</span>
              <span className="font-medium">
                {new Date(submission.created_at).toLocaleDateString()}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground block">Time</span>
              <span className="font-medium">
                {new Date(submission.created_at).toLocaleTimeString()}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground block">Language</span>
              <span className="font-medium capitalize">{submission.language}</span>
            </div>
            <div>
              <span className="text-muted-foreground block">Status</span>
              <StatusBadge status={submission.status} />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
