export default function DashboardLoading() {
  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-6xl">
      <div className="h-8 w-48 rounded-sm bg-surface-2 animate-pulse" />
      <div className="h-4 w-64 rounded-sm bg-surface-2 animate-pulse mt-2" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-sm border border-border bg-surface p-4 animate-pulse">
            <div className="h-3 w-24 rounded-sm bg-surface-2" />
            <div className="h-8 w-16 rounded-sm bg-surface-2 mt-3" />
            <div className="h-px bg-surface-2 mt-3" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-sm border border-border bg-surface p-4 animate-pulse">
          <div className="h-3 w-32 rounded-sm bg-surface-2" />
          <div className="h-32 rounded-sm bg-surface-2 mt-3" />
        </div>
        <div className="rounded-sm border border-border bg-surface p-4 animate-pulse">
          <div className="h-3 w-24 rounded-sm bg-surface-2" />
          <div className="space-y-2 mt-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-10 rounded-sm bg-surface-2" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
