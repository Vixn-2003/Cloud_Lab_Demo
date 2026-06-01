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
  Upload,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScoreDisplay, ScoreBadge } from '@/components/score-display';
import { CodeEditor } from '@/components/code-editor';
import { ConsoleOutput } from '@/components/console-output';
import { FileUploadZone } from '@/components/file-upload-zone';
import { useAppStore } from '@/lib/store';
import { getLab, getProfile, getSubmissions, runCode, submitCode, submitFile, getFaculties, getSubjects, getLabs } from '@/lib/api';
import { useSocket } from '@/hooks/use-socket';
import { WebTerminal } from '@/components/web-terminal';
import { LabWorkspaceSkeleton } from './lab-workspace-skeleton';
import type { ExecutionLog, GradingResult, TestCaseResult, Lab, ExecutionProfile, Attempt, Faculty, Subject, LabSummary } from '@/lib/types';

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

  const [loading, setLoading] = useState(true);
  const [lab, setLab] = useState<Lab | null>(null);
  const [profile, setProfile] = useState<ExecutionProfile | null>(null);
  const [previousAttempts, setPreviousAttempts] = useState<Attempt[]>([]);

  // Cascading selects states
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [allLabs, setAllLabs] = useState<LabSummary[]>([]);
  const [selectedFacultyId, setSelectedFacultyId] = useState<string>('');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');

  const { saveDraft, getDraft, setLastLabId } = useAppStore();

  const [code, setCode] = useState('');
  const [stdin, setStdin] = useState('');
  const [activeTab, setActiveTab] = useState<'instructions' | 'result' | 'history'>('instructions');
  const [editorTab, setEditorTab] = useState<'code' | 'upload'>('code');
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaved, setIsSaved] = useState(true);
  const [logs, setLogs] = useState<ExecutionLog[]>([]);
  const [consoleExpanded, setConsoleExpanded] = useState(true);
  const [gradingResult, setGradingResult] = useState<GradingResult | null>(null);
  const [executionMetadata, setExecutionMetadata] = useState<{ timeMs?: number; exitCode?: number; status?: string } | null>(null);

  const loadAttempts = useCallback(async () => {
    try {
      const submissions = await getSubmissions();
      const attempts = submissions
        .filter((a) => a.lab_id === labId)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      const enrichedAttempts = attempts.map((a, i) => ({
        ...a,
        attemptNumber: attempts.length - i,
      }));
      setPreviousAttempts(enrichedAttempts);
    } catch (err) {
      console.error('Failed to load attempts:', err);
    }
  }, [labId]);

  useEffect(() => {
    async function loadData() {
      try {
        const rawLab = await getLab(labId);
        setLab(rawLab);
        
        const rawProfile = await getProfile(rawLab.profileId);
        setProfile(rawProfile);
        
        // Initialize code with draft or template
        const draft = getDraft(labId);
        if (draft) {
          setCode(draft);
        } else if (rawProfile.language === 'python') {
          setCode(`# Write your Python code here\n\na = int(input())\nb = int(input())\nprint(a + b)\n`);
        } else {
          setCode(`#!/bin/bash\n# Write your shell script here\n\nread -r input\necho "$input"\n`);
        }

        // Fetch cascading Selects data
        const [rawFaculties, rawSubjects, rawLabs] = await Promise.all([
          getFaculties(),
          getSubjects(),
          getLabs(),
        ]);
        setFaculties(rawFaculties);
        setSubjects(rawSubjects);
        setAllLabs(rawLabs);

        // Set selected faculty & subject based on current lab
        const currentSubject = rawSubjects.find(s => s.id === rawLab.subjectId);
        if (currentSubject) {
          setSelectedFacultyId(currentSubject.facultyId);
          setSelectedSubjectId(currentSubject.id);
        }

        await loadAttempts();
      } catch (err) {
        console.error('Failed to load workspace data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [labId, getDraft, loadAttempts]);

  // Track last visited lab
  useEffect(() => {
    setLastLabId(labId);
  }, [labId, setLastLabId]);

  // Enterprise UX Safe Transition Guard: Intercept all anchor links transitions
  useEffect(() => {
    if (loading || !lab) return;
    
    const handleAnchorClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest('a');
      if (!target) return;
      
      const href = target.getAttribute('href');
      if (!href || href.startsWith('#') || href.includes('/labs/' + labId)) return;
      
      const isVmLab = lab?.environmentType === 'single_machine' || lab?.environmentType === 'multi_node';
      const hasUnsavedCode = !isSaved;
      
      if (isVmLab || hasUnsavedCode) {
        const message = isVmLab 
          ? "Switching labs will terminate your interactive terminal session and you will lose any unsaved files or commands in the workspace. Are you sure you want to continue?"
          : "You have unsaved changes in your code editor. Switching labs will discard these changes. Are you sure you want to continue?";
          
        if (!window.confirm(message)) {
          e.preventDefault();
          e.stopPropagation();
        }
      }
    };
    
    document.addEventListener('click', handleAnchorClick, true);
    return () => document.removeEventListener('click', handleAnchorClick, true);
  }, [loading, lab, isSaved, labId]);

  // Auto-save draft with visual feedback
  useEffect(() => {
    if (loading) return;
    setIsSaved(false);
    const timeout = setTimeout(() => {
      saveDraft(labId, code);
      setIsSaved(true);
    }, 1000);
    return () => clearTimeout(timeout);
  }, [code, labId, saveDraft, loading]);

  // Cascading Select handlers
  const checkUnsavedOrVm = useCallback((newLabId: string, onConfirm: () => void) => {
    if (newLabId === labId) return;
    const isVmLab = lab?.environmentType === 'single_machine' || lab?.environmentType === 'multi_node';
    const hasUnsavedCode = !isSaved;
    if (isVmLab || hasUnsavedCode) {
      const message = isVmLab 
        ? "Switching labs will terminate your interactive terminal session and you will lose any unsaved files or commands in the workspace. Are you sure you want to continue?"
        : "You have unsaved changes in your code editor. Switching labs will discard these changes. Are you sure you want to continue?";
      if (window.confirm(message)) {
        onConfirm();
      }
    } else {
      onConfirm();
    }
  }, [lab, isSaved, labId]);

  const handleFacultyChange = (facultyId: string) => {
    setSelectedFacultyId(facultyId);
    const filteredSubs = subjects.filter(s => s.facultyId === facultyId);
    if (filteredSubs.length > 0) {
      const nextSub = filteredSubs[0];
      setSelectedSubjectId(nextSub.id);
      const filteredLabs = allLabs.filter(l => l.subjectId === nextSub.id);
      if (filteredLabs.length > 0) {
        const nextLabId = filteredLabs[0].id;
        checkUnsavedOrVm(nextLabId, () => {
          router.push(`/labs/${nextLabId}`);
        });
      }
    } else {
      setSelectedSubjectId('');
    }
  };

  const handleSubjectChange = (subjectId: string) => {
    setSelectedSubjectId(subjectId);
    const filteredLabs = allLabs.filter(l => l.subjectId === subjectId);
    if (filteredLabs.length > 0) {
      const nextLabId = filteredLabs[0].id;
      checkUnsavedOrVm(nextLabId, () => {
        router.push(`/labs/${nextLabId}`);
      });
    }
  };

  const handleLabChange = (newLabId: string) => {
    if (newLabId && newLabId !== labId) {
      checkUnsavedOrVm(newLabId, () => {
        router.push(`/labs/${newLabId}`);
      });
    }
  };

  // Socket connection
  const { subscribeToExecution } = useSocket({
    onLog: (log) => {
      setLogs((prev) => [...prev, log]);
    },
    onStatus: (status, payload) => {
      if (status === 'finished') {
        setIsRunning(false);
        setIsSubmitting(false);
        if (payload) {
          const res = payload as any;
          if (res.mode === 'submit') {
            setGradingResult(res);
            setActiveTab('result');
            toast.success(`Submission graded! Score: ${res.score}/100`);
            loadAttempts();
          } else {
            setExecutionMetadata({
              timeMs: res.executionTimeMs || 0,
              exitCode: res.exitCode ?? 0,
              status: 'finished',
            });
            
            // Populate logs from the final payload in case WebSocket logs streaming packets are lost/missed due to race conditions
            const finalLogs: ExecutionLog[] = [];
            if (res.stdout) {
              finalLogs.push({ stream: 'stdout', data: res.stdout, timestamp: Date.now() });
            }
            if (res.stderr) {
              finalLogs.push({ stream: 'stderr', data: res.stderr, timestamp: Date.now() });
            }
            if (finalLogs.length > 0) {
              setLogs(finalLogs);
            }
            
            toast.success('Run execution finished');
          }
        } else {
          toast.success('Execution completed');
        }
      } else if (status === 'failed') {
        setIsRunning(false);
        setIsSubmitting(false);
        const errPayload = payload as any;
        setExecutionMetadata({
          timeMs: errPayload?.executionTimeMs || 0,
          exitCode: errPayload?.exitCode ?? 1,
          status: 'failed',
        });
        
        // Also populate logs for failed executions (like compilation errors or run crashes)
        const finalLogs: ExecutionLog[] = [];
        if (errPayload?.stdout) {
          finalLogs.push({ stream: 'stdout', data: errPayload.stdout, timestamp: Date.now() });
        }
        if (errPayload?.stderr) {
          finalLogs.push({ stream: 'stderr', data: errPayload.stderr, timestamp: Date.now() });
        } else if (errPayload?.error) {
          finalLogs.push({ stream: 'stderr', data: errPayload.error, timestamp: Date.now() });
        }
        if (finalLogs.length > 0) {
          setLogs(finalLogs);
        }
        
        toast.error(`Execution failed: ${errPayload?.error || 'Unknown error'}`);
      } else if (status === 'timeout') {
        setIsRunning(false);
        setIsSubmitting(false);
        setExecutionMetadata({
          status: 'timeout',
          exitCode: 124,
          timeMs: profile?.timeoutMs || 5000,
        });
        toast.error('Execution timeout!');
      }
    }
  });

  const handleRunCode = useCallback(async () => {
    if (!profile) return;
    setIsRunning(true);
    setLogs([]);
    setExecutionMetadata(null);
    setConsoleExpanded(true);
    toast.info('Starting execution...');
    try {
      const res = await runCode(code, profile.id, stdin);
      subscribeToExecution(res.executionId);
    } catch (err: any) {
      setIsRunning(false);
      toast.error(`Failed to start run: ${err.message}`);
    }
  }, [code, profile, stdin, subscribeToExecution]);

  const handleRunTests = useCallback(async () => {
    if (!profile || !lab) return;
    setIsRunning(true);
    setLogs([]);
    setExecutionMetadata(null);
    setConsoleExpanded(true);
    toast.info('Running test cases...');
    try {
      const res = await submitCode(code, profile.id, lab.id);
      subscribeToExecution(res.executionId);
    } catch (err: any) {
      setIsRunning(false);
      toast.error(`Failed to run tests: ${err.message}`);
    }
  }, [code, profile, lab, subscribeToExecution]);

  const handleSubmit = useCallback(async () => {
    if (!profile || !lab) return;
    setIsSubmitting(true);
    setLogs([]);
    setExecutionMetadata(null);
    setConsoleExpanded(true);
    toast.info('Submitting solution for grading...');
    try {
      const res = await submitCode(code, profile.id, lab.id);
      subscribeToExecution(res.executionId);
    } catch (err: any) {
      setIsSubmitting(false);
      toast.error(`Failed to submit: ${err.message}`);
    }
  }, [code, profile, lab, subscribeToExecution]);

  const handleFileSubmit = useCallback(async (file: File) => {
    if (!profile || !lab) return;
    setIsSubmitting(true);
    setLogs([]);
    setExecutionMetadata(null);
    toast.info(`Đang nộp file "${file.name}" để chấm điểm...`);
    try {
      const res = await submitFile(file, profile.id, lab.id);
      subscribeToExecution(res.executionId);
    } catch (err: any) {
      setIsSubmitting(false);
      toast.error(`Nộp file thất bại: ${err.message}`);
    }
  }, [profile, lab, subscribeToExecution]);

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
      if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        saveDraft(labId, code);
        setIsSaved(true);
        toast.success('Draft saved');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [code, labId, saveDraft, handleSubmit, handleRunTests]);

  if (loading) {
    return <LabWorkspaceSkeleton />;
  }

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
              <h1 className="font-semibold text-base tracking-tight">{lab.title}</h1>
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

        {lab.environmentType !== 'single_machine' && lab.environmentType !== 'multi_node' && (
          <div className="flex items-center gap-2">
            {/* Save Status */}
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mr-2 save-status-indicator">
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
        )}
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

                    {/* Examples Section */}
                    {lab.examples && lab.examples.length > 0 && (
                      <div className="space-y-4 pt-4 border-t border-border mt-6">
                        <h4 className="text-sm font-semibold flex items-center gap-2 text-foreground">
                          <FileCode className="h-4 w-4 text-primary" />
                          Ví dụ mẫu (Examples)
                        </h4>
                        <div className="space-y-4">
                          {lab.examples.map((ex, index) => (
                            <div key={index} className="rounded-lg border border-border bg-accent/5 p-3 space-y-3">
                              <div className="flex items-center justify-between text-xs font-semibold select-none">
                                <span className="text-muted-foreground">Ví dụ #{index + 1}</span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 text-[11px] font-medium text-primary hover:text-primary-foreground hover:bg-primary/95 rounded px-2"
                                  onClick={() => {
                                    setStdin(ex.input);
                                    toast.success(`Đã điền Input của Ví dụ #${index + 1} vào ô Custom Test Input!`);
                                  }}
                                >
                                  Dùng làm Custom Input
                                </Button>
                              </div>
                              <div className="grid grid-cols-2 gap-3 text-xs">
                                <div>
                                  <span className="text-muted-foreground font-semibold block mb-1">Input mẫu:</span>
                                  <pre className="rounded bg-background/50 border border-border/40 p-2 font-mono text-[11px] overflow-x-auto whitespace-pre">
                                    {ex.input}
                                  </pre>
                                </div>
                                <div>
                                  <span className="text-muted-foreground font-semibold block mb-1">Output mẫu:</span>
                                  <pre className="rounded bg-background/50 border border-border/40 p-2 font-mono text-[11px] overflow-x-auto whitespace-pre">
                                    {ex.output}
                                  </pre>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Execution Environment Detail Card */}
                    <div className="rounded-xl border border-border/80 bg-muted/20 p-4 space-y-3 mt-6 shadow-xs">
                      <h4 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 select-none">
                        <TerminalIcon className="h-3.5 w-3.5 text-primary" />
                        Execution Environment
                      </h4>
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div className="flex flex-col gap-1 p-2 rounded-lg bg-background/40 border border-border/30">
                          <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Environment Type</span>
                          <span className="font-semibold capitalize text-foreground flex items-center gap-1.5 mt-0.5">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            {lab.environmentType === 'single_machine' ? 'Virtual Machine (VM)' : 
                             lab.environmentType === 'multi_node' ? 'Multi-Node Network' : 'Sandboxed Sandbox'}
                          </span>
                        </div>
                        <div className="flex flex-col gap-1 p-2 rounded-lg bg-background/40 border border-border/30">
                          <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Profile / OS</span>
                          <span className="font-semibold text-foreground mt-0.5 capitalize">
                            {profile.displayName} ({profile.osFamily})
                          </span>
                        </div>
                        <div className="flex flex-col gap-1 p-2 rounded-lg bg-background/40 border border-border/30">
                          <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Time Limit</span>
                          <span className="font-semibold text-foreground mt-0.5 flex items-center gap-1">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            {profile.timeoutMs} ms
                          </span>
                        </div>
                        <div className="flex flex-col gap-1 p-2 rounded-lg bg-background/40 border border-border/30">
                          <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Security Context</span>
                          <span className="font-semibold text-amber-500/90 dark:text-amber-400/90 mt-0.5">
                            {lab.environmentType === 'single_machine' || lab.environmentType === 'multi_node' 
                              ? 'Full Root Access' 
                              : 'Secured Process Isolation'}
                          </span>
                        </div>
                      </div>
                      
                      {lab.toolset && lab.toolset.length > 0 && (
                        <div className="pt-2.5 border-t border-border/40">
                          <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider block mb-1.5">Pre-configured Tools</span>
                          <div className="flex flex-wrap gap-1">
                            {lab.toolset.map((tool) => (
                              <Badge key={tool} variant="outline" className="px-2 py-0.5 text-[10px] font-mono bg-accent/30 text-accent-foreground border-border/50 select-none">
                                {tool}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
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

              <TabsContent id="result-tab-pane" value="result" className="flex-1 m-0 overflow-hidden">
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

        {/* Right Panel - Editor & Console / WebTerminal */}
        <ResizablePanel defaultSize={60} minSize={35}>
          {lab.environmentType === 'single_machine' || lab.environmentType === 'multi_node' ? (
            <div className="flex h-full flex-col">
              {/* Terminal Tab Switcher: Terminal / Upload ZIP */}
              <div className="flex items-center border-b border-border px-4 gap-4">
                <button
                  onClick={() => setEditorTab('code')}
                  className={`flex items-center gap-1.5 py-2.5 text-sm border-b-2 transition-colors ${
                    editorTab === 'code'
                      ? 'border-primary text-primary font-medium'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <TerminalIcon className="h-3.5 w-3.5" />
                  Web Terminal
                </button>
                <button
                  onClick={() => setEditorTab('upload')}
                  className={`flex items-center gap-1.5 py-2.5 text-sm border-b-2 transition-colors ${
                    editorTab === 'upload'
                      ? 'border-primary text-primary font-medium'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Upload className="h-3.5 w-3.5" />
                  Nộp Labtainer ZIP
                </button>
                <div className="ml-auto flex items-center gap-1.5 text-xs text-muted-foreground py-2.5">
                  <span className="font-mono text-[10px] bg-muted px-1.5 py-0.5 rounded">Labtainer VM Environment</span>
                </div>
              </div>

              {editorTab === 'upload' ? (
                <FileUploadZone
                  onSubmit={handleFileSubmit}
                  isSubmitting={isSubmitting}
                  isLabtainer={true}
                  className="flex-1"
                />
              ) : (
                <WebTerminal labId={lab.id} />
              )}
            </div>
          ) : (
            <div className="flex h-full flex-col">
              {/* Editor Tab Switcher: Code / Upload */}
              <div className="flex items-center border-b border-border px-4 gap-4">
                <button
                  onClick={() => setEditorTab('code')}
                  className={`flex items-center gap-1.5 py-2.5 text-sm border-b-2 transition-colors ${
                    editorTab === 'code'
                      ? 'border-primary text-primary font-medium'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <FileCode className="h-3.5 w-3.5" />
                  Soạn code
                </button>
                <button
                  onClick={() => setEditorTab('upload')}
                  className={`flex items-center gap-1.5 py-2.5 text-sm border-b-2 transition-colors ${
                    editorTab === 'upload'
                      ? 'border-primary text-primary font-medium'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Upload className="h-3.5 w-3.5" />
                  Upload file
                </button>
                <div className="ml-auto flex items-center gap-1.5 text-xs text-muted-foreground py-2.5">
                  <span className="font-mono text-[10px] bg-muted px-1.5 py-0.5 rounded">{profile.displayName}</span>
                </div>
              </div>

              {editorTab === 'upload' ? (
                <FileUploadZone
                  onSubmit={handleFileSubmit}
                  isSubmitting={isSubmitting}
                  profileLanguage={profile.displayName}
                  className="flex-1"
                />
              ) : (
                <div className="flex flex-col flex-1 overflow-hidden">
                  {/* Editor Header */}
                  <div className="flex items-center justify-between border-b border-border px-4 py-2">
                    <div className="flex items-center gap-2">
                      <FileCode className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{filename}</span>
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
                          <ConsoleOutput logs={logs} metadata={executionMetadata} />
                        )}
                      </div>
                    </ResizablePanel>
                  </ResizablePanelGroup>
                </div>
              )}
            </div>
          )}
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
