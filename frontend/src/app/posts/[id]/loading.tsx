export default function PostDetailLoading() {
  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <div className="w-6 h-4 rounded-md bg-surface-strong animate-pulse" />
        <div className="h-8 w-48 rounded-md bg-surface-strong animate-pulse" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-md border border-hairline bg-surface-card p-4 space-y-3 animate-pulse">
          <div className="h-3 w-20 rounded-md bg-surface-strong" />
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-4 w-full rounded-md bg-surface-strong" />
            ))}
          </div>
        </div>
        <div className="rounded-md border border-hairline bg-surface-card p-4 space-y-3 animate-pulse">
          <div className="h-3 w-16 rounded-md bg-surface-strong" />
          <div className="h-20 w-full rounded-md bg-surface-strong" />
        </div>
      </div>
      <div className="space-y-3">
        <div className="h-4 w-24 rounded-md bg-surface-strong animate-pulse" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-3 rounded-md border border-hairline bg-surface-card animate-pulse">
            <div className="w-2 h-2 rounded-full bg-surface-strong" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3 w-40 rounded-md bg-surface-strong" />
              <div className="h-2.5 w-24 rounded-md bg-surface-strong" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
