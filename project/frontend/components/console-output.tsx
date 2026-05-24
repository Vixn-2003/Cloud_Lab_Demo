'use client';

import { useEffect, useRef } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import type { ExecutionLog } from '@/lib/types';

interface ConsoleOutputProps {
  logs: ExecutionLog[];
  className?: string;
  metadata?: {
    timeMs?: number;
    exitCode?: number;
    status?: string;
  } | null;
}

export function ConsoleOutput({ logs, className, metadata }: ConsoleOutputProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="flex flex-col h-full overflow-hidden flex-1">
      <ScrollArea className={cn('flex-1', className)} ref={scrollRef}>
        <div className="p-4 font-mono text-sm">
          {logs.length === 0 ? (
            <span className="text-muted-foreground">
              Output will appear here...
            </span>
          ) : (
            logs.map((log, index) => (
              <div
                key={index}
                className={cn(
                  'whitespace-pre-wrap break-all',
                  log.stream === 'stderr' && 'text-destructive'
                )}
              >
                {log.data}
              </div>
            ))
          )}
        </div>
      </ScrollArea>
      {metadata && (
        <div className="flex justify-between items-center px-4 py-2 border-t border-border bg-background/50 font-mono text-[10px] text-muted-foreground tracking-wider select-none shrink-0">
          <span>TIME: {metadata.timeMs}ms</span>
          <span>EXIT CODE: {metadata.exitCode}</span>
          <span className={cn(
            'font-bold',
            metadata.status === 'finished' ? 'text-success' : 'text-destructive'
          )}>
            STATUS: {metadata.status?.toUpperCase()}
          </span>
        </div>
      )}
    </div>
  );
}
