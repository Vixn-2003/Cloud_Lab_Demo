'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import type { ExecutionLog, ExecutionStatus } from '@/lib/types';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3001';

interface UseSocketOptions {
  onLog?: (log: ExecutionLog) => void;
  onStatus?: (status: ExecutionStatus, payload?: unknown) => void;
  onTerminalOutput?: (data: string) => void;
  onTerminalExit?: (exitCode: number) => void;
}

export function useSocket(options: UseSocketOptions = {}) {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const socket = io(API_BASE, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socket.on('connect', () => {
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('execution:log', (data: { executionId: string; stream: 'stdout' | 'stderr'; data: string }) => {
      options.onLog?.({
        stream: data.stream,
        data: data.data,
        timestamp: Date.now(),
      });
    });

    socket.on('execution:status', (data: { executionId: string; status: ExecutionStatus; payload?: unknown }) => {
      options.onStatus?.(data.status, data.payload);
    });

    socket.on('terminal:output', (data: { sessionId: string; data: string }) => {
      options.onTerminalOutput?.(data.data);
    });

    socket.on('terminal:exit', (data: { sessionId: string; exitCode: number }) => {
      options.onTerminalExit?.(data.exitCode);
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
    };
  }, []);

  const subscribeToExecution = useCallback((executionId: string) => {
    socketRef.current?.emit('subscribe', executionId);
  }, []);

  const startTerminal = useCallback((sessionId: string) => {
    socketRef.current?.emit('terminal:start', { sessionId });
  }, []);

  const sendTerminalInput = useCallback((sessionId: string, data: string) => {
    socketRef.current?.emit('terminal:input', { sessionId, data });
  }, []);

  const resizeTerminal = useCallback((sessionId: string, cols: number, rows: number) => {
    socketRef.current?.emit('terminal:resize', { sessionId, cols, rows });
  }, []);

  return {
    isConnected,
    subscribeToExecution,
    startTerminal,
    sendTerminalInput,
    resizeTerminal,
  };
}
