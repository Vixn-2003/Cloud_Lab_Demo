'use client';

import { useEffect, useRef } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import type { ExecutionLog } from '@/lib/types';

interface ConsoleOutputProps {
  logs: ExecutionLog[];
  className?: string;
}

export function ConsoleOutput({ logs, className }: ConsoleOutputProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <ScrollArea className={cn('h-full', className)} ref={scrollRef}>
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
  );
}
