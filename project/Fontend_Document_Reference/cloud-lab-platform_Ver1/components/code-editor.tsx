'use client';

import { useRef, useEffect } from 'react';
import Editor, { OnMount } from '@monaco-editor/react';
import { useAppStore } from '@/lib/store';

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language?: string;
  readOnly?: boolean;
}

const languageMap: Record<string, string> = {
  python: 'python',
  shell: 'shell',
  bash: 'shell',
  javascript: 'javascript',
  typescript: 'typescript',
  java: 'java',
  cpp: 'cpp',
  c: 'c',
};

export function CodeEditor({
  value,
  onChange,
  language = 'shell',
  readOnly = false,
}: CodeEditorProps) {
  const { editorSettings } = useAppStore();
  const editorRef = useRef<Parameters<OnMount>[0] | null>(null);

  const handleEditorDidMount: OnMount = (editor) => {
    editorRef.current = editor;
  };

  const monacoLanguage = languageMap[language] || 'plaintext';

  return (
    <div className="h-full w-full">
      <Editor
        height="100%"
        language={monacoLanguage}
        value={value}
        onChange={(v) => onChange(v || '')}
        onMount={handleEditorDidMount}
        theme="vs-dark"
        options={{
          fontSize: editorSettings.fontSize,
          tabSize: editorSettings.tabSize,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          wordWrap: 'on',
          lineNumbers: 'on',
          glyphMargin: false,
          folding: true,
          lineDecorationsWidth: 10,
          lineNumbersMinChars: 3,
          renderLineHighlight: 'line',
          cursorBlinking: 'smooth',
          cursorSmoothCaretAnimation: 'on',
          smoothScrolling: true,
          padding: { top: 16, bottom: 16 },
          readOnly,
          automaticLayout: true,
          fontFamily: "'JetBrains Mono', 'Fira Code', 'Monaco', monospace",
          fontLigatures: true,
        }}
        loading={
          <div className="flex h-full items-center justify-center bg-[oklch(0.13_0.005_285)]">
            <div className="text-sm text-muted-foreground">Loading editor...</div>
          </div>
        }
      />
    </div>
  );
}
