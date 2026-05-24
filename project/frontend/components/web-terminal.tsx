'use client';

import { useEffect, useRef, useState } from 'react';
import { useSocket } from '@/hooks/use-socket';
import { initTerminal } from '@/lib/api';
import { Loader2, Terminal as TerminalIcon } from 'lucide-react';
import { toast } from 'sonner';

// Custom CSS for xterm terminal styling
import '@xterm/xterm/css/xterm.css';

interface WebTerminalProps {
  labId?: string;
  className?: string;
}

export function WebTerminal({ labId, className = '' }: WebTerminalProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const terminalRef = useRef<any>(null);
  const fitAddonRef = useRef<any>(null);
  
  const [loading, setLoading] = useState(true);
  const [sessionId, setSessionId] = useState<string | null>(null);

  // Initialize socket
  const { 
    isConnected, 
    startTerminal, 
    sendTerminalInput, 
    resizeTerminal 
  } = useSocket({
    onTerminalOutput: (data) => {
      if (terminalRef.current) {
        terminalRef.current.write(data);
      }
    },
    onTerminalExit: (exitCode) => {
      toast.info(`Terminal session exited with code ${exitCode}`);
      if (terminalRef.current) {
        terminalRef.current.write('\r\n[Session Exited]\r\n');
      }
    }
  });

  // Fetch sessionId from backend on mount
  useEffect(() => {
    let active = true;
    async function setupSession() {
      try {
        const res = await initTerminal(labId);
        if (active) {
          setSessionId(res.sessionId);
        }
      } catch (err) {
        console.error('Failed to init terminal session:', err);
        toast.error('Failed to initialize terminal session on backend');
      }
    }
    setupSession();
    return () => {
      active = false;
    };
  }, [labId]);

  // Initialize xterm when sessionId and socket connection are ready
  useEffect(() => {
    if (!sessionId || !isConnected || !containerRef.current) return;

    let destroyed = false;
    let terminal: any = null;
    let fitAddon: any = null;

    // Load xterm dynamically to avoid SSR issues
    const initXterm = async () => {
      const { Terminal } = await import('@xterm/xterm');
      const { FitAddon } = await import('@xterm/addon-fit');

      if (destroyed) return;

      terminal = new Terminal({
        cursorBlink: true,
        cursorStyle: 'block',
        fontSize: 14,
        fontFamily: 'var(--font-jetbrains-mono), Menlo, Monaco, Consolas, monospace',
        theme: {
          background: 'oklch(0.12 0.005 285)',
          foreground: 'oklch(0.9 0.01 285)',
          cursor: 'oklch(0.7 0.1 140)',
          selectionBackground: 'rgba(255, 255, 255, 0.15)',
          black: '#000000',
          red: '#ff5555',
          green: '#50fa7b',
          yellow: '#f1fa8c',
          blue: '#bd93f9',
          magenta: '#ff79c6',
          cyan: '#8be9fd',
          white: '#bfbfbf',
        },
      });

      fitAddon = new FitAddon();
      terminal.loadAddon(fitAddon);

      // Open terminal in container
      terminal.open(containerRef.current);
      fitAddon.fit();

      terminalRef.current = terminal;
      fitAddonRef.current = fitAddon;

      // Start shell
      startTerminal(sessionId);

      // Handle keyboard inputs
      terminal.onData((data: string) => {
        sendTerminalInput(sessionId, data);
      });

      // Handle terminal resize
      const handleResize = () => {
        if (fitAddonRef.current && terminalRef.current) {
          fitAddonRef.current.fit();
          const { cols, rows } = terminalRef.current;
          resizeTerminal(sessionId, cols, rows);
        }
      };

      window.addEventListener('resize', handleResize);
      
      // Delay resize notification slightly to ensure shell is spawned
      setTimeout(() => {
        if (terminalRef.current) {
          const { cols, rows } = terminalRef.current;
          resizeTerminal(sessionId, cols, rows);
        }
      }, 500);

      setLoading(false);

      // Save references on cleanup
      return () => {
        window.removeEventListener('resize', handleResize);
        terminal.dispose();
      };
    };

    const cleanupPromise = initXterm();

    return () => {
      destroyed = true;
      cleanupPromise.then((cleanup) => cleanup?.());
    };
  }, [sessionId, isConnected, startTerminal, sendTerminalInput, resizeTerminal]);

  return (
    <div className={`relative flex flex-col h-full bg-[oklch(0.12_0.005_285)] overflow-hidden ${className}`}>
      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[oklch(0.12_0.005_285)]/80 backdrop-blur-sm z-10 space-y-3">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
          <span className="text-xs text-muted-foreground font-mono">Spawning interactive shell session...</span>
        </div>
      )}
      <div ref={containerRef} className="flex-1 w-full h-full p-2 focus:outline-none" />
    </div>
  );
}
