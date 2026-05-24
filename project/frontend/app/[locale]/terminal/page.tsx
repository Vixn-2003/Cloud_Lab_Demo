'use client';

import { useState } from 'react';
import { Terminal, Maximize2, Minimize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { WebTerminal } from '@/components/web-terminal';

export default function TerminalPage() {
  const [isFullscreen, setIsFullscreen] = useState(false);

  return (
    <div className="animate-fade-in-up p-6 h-[calc(100vh-3.5rem)] flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Terminal className="h-6 w-6 text-primary" />
            Interactive Terminal
          </h1>
          <p className="text-muted-foreground">
            Access a secure cloud Linux shell environment
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
        </div>
      </div>

      <Card className={`flex-1 flex flex-col ${isFullscreen ? 'fixed inset-4 z-50' : 'overflow-hidden'}`}>
        <CardHeader className="py-3 px-4 border-b border-border flex flex-row items-center justify-between bg-card/55 shrink-0">
          <CardTitle className="text-sm flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
            Active Session
          </CardTitle>
          <span className="text-xs text-muted-foreground font-mono">
            xterm.js — bash
          </span>
        </CardHeader>
        <CardContent className="flex-1 p-0 overflow-hidden">
          <WebTerminal className="h-full w-full" />
        </CardContent>
      </Card>
    </div>
  );
}
