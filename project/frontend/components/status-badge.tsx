import { cn } from '@/lib/utils';
import type { ExecutionStatus } from '@/lib/types';

interface StatusBadgeProps {
  status: ExecutionStatus | string;
  className?: string;
}

const statusConfig: Record<string, { label: string; className: string }> = {
  queued: {
    label: 'Queued',
    className: 'bg-muted text-muted-foreground',
  },
  started: {
    label: 'Starting',
    className: 'bg-info/10 text-info',
  },
  streaming: {
    label: 'Running',
    className: 'bg-primary/10 text-primary animate-pulse',
  },
  running: {
    label: 'Running',
    className: 'bg-primary/10 text-primary animate-pulse',
  },
  finished: {
    label: 'Completed',
    className: 'bg-success/10 text-success',
  },
  graded: {
    label: 'Graded',
    className: 'bg-success/10 text-success',
  },
  failed: {
    label: 'Failed',
    className: 'bg-destructive/10 text-destructive',
  },
  timeout: {
    label: 'Timeout',
    className: 'bg-warning/10 text-warning',
  },
  pending: {
    label: 'Pending',
    className: 'bg-warning/10 text-warning',
  },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status.toLowerCase()] || {
    label: status,
    className: 'bg-muted text-muted-foreground',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium',
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
}
