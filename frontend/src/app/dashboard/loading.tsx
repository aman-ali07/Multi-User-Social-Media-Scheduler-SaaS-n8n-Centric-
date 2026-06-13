export default function DashboardLoading() {
  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-6xl">
      <div className="h-8 w-48 rounded-md bg-surface-strong animate-pulse" />
      <div className="h-4 w-64 rounded-md bg-surface-strong animate-pulse mt-2" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-md border border-hairline bg-surface-card p-4 animate-pulse">
            <div className="h-3 w-24 rounded-md bg-surface-strong" />
            <div className="h-8 w-16 rounded-md bg-surface-strong mt-3" />
            <div className="h-px bg-surface-strong mt-3" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-md border border-hairline bg-surface-card p-4 animate-pulse">
          <div className="h-3 w-32 rounded-md bg-surface-strong" />
          <div className="h-32 rounded-md bg-surface-strong mt-3" />
        </div>
        <div className="rounded-md border border-hairline bg-surface-card p-4 animate-pulse">
          <div className="h-3 w-24 rounded-md bg-surface-strong" />
          <div className="space-y-2 mt-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-10 rounded-md bg-surface-strong" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
