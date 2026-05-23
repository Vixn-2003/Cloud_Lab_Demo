import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';

export function LabBrowserSkeleton() {
  return (
    <div className="flex h-[calc(100vh-3.5rem)]">
      {/* Filter Sidebar */}
      <div className="w-64 shrink-0 border-r border-border bg-card/50 p-4">
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-4 w-16" />
        </div>

        <div className="space-y-3">
          <Skeleton className="h-4 w-12" />
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="flex items-center space-x-2">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-32" />
            </div>
          ))}
        </div>

        <Separator className="my-4" />

        <div className="space-y-3">
          <Skeleton className="h-4 w-14" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center space-x-2">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-28" />
            </div>
          ))}
        </div>

        <Separator className="my-4" />

        <div className="space-y-3">
          <Skeleton className="h-4 w-24" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center space-x-2">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="space-y-1">
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-4 w-24" />
          </div>
          <div className="flex items-center gap-3">
            <Skeleton className="h-9 w-64" />
            <Skeleton className="h-9 w-20" />
          </div>
        </div>

        {/* Labs Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-border bg-card p-5 space-y-4"
            >
              <div className="flex items-start justify-between">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <Skeleton className="h-5 w-14" />
              </div>
              <Skeleton className="h-5 w-full" />
              <div className="flex gap-1.5">
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-5 w-14" />
                <Skeleton className="h-5 w-12" />
              </div>
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-12" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
