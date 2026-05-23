'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Play,
  Send,
  ChevronDown,
  ChevronUp,
  FileCode,
  Clock,
  Calendar,
  CheckCircle,
  XCircle,
  Terminal as TerminalIcon,
  Wrench,
  ArrowLeft,
  Save,
  TestTube,
  Lightbulb,
  BookOpen,
  AlertCircle,
  RotateCcw,
} from 'lucide-react';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '@/components/ui/resizable';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ScoreDisplay, ScoreBadge } from '@/components/score-display';
import { CodeEditor } from '@/components/code-editor';
import { ConsoleOutput } from '@/components/console-output';
import { useAppStore } from '@/lib/store';
import {
  getLabById,
  getProfileById,
  getAttemptsByLabId,
} from '@/lib/sample-data';
import type { ExecutionLog, GradingResult, TestCaseResult, Lab } from '@/lib/types';

interface LabWorkspaceContentProps {
  labId: string;
}

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

function getStatusColor(status?: Lab['status']) {
  switch (status) {
    case 'in_progress':
      return 'bg-primary/10 text-primary border-primary/20';
    case 'needs_revision':
      return 'bg-warning/10 text-warning border-warning/20';
    case 'completed':
      return 'bg-success/10 text-success border-success/20';
    case 'overdue':
      return 'bg-destructive/10 text-destructive border-destructive/20';
    default:
      return '';
  }
}

export function LabWorkspaceContent({ labId }: LabWorkspaceContentProps) {
  const router = useRouter();
  const lab = getLabById(labId);
  const profile = lab ? getProfileById(lab.profileId) : undefined;
  const previousAttempts = getAttemptsByLabId(labId);

  const { saveDraft, getDraft, setLastLabId } = useAppStore();

  const [code, setCode] = useState(() => {
    const draft = getDraft(labId);
    if (draft) return draft;
    // Default code template
    if (profile?.language === 'python') {
      return `# Write your Python code here\n\na = int(input())\nb = int(input())\nprint(a + b)\n`;
    }
    return `#!/bin/bash\n# Write your shell script here\n\nread -r input\necho "$input"\n`;
  });

  const [stdin, setStdin] = useState('');
  const [activeTab, setActiveTab] = useState<'instructions' | 'result' | 'history'>('instructions');
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaved, setIsSaved] = useState(true);
  const [logs, setLogs] = useState<ExecutionLog[]>([]);
  const [consoleExpanded, setConsoleExpanded] = useState(true);
  const [gradingResult, setGradingResult] = useState<GradingResult | null>(null);

  // Track last visited lab
  useEffect(() => {
    setLastLabId(labId);
  }, [labId, setLastLabId]);

  // Auto-save draft with visual feedback
  useEffect(() => {
    setIsSaved(false);
    const timeout = setTimeout(() => {
      saveDraft(labId, code);
      setIsSaved(true);
    }, 1000);
    return () => clearTimeout(timeout);
  }, [code, labId, saveDraft]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        if (e.shiftKey) {
          handleSubmit();
        } else {
          handleRunTests();
        }
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        saveDraft(labId, code);
        setIsSaved(true);
        toast.success('Draft saved');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [code, labId, saveDraft]);

  const handleRunCode = useCallback(async () => {
    setIsRunning(true);
    setLogs([]);
    setConsoleExpanded(true);

    toast.info('Running code...');

    setTimeout(() => {
      setLogs([{ stream: 'stdout', data: '$ Starting execution...\n', timestamp: Date.now() }]);
    }, 200);

    setTimeout(() => {
      setLogs((prev) => [
        ...prev,
        { stream: 'stdout', data: '$ Processing input...\n', timestamp: Date.now() },
      ]);
    }, 500);

    setTimeout(() => {
      const output = profile?.language === 'python' 
        ? '8\n'
        : '{"md5": "5eb63b...", "sha1": "2aae6c...", "sha256": "b94d27..."}\n';
      setLogs((prev) => [
        ...prev,
        { stream: 'stdout', data: output, timestamp: Date.now() },
        { stream: 'stdout', data: '\n✓ Exit code: 0 (43ms)\n', timestamp: Date.now() },
      ]);
      setIsRunning(false);
      toast.success('Execution completed');
    }, 1000);
  }, [profile]);

  const handleRunTests = useCallback(async () => {
    setIsRunning(true);
    setLogs([]);
    setConsoleExpanded(true);

    toast.info('Running tests...');

    setTimeout(() => {
      setLogs([{ stream: 'stdout', data: '$ Running test cases...\n', timestamp: Date.now() }]);
    }, 200);

    setTimeout(() => {
      setLogs((prev) => [
        ...prev,
        { stream: 'stdout', data: '✓ Test case 1: PASSED\n', timestamp: Date.now() },
      ]);
    }, 600);

    setTimeout(() => {
      setLogs((prev) => [
        ...prev,
        { stream: 'stdout', data: '✗ Test case 2: FAILED\n', timestamp: Date.now() },
        { stream: 'stderr', data: '  Expected: {"sha256": "9f86d0..."}\n  Received: {"sha256": ""}\n', timestamp: Date.now() },
      ]);
    }, 1000);

    setTimeout(() => {
      setLogs((prev) => [
        ...prev,
        { stream: 'stdout', data: '\n─────────────────────────\n', timestamp: Date.now() },
        { stream: 'stdout', data: '1 of 2 tests passed\n', timestamp: Date.now() },
      ]);
      setIsRunning(false);
      toast.info('1 of 2 tests passed');
    }, 1200);
  }, []);

  const handleSubmit = useCallback(async () => {
    setIsSubmitting(true);
    setLogs([]);
    setConsoleExpanded(true);

    toast.info('Submitting for grading...');

    setTimeout(() => {
      setLogs([
        { stream: 'stdout', data: '$ Submitting solution...\n', timestamp: Date.now() },
      ]);
    }, 200);

    setTimeout(() => {
      setLogs((prev) => [
        ...prev,
        { stream: 'stdout', data: '$ Running all test cases...\n', timestamp: Date.now() },
      ]);
    }, 500);

    setTimeout(() => {
      // Mock grading result
      const mockResult: GradingResult = {
        status: 'graded',
        mode: 'submit',
        score: 85,
        passedTests: 1,
        totalTests: 2,
        testResults: [
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
            actualOutput: '',
            stderr: 'md5sum: command not found',
            passed: false,
          },
        ],
      };

      setGradingResult(mockResult);
      setActiveTab('result');
      setIsSubmitting(false);
      toast.success(`Submitted! Score: ${mockResult.score}/100`);
    }, 1500);
  }, []);

  if (!lab || !profile) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <h2 className="text-lg font-semibold">Lab not found</h2>
          <p className="text-muted-foreground">The requested lab could not be found.</p>
          <Button className="mt-4" onClick={() => router.push('/labs')}>
            Back to My Labs
          </Button>
        </div>
      </div>
    );
  }

  const dueInfo = formatDueDate(lab.dueDate);
  const filename = `Main${profile.extension || '.sh'}`;

  return (
    <div className="flex h-full flex-col">
      {/* Lab Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3 bg-card/50">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild className="shrink-0">
            <Link href="/labs">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-semibold">{lab.title}</h1>
              {lab.status && (
                <Badge variant="secondary" className={getStatusColor(lab.status)}>
                  {lab.status === 'in_progress' ? 'In Progress' : 
                   lab.status === 'needs_revision' ? 'Needs Revision' :
                   lab.status === 'completed' ? 'Completed' : lab.status}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
              {lab.subjectTitle && <span>{lab.subjectTitle}</span>}
              {dueInfo && (
                <span className={`flex items-center gap-1 ${dueInfo.urgent ? 'text-warning' : ''}`}>
                  <Calendar className="h-3 w-3" />
                  {dueInfo.text}
                </span>
              )}
              {lab.attemptsCount !== undefined && lab.attemptsCount > 0 && (
                <span>{lab.attemptsCount} attempts</span>
              )}
              {lab.bestScore !== undefined && (
                <span className="flex items-center gap-1">
                  Best: <ScoreBadge score={lab.bestScore} size="sm" />
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Save Status */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mr-2">
            {isSaved ? (
              <>
                <CheckCircle className="h-3.5 w-3.5 text-success" />
                <span>Saved</span>
              </>
            ) : (
              <>
                <Save className="h-3.5 w-3.5 animate-pulse" />
                <span>Saving...</span>
              </>
            )}
          </div>

          {/* Action Buttons */}
          <Button
            size="sm"
            variant="outline"
            onClick={handleRunCode}
            disabled={isRunning || isSubmitting}
          >
            <Play className="mr-1.5 h-4 w-4" />
            Run Code
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleRunTests}
            disabled={isRunning || isSubmitting}
          >
            <TestTube className="mr-1.5 h-4 w-4" />
            Run Tests
          </Button>
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={isRunning || isSubmitting}
          >
            <Send className="mr-1.5 h-4 w-4" />
            {isSubmitting ? 'Submitting...' : 'Submit Lab'}
          </Button>
        </div>
      </div>

      <ResizablePanelGroup direction="horizontal" className="flex-1">
        {/* Left Panel - Instructions, Results, History */}
        <ResizablePanel defaultSize={40} minSize={25}>
          <div className="flex h-full flex-col border-r border-border">
            <Tabs
              value={activeTab}
              onValueChange={(v) => setActiveTab(v as typeof activeTab)}
              className="flex h-full flex-col"
            >
              <div className="border-b border-border px-4">
                <TabsList className="h-12 w-full justify-start gap-2 rounded-none bg-transparent p-0">
                  <TabsTrigger
                    value="instructions"
                    className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
                  >
                    <BookOpen className="mr-2 h-4 w-4" />
                    Instructions
                  </TabsTrigger>
                  <TabsTrigger
                    value="result"
                    className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Result
                    {gradingResult && (
                      <Badge variant="secondary" className="ml-2">
                        {gradingResult.score}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger
                    value="history"
                    className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
                  >
                    <Clock className="mr-2 h-4 w-4" />
                    History
                    {previousAttempts.length > 0 && (
                      <Badge variant="secondary" className="ml-2">
                        {previousAttempts.length}
                      </Badge>
                    )}
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="instructions" className="flex-1 m-0 overflow-hidden">
                <ScrollArea className="h-full">
                  <div className="p-4 space-y-4">
                    {/* Metadata badges */}
                    <div className="flex flex-wrap gap-2">
                      {lab.toolset?.map((tool) => (
                        <Badge key={tool} variant="outline" className="text-xs">
                          <Wrench className="mr-1 h-3 w-3" />
                          {tool}
                        </Badge>
                      ))}
                      <Badge variant="outline" className="text-xs">
                        <Clock className="mr-1 h-3 w-3" />
                        {profile.timeoutMs}ms timeout
                      </Badge>
                    </div>

                    {/* Markdown statement */}
                    <div className="prose prose-invert prose-sm max-w-none">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {lab.statement}
                      </ReactMarkdown>
                    </div>

                    {/* Custom stdin input */}
                    <div className="space-y-2 pt-4 border-t border-border">
                      <label className="text-sm font-medium flex items-center gap-2">
                        <Lightbulb className="h-4 w-4 text-warning" />
                        Custom Test Input
                      </label>
                      <Textarea
                        value={stdin}
                        onChange={(e) => setStdin(e.target.value)}
                        placeholder="Enter test input here..."
                        className="font-mono text-sm min-h-[80px]"
                      />
                      <p className="text-xs text-muted-foreground">
                        Use this to test your code with custom inputs before submitting.
                      </p>
                    </div>
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="result" className="flex-1 m-0 overflow-hidden">
                <ScrollArea className="h-full">
                  <div className="p-4">
                    {gradingResult ? (
                      <GradingResultView result={gradingResult} labId={labId} />
                    ) : (
                      <div className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                          <Send className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <h3 className="mt-4 font-semibold">No submission yet</h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Submit your lab to see grading results
                        </p>
                        <div className="mt-4 text-xs text-muted-foreground">
                          <p>Tip: Use <kbd className="px-1.5 py-0.5 rounded bg-muted text-foreground">Ctrl+Enter</kbd> to run tests</p>
                          <p>Use <kbd className="px-1.5 py-0.5 rounded bg-muted text-foreground">Ctrl+Shift+Enter</kbd> to submit</p>
                        </div>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="history" className="flex-1 m-0 overflow-hidden">
                <ScrollArea className="h-full">
                  <div className="p-4">
                    {previousAttempts.length > 0 ? (
                      <div className="space-y-3">
                        {previousAttempts.map((attempt) => (
                          <Link
                            key={attempt.id}
                            href={`/submissions/${attempt.id}`}
                            className="block rounded-lg border border-border bg-background/50 p-4 transition-colors hover:bg-accent"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium">Attempt #{attempt.attemptNumber}</span>
                              <ScoreBadge score={attempt.score} />
                            </div>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              <span>{new Date(attempt.created_at).toLocaleDateString()}</span>
                              <span>{new Date(attempt.created_at).toLocaleTimeString()}</span>
                              <Badge
                                variant="secondary"
                                className={
                                  attempt.status === 'graded' ? 'bg-success/10 text-success' :
                                  attempt.status === 'needs_revision' ? 'bg-warning/10 text-warning' :
                                  attempt.status === 'pending' ? 'bg-info/10 text-info' : ''
                                }
                              >
                                {attempt.status === 'needs_revision' ? 'Needs Revision' : 
                                 attempt.status.charAt(0).toUpperCase() + attempt.status.slice(1)}
                              </Badge>
                            </div>
                            {attempt.feedback && (
                              <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                                {attempt.feedback}
                              </p>
                            )}
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                          <Clock className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <h3 className="mt-4 font-semibold">No attempts yet</h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Your submission history will appear here
                        </p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Right Panel - Editor & Console */}
        <ResizablePanel defaultSize={60} minSize={35}>
          <div className="flex h-full flex-col">
            {/* Editor Header */}
            <div className="flex items-center justify-between border-b border-border px-4 py-2">
              <div className="flex items-center gap-2">
                <FileCode className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">{filename}</span>
                <Badge variant="secondary" className="text-xs">
                  {profile.displayName}
                </Badge>
              </div>
            </div>

            {/* Editor and Console */}
            <ResizablePanelGroup direction="vertical" className="flex-1">
              <ResizablePanel defaultSize={70} minSize={30}>
                <CodeEditor
                  value={code}
                  onChange={setCode}
                  language={profile.language}
                />
              </ResizablePanel>

              <ResizableHandle />

              <ResizablePanel defaultSize={30} minSize={10}>
                <div className="flex h-full flex-col border-t border-border bg-[oklch(0.11_0.005_285)]">
                  <div
                    className="flex items-center justify-between border-b border-border px-4 py-2 cursor-pointer hover:bg-accent/50"
                    onClick={() => setConsoleExpanded(!consoleExpanded)}
                  >
                    <div className="flex items-center gap-2">
                      <TerminalIcon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Console</span>
                      {isRunning && (
                        <Badge variant="secondary" className="bg-primary/10 text-primary animate-pulse">
                          Running...
                        </Badge>
                      )}
                    </div>
                    {consoleExpanded ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  {consoleExpanded && (
                    <ConsoleOutput logs={logs} />
                  )}
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}

function GradingResultView({ result, labId }: { result: GradingResult; labId: string }) {
  const allPassed = result.passedTests === result.totalTests;

  return (
    <div className="space-y-6">
      {/* Result Summary */}
      <div className={`rounded-lg border p-4 ${allPassed ? 'border-success/30 bg-success/5' : 'border-warning/30 bg-warning/5'}`}>
        <div className="flex items-center gap-3 mb-3">
          {allPassed ? (
            <CheckCircle className="h-6 w-6 text-success" />
          ) : (
            <AlertCircle className="h-6 w-6 text-warning" />
          )}
          <div>
            <h3 className="font-semibold">
              {allPassed ? 'All Tests Passed!' : 'Some Tests Failed'}
            </h3>
            <p className="text-sm text-muted-foreground">
              {result.passedTests} of {result.totalTests} test cases passed
            </p>
          </div>
        </div>
        <ScoreDisplay
          score={result.score}
          showProgress
          animated
        />
      </div>

      {/* Next Action */}
      {!allPassed && (
        <div className="rounded-lg border border-border bg-card p-4">
          <h4 className="font-medium flex items-center gap-2 mb-2">
            <Lightbulb className="h-4 w-4 text-warning" />
            What to do next
          </h4>
          <p className="text-sm text-muted-foreground mb-3">
            Review the failed test cases below to understand what went wrong. Fix your code and try again.
          </p>
          <Button variant="outline" size="sm">
            <RotateCcw className="mr-1.5 h-4 w-4" />
            Try Again
          </Button>
        </div>
      )}

      {/* Passed Tests */}
      {result.testResults.filter((t) => t.passed).length > 0 && (
        <div>
          <h4 className="font-medium text-success flex items-center gap-2 mb-3">
            <CheckCircle className="h-4 w-4" />
            Passed Tests
          </h4>
          <div className="space-y-2">
            {result.testResults.filter((t) => t.passed).map((test) => (
              <div key={test.index} className="rounded-lg border border-success/30 bg-success/5 p-3">
                <span className="text-sm font-medium">Case #{test.index + 1}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Failed Tests */}
      {result.testResults.filter((t) => !t.passed).length > 0 && (
        <div>
          <h4 className="font-medium text-destructive flex items-center gap-2 mb-3">
            <XCircle className="h-4 w-4" />
            Failed Tests
          </h4>
          <div className="space-y-3">
            {result.testResults.filter((t) => !t.passed).map((test) => (
              <TestCaseResultCard key={test.index} test={test} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function TestCaseResultCard({ test }: { test: TestCaseResult }) {
  return (
    <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="font-medium">Case #{test.index + 1}</span>
        <span className="flex items-center gap-1 text-sm text-destructive">
          <XCircle className="h-4 w-4" />
          FAILED
        </span>
      </div>

      <div className="space-y-3 text-sm">
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
          <pre className="mt-1 rounded bg-background/50 p-2 font-mono text-xs overflow-x-auto">
            {test.actualOutput || '(empty)'}
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
    </div>
  );
}
