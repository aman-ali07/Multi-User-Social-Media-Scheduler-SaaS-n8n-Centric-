export default function MediaLoading() {
  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <div className="h-8 w-24 rounded-sm bg-surface-2 animate-pulse" />
          <div className="h-4 w-32 rounded-sm bg-surface-2 animate-pulse mt-2" />
        </div>
        <div className="h-10 w-28 rounded-sm bg-surface-2 animate-pulse" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="aspect-square rounded-sm border border-border bg-surface animate-pulse" />
        ))}
      </div>
    </div>
  )
}
