export function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 p-3 rounded-md border border-hairline bg-surface-card animate-pulse">
      <div className="w-4 h-4 rounded bg-surface-strong" />
      <div className="flex-1 space-y-1.5">
        <div className="h-3 w-48 rounded bg-surface-strong" />
        <div className="h-2.5 w-32 rounded bg-surface-strong" />
      </div>
      <div className="w-16 h-5 rounded bg-surface-strong" />
    </div>
  )
}

export function SkeletonCard() {
  return (
    <div className="rounded-md border border-hairline bg-surface-card p-4 space-y-3 animate-pulse">
      <div className="h-3 w-24 rounded bg-surface-strong" />
      <div className="h-8 w-16 rounded bg-surface-strong" />
      <div className="h-px bg-surface-strong" />
    </div>
  )
}

export function SkeletonGrid({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="aspect-square rounded-md border border-hairline bg-surface-card animate-pulse">
          <div className="w-full h-full bg-surface-strong" />
        </div>
      ))}
    </div>
  )
}

export function SkeletonList({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonRow key={i} />
      ))}
    </div>
  )
}
