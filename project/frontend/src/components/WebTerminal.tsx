import React, { useEffect, useRef, useState } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { io, Socket } from 'socket.io-client';
import '@xterm/xterm/css/xterm.css';

interface WebTerminalProps {
  sessionId: string | null;
  apiBase: string;
}

const WebTerminal: React.FC<WebTerminalProps> = ({ sessionId, apiBase }) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const socketRef = useRef<Socket | null>(null);

  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!sessionId || !terminalRef.current) return;

    // Initialize Xterm
    const term = new Terminal({
      cursorBlink: true,
      fontFamily: "'Fira Code', 'Monaco', monospace",
      fontSize: 14,
      theme: {
        background: '#000000',
        foreground: '#e2e8f0',
        cursor: '#3b82f6',
      }
    });
    
    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    
    xtermRef.current = term;
    fitAddonRef.current = fitAddon;

    term.open(terminalRef.current);
    fitAddon.fit();

    term.writeln('\x1b[34m[System]\x1b[0m Initializing terminal connection...');

    // Initialize Socket
    const socket = io(apiBase);
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      term.writeln('\x1b[32m[System]\x1b[0m Connected to terminal server.');
      
      // Start session
      socket.emit('terminal:start', { sessionId });
      
      // Send initial size
      socket.emit('terminal:resize', { 
        sessionId, 
        cols: term.cols, 
        rows: term.rows 
      });
    });

    socket.on('disconnect', () => {
      setConnected(false);
      term.writeln('\r\n\x1b[31m[System]\x1b[0m Disconnected from server.');
    });

    socket.on('terminal:output', (event: { sessionId: string, data: string }) => {
      if (event.sessionId === sessionId) {
        term.write(event.data);
      }
    });

    socket.on('terminal:exit', (event: { sessionId: string, exitCode: number }) => {
      if (event.sessionId === sessionId) {
        term.writeln(`\r\n\x1b[33m[System]\x1b[0m Session closed with code ${event.exitCode}.`);
      }
    });

    // Handle user input
    term.onData((data) => {
      if (socket.connected) {
        socket.emit('terminal:input', { sessionId, data });
      }
    });

    // Handle resize window
    const handleResize = () => {
      if (fitAddonRef.current && xtermRef.current && socketRef.current) {
        fitAddonRef.current.fit();
        socketRef.current.emit('terminal:resize', {
          sessionId,
          cols: xtermRef.current.cols,
          rows: xtermRef.current.rows
        });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      socket.disconnect();
      term.dispose();
    };
  }, [sessionId, apiBase]);

  return (
    <div className="w-full h-full relative bg-black flex flex-col">
      <div className="h-8 bg-slate-800 border-b border-slate-700 flex items-center px-4 justify-between select-none">
        <div className="text-xs font-mono text-slate-400 flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`}></span>
          Interactive Terminal
        </div>
        <div className="text-[10px] text-slate-500 font-mono">
          Session ID: {sessionId ? sessionId.substring(0, 8) + '...' : 'None'}
        </div>
      </div>
      <div className="flex-1 overflow-hidden p-2" ref={terminalRef}></div>
      {!sessionId && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center text-slate-400 font-mono text-sm z-10 backdrop-blur-sm">
          Click "Start Lab" to initialize terminal session.
        </div>
      )}
    </div>
  );
};

export default WebTerminal;
