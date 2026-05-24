import Link from 'next/link';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface KpiCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  href?: string;
  linkLabel?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

export function KpiCard({
  title,
  value,
  icon: Icon,
  href,
  linkLabel = 'View',
  trend,
  className,
}: KpiCardProps) {
  const CardWrapper = href ? Link : 'div';
  const cardProps = href ? { href } : {};

  return (
    <CardWrapper
      {...cardProps}
      className={cn(
        'group relative flex flex-col gap-3 rounded-xl border border-border bg-card p-5 transition-all duration-200',
        href && 'cursor-pointer hover:border-primary/50 hover:bg-accent/50 hover:-translate-y-0.5',
        className
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        {trend && (
          <span
            className={cn(
              'text-xs font-medium',
              trend.isPositive ? 'text-success' : 'text-destructive'
            )}
          >
            {trend.isPositive ? '+' : ''}{trend.value}%
          </span>
        )}
      </div>
      <div className="space-y-1">
        <p className="text-3xl font-bold tracking-tight">{value}</p>
        <p className="text-sm text-muted-foreground">{title}</p>
      </div>
      {href && linkLabel && (
        <span className="text-xs font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
          {linkLabel} →
        </span>
      )}
    </CardWrapper>
  );
}
