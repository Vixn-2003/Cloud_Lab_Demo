'use client';

import { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations, useFormatter } from 'next-intl';
import { Link } from '@/src/i18n/navigation';
import {
  ArrowLeft,
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
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { StatusBadge } from '@/components/status-badge';
import { CodeEditor } from '@/components/code-editor';
import { getSubmission, getLab } from '@/lib/api';
import type { TestCaseResult, Attempt, Lab } from '@/lib/types';
import { cn } from '@/lib/utils';

interface PageProps {
  params: Promise<{ submissionId: string }>;
}

export default function ResultFeedbackPage({ params }: PageProps) {
  const { submissionId } = use(params);
  const router = useRouter();
  const t = useTranslations('result');
  const tCommon = useTranslations('common');
  const tStatus = useTranslations('status');
  const format = useFormatter();

  const [loading, setLoading] = useState(true);
  const [submission, setSubmission] = useState<Attempt | null>(null);
  const [lab, setLab] = useState<Lab | null>(null);
  const [expandedTests, setExpandedTests] = useState<number[]>([]);
  const [copiedCode, setCopiedCode] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const rawSubmission = await getSubmission(submissionId);
        setSubmission(rawSubmission);

        const rawLab = await getLab(rawSubmission.lab_id);
        setLab(rawLab);
      } catch (err) {
        console.error('Failed to load submission detail:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [submissionId]);

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-3.5rem)] items-center justify-center space-y-3">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="flex h-[calc(100vh-3.5rem)] items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-lg font-semibold">{t('notFound')}</h2>
          <p className="text-muted-foreground mt-1">
            {t('notFoundDescription')}
          </p>
          <Button className="mt-4" onClick={() => router.push('/submissions')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('backToAttempts')}
          </Button>
        </div>
      </div>
    );
  }

  const resultData = submission.result_json
    ? typeof submission.result_json === 'string'
      ? JSON.parse(submission.result_json)
      : submission.result_json
    : null;

  const passedTests = resultData?.passedTests ?? (submission.score === 100 ? 1 : 0);
  const totalTests = resultData?.totalTests ?? 1;
  const passRate = Math.round((passedTests / totalTests) * 100);
  const testResults: TestCaseResult[] = resultData?.testResults || [];

  // Generate feedback based on score
  const getFeedback = () => {
    if (submission.score === 100) {
      return {
        type: 'success' as const,
        title: t('feedback.excellent.title'),
        message: t('feedback.excellent.message'),
        tips: [
          t('feedback.excellent.tip1'),
          t('feedback.excellent.tip2'),
        ],
      };
    } else if (submission.score !== undefined && submission.score >= 50) {
      return {
        type: 'partial' as const,
        title: t('feedback.good.title'),
        message: t('feedback.good.message', { passed: passedTests, total: totalTests }),
        tips: [
          t('feedback.good.tip1'),
          t('feedback.good.tip2'),
          t('feedback.good.tip3'),
        ],
      };
    } else {
      return {
        type: 'needsWork' as const,
        title: t('feedback.needsWork.title'),
        message: t('feedback.needsWork.message'),
        tips: [
          t('feedback.needsWork.tip1'),
          t('feedback.needsWork.tip2'),
          t('feedback.needsWork.tip3'),
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

  const labTitle = lab?.title || submission.lab_title || 'Lab Task';

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
          <h1 className="text-2xl font-bold">{t('title')}</h1>
          <p className="text-muted-foreground">{labTitle}</p>
        </div>
      </div>

      {/* Result Summary Card */}
      <Card
        className={cn(
          'border-2',
          submission.score === 100
            ? 'border-success/50 bg-success/5'
            : submission.score !== undefined && submission.score >= 50
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
                    : submission.score !== undefined && submission.score >= 50
                      ? 'bg-warning/20'
                      : 'bg-destructive/20'
                )}
              >
                <div className="text-center">
                  <span className="text-4xl font-bold">{submission.score ?? 0}</span>
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
                  {t('testsPassed', { passed: passedTests, total: totalTests })}
                </Badge>
                <Badge variant="outline" className="gap-1 capitalize">
                  <Code2 className="h-3 w-3" />
                  {submission.language}
                </Badge>
                <Badge variant="outline" className="gap-1">
                  <Clock className="h-3 w-3" />
                  {format.dateTime(new Date(submission.created_at), { dateStyle: 'medium', timeStyle: 'short' })}
                </Badge>
              </div>
            </div>

            {/* Action Button */}
            <div className="flex-shrink-0">
              <Button asChild size="lg">
                <Link href={`/labs/${submission.lab_id}`}>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  {t('tryAgain')}
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Test Results Progress */}
      {testResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="h-4 w-4" />
              {t('testResults')}
            </CardTitle>
            <CardDescription>
              {t('testsPassedDescription', { passed: passedTests, total: totalTests, percent: passRate })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Progress value={passRate} className="h-3 mb-4" />

            <div className="space-y-3">
              {testResults.map((test) => (
                <div
                  key={test.index}
                  className={cn(
                    'rounded-lg border overflow-hidden',
                    test.passed
                      ? 'border-success/30 bg-success/5'
                      : 'border-destructive/30 bg-destructive/5'
                  )}
                >
                  {/* Test Header */}
                  <button
                    onClick={() => toggleTestExpand(test.index)}
                    className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      {test.passed ? (
                        <CheckCircle className="h-5 w-5 text-success" />
                      ) : (
                        <XCircle className="h-5 w-5 text-destructive" />
                      )}
                      <span className="font-medium">{t('testCase', { number: test.index })}</span>
                      <Badge variant={test.passed ? 'default' : 'destructive'} className="text-xs">
                        {test.passed ? tStatus('passed') : tStatus('failed')}
                      </Badge>
                    </div>
                    {expandedTests.includes(test.index) ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </button>

                  {/* Test Details */}
                  {expandedTests.includes(test.index) && (
                    <div className="border-t border-border/50 p-4 space-y-3 text-sm">
                      {test.input && (
                        <div>
                          <span className="text-muted-foreground font-medium">{t('input')}:</span>
                          <pre className="mt-1 rounded bg-background/50 p-2 font-mono text-xs overflow-x-auto">
                            {test.input}
                          </pre>
                        </div>
                      )}
                      {test.expectedOutput && (
                        <div>
                          <span className="text-muted-foreground font-medium">{t('expectedOutput')}:</span>
                          <pre className="mt-1 rounded bg-background/50 p-2 font-mono text-xs overflow-x-auto">
                            {test.expectedOutput}
                          </pre>
                        </div>
                      )}
                      <div>
                        <span className="text-muted-foreground font-medium">{t('yourOutput')}:</span>
                        <pre
                          className={cn(
                            'mt-1 rounded p-2 font-mono text-xs overflow-x-auto',
                            test.passed ? 'bg-background/50' : 'bg-destructive/10'
                          )}
                        >
                          {test.actualOutput || t('noOutput')}
                        </pre>
                      </div>
                      {test.stderr && (
                        <div>
                          <span className="text-destructive font-medium">{t('errorMessage')}:</span>
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
      )}

      {/* Tips for Improvement */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-warning" />
            {t('tipsForImprovement')}
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
              {t('submittedCode')}
            </CardTitle>
            <CardDescription>
              {t('reviewSolution')}
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={handleCopyCode}>
            {copiedCode ? (
              <>
                <Check className="mr-1 h-3 w-3" />
                {tCommon('copied')}
              </>
            ) : (
              <>
                <Copy className="mr-1 h-3 w-3" />
                {tCommon('copyCode')}
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
          <CardTitle className="text-base">{t('attemptDetails')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground block">{t('submitted')}</span>
              <span className="font-medium">
                {format.dateTime(new Date(submission.created_at), { dateStyle: 'medium' })}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground block">{t('time')}</span>
              <span className="font-medium">
                {format.dateTime(new Date(submission.created_at), { timeStyle: 'short' })}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground block">{t('language')}</span>
              <span className="font-medium capitalize">{submission.language}</span>
            </div>
            <div>
              <span className="text-muted-foreground block">{tStatus('status')}</span>
              <StatusBadge status={submission.status} />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
