export default function LogsLoading() {
  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-4xl">
      <div className="h-8 w-40 rounded-md bg-surface-strong animate-pulse" />
      <div className="h-4 w-48 rounded-md bg-surface-strong animate-pulse mt-2" />
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-3 rounded-md border border-hairline bg-surface-card animate-pulse">
            <div className="w-2 h-2 rounded-full bg-surface-strong" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3 w-48 rounded-md bg-surface-strong" />
              <div className="h-2.5 w-32 rounded-md bg-surface-strong" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
