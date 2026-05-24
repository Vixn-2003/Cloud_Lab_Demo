'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { Play, Download, Upload, FileCode, Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { CodeEditor } from '@/components/code-editor';
import { ConsoleOutput } from '@/components/console-output';
import type { ExecutionLog } from '@/lib/types';

const profiles = [
  { id: 'python', name: 'Python 3', extension: '.py' },
  { id: 'shell', name: 'Shell/Bash', extension: '.sh' },
  { id: 'javascript', name: 'JavaScript', extension: '.js' },
  { id: 'typescript', name: 'TypeScript', extension: '.ts' },
];

export default function WorkspacePage() {
  const [language, setLanguage] = useState('python');
  const [code, setCode] = useState(`# Write your code here
print("Hello, World!")
`);
  const [stdin, setStdin] = useState('');
  const [logs, setLogs] = useState<ExecutionLog[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const profile = profiles.find((p) => p.id === language);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleRun();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [code]);

  const handleRun = useCallback(async () => {
    setIsRunning(true);
    setLogs([]);
    toast.info('Running code...');

    // Simulate execution
    setTimeout(() => {
      setLogs([{ stream: 'stdout', data: '$ Starting execution...\n', timestamp: Date.now() }]);
    }, 200);

    setTimeout(() => {
      if (language === 'python') {
        setLogs((prev) => [
          ...prev,
          { stream: 'stdout', data: 'Hello, World!\n', timestamp: Date.now() },
        ]);
      } else {
        setLogs((prev) => [
          ...prev,
          { stream: 'stdout', data: 'Output from your code...\n', timestamp: Date.now() },
        ]);
      }
    }, 500);

    setTimeout(() => {
      setLogs((prev) => [
        ...prev,
        { stream: 'stdout', data: '\n✓ Exit code: 0 (23ms)\n', timestamp: Date.now() },
      ]);
      setIsRunning(false);
      toast.success('Execution completed');
    }, 800);
  }, [language]);

  return (
    <div className="animate-fade-in-up h-[calc(100vh-3.5rem)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-2">
        <div className="flex items-center gap-3">
          <FileCode className="h-5 w-5 text-primary" />
          <span className="font-semibold">Standalone Editor</span>
          <Select value={language} onValueChange={setLanguage}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {profiles.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Upload className="mr-2 h-4 w-4" />
            Load
          </Button>
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Save
          </Button>
          <Button size="sm" onClick={handleRun} disabled={isRunning}>
            <Play className="mr-2 h-4 w-4" />
            {isRunning ? 'Running...' : 'Run'}
          </Button>
        </div>
      </div>

      {/* Editor and Console */}
      <ResizablePanelGroup direction="vertical" className="flex-1">
        <ResizablePanel defaultSize={70} minSize={30}>
          <div className="flex h-full">
            {/* Main Editor */}
            <div className="flex-1">
              <CodeEditor
                value={code}
                onChange={setCode}
                language={language}
              />
            </div>
            {/* Stdin Panel */}
            <div className="w-64 border-l border-border flex flex-col">
              <div className="flex items-center gap-2 border-b border-border px-3 py-2">
                <Settings2 className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Input (stdin)</span>
              </div>
              <Textarea
                value={stdin}
                onChange={(e) => setStdin(e.target.value)}
                placeholder="Enter input for your program..."
                className="flex-1 resize-none rounded-none border-0 font-mono text-sm"
              />
            </div>
          </div>
        </ResizablePanel>

        <ResizableHandle />

        <ResizablePanel defaultSize={30} minSize={10}>
          <div className="h-full border-t border-border bg-[oklch(0.11_0.005_285)]">
            <div className="flex items-center gap-2 border-b border-border px-4 py-2">
              <span className="text-sm font-medium">Console Output</span>
            </div>
            <ConsoleOutput logs={logs} />
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
