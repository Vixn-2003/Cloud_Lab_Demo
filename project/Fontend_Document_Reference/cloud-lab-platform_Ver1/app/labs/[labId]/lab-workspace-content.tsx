'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Play,
  Send,
  ChevronDown,
  ChevronUp,
  FileCode,
  Clock,
  Cpu,
  FileText,
  CheckCircle,
  XCircle,
  Terminal as TerminalIcon,
  Wrench,
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
import { ScoreDisplay } from '@/components/score-display';
import { StatusBadge } from '@/components/status-badge';
import { PageBreadcrumb } from '@/components/page-breadcrumb';
import { CodeEditor } from '@/components/code-editor';
import { ConsoleOutput } from '@/components/console-output';
import { useAppStore } from '@/lib/store';
import {
  sampleLabs,
  sampleProfiles,
  getLabById,
  getProfileById,
  sampleSubmissions,
} from '@/lib/sample-data';
import type { ExecutionLog, GradingResult, TestCaseResult } from '@/lib/types';

interface LabWorkspaceContentProps {
  labId: string;
}

export function LabWorkspaceContent({ labId }: LabWorkspaceContentProps) {
  const router = useRouter();
  const lab = getLabById(labId);
  const profile = lab ? getProfileById(lab.profileId) : undefined;

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
  const [activeTab, setActiveTab] = useState<'description' | 'result'>('description');
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [logs, setLogs] = useState<ExecutionLog[]>([]);
  const [consoleExpanded, setConsoleExpanded] = useState(true);
  const [gradingResult, setGradingResult] = useState<GradingResult | null>(null);

  // Track last visited lab
  useEffect(() => {
    setLastLabId(labId);
  }, [labId, setLastLabId]);

  // Auto-save draft
  useEffect(() => {
    const timeout = setTimeout(() => {
      saveDraft(labId, code);
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
          handleRun();
        }
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        saveDraft(labId, code);
        toast.success('Draft saved');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [code, labId, saveDraft]);

  const handleRun = useCallback(async () => {
    setIsRunning(true);
    setLogs([]);
    setConsoleExpanded(true);

    // Simulate execution with mock data
    toast.info('Running code...');

    // Simulate streaming logs
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

  const handleSubmit = useCallback(async () => {
    setIsSubmitting(true);
    setLogs([]);
    setConsoleExpanded(true);

    toast.info('Submitting for grading...');

    // Simulate grading
    setTimeout(() => {
      setLogs([
        { stream: 'stdout', data: '$ Running test cases...\n', timestamp: Date.now() },
      ]);
    }, 200);

    setTimeout(() => {
      setLogs((prev) => [
        ...prev,
        { stream: 'stdout', data: '$ Test case 1: PASSED\n', timestamp: Date.now() },
      ]);
    }, 600);

    setTimeout(() => {
      setLogs((prev) => [
        ...prev,
        { stream: 'stdout', data: '$ Test case 2: PASSED\n', timestamp: Date.now() },
      ]);
    }, 1000);

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
      toast.success(`Submission graded: ${mockResult.score}/100`);
    }, 1500);
  }, []);

  if (!lab || !profile) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <h2 className="text-lg font-semibold">Lab not found</h2>
          <p className="text-muted-foreground">The requested lab could not be found.</p>
          <Button className="mt-4" onClick={() => router.push('/labs')}>
            Back to Labs
          </Button>
        </div>
      </div>
    );
  }

  const filename = `Main${profile.extension || '.sh'}`;

  return (
    <div className="flex h-full flex-col">
      {/* Header with breadcrumb is in layout */}
      
      <ResizablePanelGroup direction="horizontal" className="flex-1">
        {/* Left Panel - Description & Results */}
        <ResizablePanel defaultSize={40} minSize={25}>
          <div className="flex h-full flex-col border-r border-border">
            <Tabs
              value={activeTab}
              onValueChange={(v) => setActiveTab(v as 'description' | 'result')}
              className="flex h-full flex-col"
            >
              <div className="border-b border-border px-4">
                <TabsList className="h-12 w-full justify-start gap-2 rounded-none bg-transparent p-0">
                  <TabsTrigger
                    value="description"
                    className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Description
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
                </TabsList>
              </div>

              <TabsContent value="description" className="flex-1 m-0 overflow-hidden">
                <ScrollArea className="h-full">
                  <div className="p-4 space-y-4">
                    <h1 className="text-xl font-bold">{lab.title}</h1>

                    {/* Metadata badges */}
                    <div className="flex flex-wrap gap-2">
                      {lab.toolset?.map((tool) => (
                        <Badge key={tool} variant="outline" className="text-xs">
                          <Wrench className="mr-1 h-3 w-3" />
                          {tool}
                        </Badge>
                      ))}
                      <Badge variant="outline" className="text-xs">
                        <Cpu className="mr-1 h-3 w-3" />
                        {profile.displayName}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        <Clock className="mr-1 h-3 w-3" />
                        {profile.timeoutMs}ms
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
                      <label className="text-sm font-medium">Custom Stdin Input</label>
                      <Textarea
                        value={stdin}
                        onChange={(e) => setStdin(e.target.value)}
                        placeholder="Enter test input here..."
                        className="font-mono text-sm min-h-[80px]"
                      />
                    </div>
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="result" className="flex-1 m-0 overflow-hidden">
                <ScrollArea className="h-full">
                  <div className="p-4">
                    {gradingResult ? (
                      <GradingResultView result={gradingResult} />
                    ) : (
                      <div className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                          <Send className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <h3 className="mt-4 font-semibold">No submission yet</h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Submit your code to see grading results
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
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleRun}
                  disabled={isRunning || isSubmitting}
                >
                  <Play className="mr-2 h-4 w-4" />
                  {isRunning ? 'Running...' : 'Run'}
                </Button>
                <Button
                  size="sm"
                  onClick={handleSubmit}
                  disabled={isRunning || isSubmitting}
                >
                  <Send className="mr-2 h-4 w-4" />
                  {isSubmitting ? 'Submitting...' : 'Submit'}
                </Button>
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
                        <StatusBadge status="running" />
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

function GradingResultView({ result }: { result: GradingResult }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-4">Session Performance</h2>
        <ScoreDisplay
          score={result.score}
          showProgress
          animated
          className="mb-4"
        />
        <p className="text-sm text-muted-foreground">
          Passed {result.passedTests} of {result.totalTests} test cases
        </p>
      </div>

      <div className="space-y-3">
        {result.testResults.map((test, index) => (
          <TestCaseResultCard key={index} test={test} />
        ))}
      </div>
    </div>
  );
}

function TestCaseResultCard({ test }: { test: TestCaseResult }) {
  return (
    <div
      className={`rounded-lg border p-4 ${
        test.passed
          ? 'border-success/30 bg-success/5'
          : 'border-destructive/30 bg-destructive/5'
      }`}
    >
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
    </div>
  );
}
