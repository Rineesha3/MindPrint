export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`skeleton rounded-lg ${className}`} />;
}

export function HistorySkeleton() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <Skeleton className="mb-2 h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-9 w-28 rounded-xl" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="card flex items-center gap-4 rounded-2xl p-4">
            <Skeleton className="h-12 w-12 shrink-0 rounded-xl" />
            <div className="flex-1">
              <Skeleton className="mb-2 h-4 w-40" />
              <Skeleton className="h-3 w-28" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ResultSkeleton() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <div className="card mx-auto mb-6 max-w-sm rounded-3xl p-8 text-center">
        <Skeleton className="mx-auto mb-4 h-40 w-40 rounded-2xl" />
        <Skeleton className="mx-auto mb-2 h-4 w-24" />
        <Skeleton className="mx-auto h-12 w-32" />
      </div>
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="card rounded-2xl p-6">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="mb-5 h-8 w-full" />
          ))}
        </div>
        <div className="card flex items-center justify-center rounded-2xl p-6">
          <Skeleton className="h-48 w-48 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export function AssessmentSkeleton() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <Skeleton className="mb-8 h-2 w-full" />
      <Skeleton className="mb-6 h-6 w-3/4" />
      <div className="space-y-3">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-14 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="mx-auto max-w-lg px-4 py-12 sm:px-6">
      <div className="mb-8 text-center">
        <Skeleton className="mx-auto mb-3 h-16 w-16 rounded-full" />
        <Skeleton className="mx-auto mb-2 h-6 w-32" />
        <Skeleton className="mx-auto h-4 w-48" />
      </div>
      {Array.from({ length: 2 }, (_, i) => (
        <div key={i} className="card mb-6 rounded-2xl p-6">
          <Skeleton className="mb-4 h-5 w-32" />
          <Skeleton className="mb-3 h-11 w-full" />
          <Skeleton className="h-11 w-full" />
        </div>
      ))}
    </div>
  );
}
