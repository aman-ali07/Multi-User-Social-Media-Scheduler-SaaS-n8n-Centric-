export default function AccountsLoading() {
  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-3xl">
      <div className="h-8 w-32 rounded-sm bg-surface-2 animate-pulse" />
      <div className="h-4 w-48 rounded-sm bg-surface-2 animate-pulse mt-2" />
      <div className="grid grid-cols-1 gap-3">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="rounded-sm border border-border bg-surface p-4 space-y-3 animate-pulse">
            <div className="h-4 w-40 rounded-sm bg-surface-2" />
            <div className="h-3 w-24 rounded-sm bg-surface-2" />
            <div className="h-px bg-surface-2" />
          </div>
        ))}
      </div>
    </div>
  )
}
