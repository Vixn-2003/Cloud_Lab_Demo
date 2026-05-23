'use client';

import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Terminal, Power, Maximize2, Minimize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function TerminalPage() {
  const terminalRef = useRef<HTMLDivElement>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [terminalContent, setTerminalContent] = useState<string[]>([
    '$ Welcome to Cloud Lab Terminal',
    '$ This is an interactive Linux shell environment',
    '$ Type "help" for available commands',
    '$ ',
  ]);
  const [currentInput, setCurrentInput] = useState('');

  const handleConnect = () => {
    toast.info('Connecting to terminal server...');
    setTimeout(() => {
      setIsConnected(true);
      setTerminalContent((prev) => [
        ...prev,
        '$ Connected to server',
        '$ Session ID: term_' + Math.random().toString(36).substr(2, 9),
        '$ ',
      ]);
      toast.success('Terminal connected');
    }, 1000);
  };

  const handleDisconnect = () => {
    setIsConnected(false);
    setTerminalContent((prev) => [...prev, '$ Disconnected from server', '$ ']);
    toast.info('Terminal disconnected');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const command = currentInput.trim();
      setTerminalContent((prev) => [...prev.slice(0, -1), `$ ${command}`]);

      // Simulate command execution
      setTimeout(() => {
        let output = '';
        switch (command.toLowerCase()) {
          case 'help':
            output = 'Available commands: help, ls, pwd, whoami, date, clear, exit';
            break;
          case 'ls':
            output = 'documents  downloads  projects  README.md';
            break;
          case 'pwd':
            output = '/home/student';
            break;
          case 'whoami':
            output = 'student';
            break;
          case 'date':
            output = new Date().toString();
            break;
          case 'clear':
            setTerminalContent(['$ ']);
            setCurrentInput('');
            return;
          case 'exit':
            handleDisconnect();
            return;
          case '':
            break;
          default:
            output = `bash: ${command}: command not found`;
        }

        setTerminalContent((prev) => [
          ...prev,
          ...(output ? [output] : []),
          '$ ',
        ]);
      }, 100);

      setCurrentInput('');
    } else if (e.key === 'Backspace') {
      setCurrentInput((prev) => prev.slice(0, -1));
    } else if (e.key.length === 1) {
      setCurrentInput((prev) => prev + e.key);
    }
  };

  // Auto-scroll to bottom
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [terminalContent]);

  return (
    <div className="animate-fade-in-up p-6 h-[calc(100vh-3.5rem)] flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Terminal className="h-6 w-6 text-primary" />
            Interactive Terminal
          </h1>
          <p className="text-muted-foreground">
            Access a Linux shell environment for practice
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsFullscreen(!isFullscreen)}
          >
            {isFullscreen ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </Button>
          {isConnected ? (
            <Button variant="destructive" size="sm" onClick={handleDisconnect}>
              <Power className="mr-2 h-4 w-4" />
              Disconnect
            </Button>
          ) : (
            <Button size="sm" onClick={handleConnect}>
              <Power className="mr-2 h-4 w-4" />
              Connect
            </Button>
          )}
        </div>
      </div>

      <Card className={`flex-1 flex flex-col ${isFullscreen ? 'fixed inset-4 z-50' : ''}`}>
        <CardHeader className="py-3 px-4 border-b border-border flex flex-row items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <div
              className={`h-2 w-2 rounded-full ${
                isConnected ? 'bg-success animate-pulse' : 'bg-muted'
              }`}
            />
            {isConnected ? 'Connected' : 'Disconnected'}
          </CardTitle>
          <span className="text-xs text-muted-foreground font-mono">
            bash - 80x24
          </span>
        </CardHeader>
        <CardContent className="flex-1 p-0 overflow-hidden">
          <div
            ref={terminalRef}
            className="h-full bg-[oklch(0.08_0.005_285)] p-4 font-mono text-sm text-green-400 overflow-auto focus:outline-none"
            tabIndex={0}
            onKeyDown={handleKeyDown}
            onClick={() => terminalRef.current?.focus()}
          >
            {terminalContent.map((line, index) => (
              <div key={index} className="whitespace-pre-wrap">
                {line}
                {index === terminalContent.length - 1 && (
                  <>
                    {currentInput}
                    <span className="animate-blink inline-block w-2 h-4 bg-green-400 ml-0.5" />
                  </>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {!isConnected && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm pointer-events-none">
          <Card className="pointer-events-auto">
            <CardContent className="p-6 text-center">
              <Terminal className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="font-semibold mb-2">Terminal Disconnected</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Click Connect to start a new terminal session
              </p>
              <Button onClick={handleConnect}>
                <Power className="mr-2 h-4 w-4" />
                Connect
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
