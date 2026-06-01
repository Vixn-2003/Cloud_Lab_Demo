import { cn } from '@/lib/utils';

type ScoreVariant = 'perfect' | 'good' | 'partial' | 'failed' | 'none';

interface ScoreDisplayProps {
  score: number | null | undefined;
  maxScore?: number;
  size?: 'sm' | 'md' | 'lg';
  showProgress?: boolean;
  animated?: boolean;
  className?: string;
}

function getScoreVariant(score: number | null | undefined, maxScore: number): ScoreVariant {
  if (score === null || score === undefined) return 'none';
  const percentage = (score / maxScore) * 100;
  if (percentage === 100) return 'perfect';
  if (percentage >= 70) return 'good';
  if (percentage > 0) return 'partial';
  return 'failed';
}

const variantColors: Record<ScoreVariant, string> = {
  perfect: 'text-success bg-success/10',
  good: 'text-primary bg-primary/10',
  partial: 'text-warning bg-warning/10',
  failed: 'text-destructive bg-destructive/10',
  none: 'text-muted-foreground bg-muted',
};

const progressColors: Record<ScoreVariant, string> = {
  perfect: 'bg-gradient-to-r from-success to-info',
  good: 'bg-gradient-to-r from-primary to-[oklch(0.6_0.22_290)]',
  partial: 'bg-gradient-to-r from-warning to-[oklch(0.7_0.15_50)]',
  failed: 'bg-destructive',
  none: 'bg-muted',
};

const sizeClasses = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-sm px-2.5 py-1',
  lg: 'text-lg px-3 py-1.5 font-semibold',
};

export function ScoreDisplay({
  score,
  maxScore = 100,
  size = 'md',
  showProgress = false,
  animated = false,
  className,
}: ScoreDisplayProps) {
  const variant = getScoreVariant(score, maxScore);
  const percentage = score !== null && score !== undefined ? (score / maxScore) * 100 : 0;

  if (showProgress) {
    return (
      <div className={cn('space-y-2', className)}>
        <div className="flex items-center justify-between">
          <span className={cn('font-medium', variantColors[variant].split(' ')[0])}>
            {score !== null && score !== undefined ? `${score}/${maxScore}` : '—'}
          </span>
          {score !== null && score !== undefined && (
            <span className="text-sm text-muted-foreground">
              {Math.round(percentage)}%
            </span>
          )}
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-700',
              progressColors[variant],
              animated && 'animate-count-up'
            )}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    );
  }

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md font-medium',
        variantColors[variant],
        sizeClasses[size],
        animated && 'animate-count-up',
        className
      )}
    >
      {score !== null && score !== undefined ? `${score}/${maxScore}` : '—'}
    </span>
  );
}

interface ScoreBadgeProps {
  score: number | null | undefined;
  maxScore?: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function ScoreBadge({ score, maxScore = 100, size = 'sm', className }: ScoreBadgeProps) {
  const variant = getScoreVariant(score, maxScore);

  if (score === null || score === undefined) {
    return (
      <span className={cn('text-muted-foreground', className)}>—</span>
    );
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 font-medium',
        variantColors[variant].split(' ')[0],
        sizeClasses[size],
        className
      )}
    >
      {score === maxScore && '✓ '}
      {score}/{maxScore}
    </span>
  );
}
