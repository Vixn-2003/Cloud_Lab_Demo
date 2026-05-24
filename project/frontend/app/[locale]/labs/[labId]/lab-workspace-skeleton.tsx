import { Skeleton } from '@/components/ui/skeleton';

export function LabWorkspaceSkeleton() {
  return (
    <div className="flex h-full">
      {/* Left Panel */}
      <div className="w-[40%] border-r border-border">
        <div className="border-b border-border px-4 py-3">
          <div className="flex gap-4">
            <Skeleton className="h-8 w-28" />
            <Skeleton className="h-8 w-20" />
          </div>
        </div>
        <div className="p-4 space-y-4">
          <Skeleton className="h-6 w-3/4" />
          <div className="flex gap-2">
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-5 w-14" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
          <div className="pt-4 space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-20 w-full" />
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex flex-col">
        <div className="flex items-center justify-between border-b border-border px-4 py-2">
          <Skeleton className="h-5 w-24" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-24" />
          </div>
        </div>
        <div className="flex-1 bg-[oklch(0.13_0.005_285)]">
          <div className="p-4 space-y-2">
            {Array.from({ length: 15 }).map((_, i) => (
              <Skeleton
                key={i}
                className="h-4"
                style={{ width: `${Math.random() * 40 + 30}%` }}
              />
            ))}
          </div>
        </div>
        <div className="border-t border-border bg-[oklch(0.11_0.005_285)]">
          <div className="flex items-center gap-2 border-b border-border px-4 py-2">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-16" />
          </div>
          <div className="h-32 p-4">
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
      </div>
    </div>
  );
}
