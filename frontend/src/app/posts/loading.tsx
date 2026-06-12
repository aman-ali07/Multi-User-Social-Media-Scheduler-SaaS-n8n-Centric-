export default function PostsLoading() {
  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-4xl">
      <div className="h-8 w-24 rounded-sm bg-surface-2 animate-pulse" />
      <div className="h-4 w-40 rounded-sm bg-surface-2 animate-pulse mt-2" />
      <div className="flex gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-8 w-20 rounded-sm bg-surface-2 animate-pulse" />
        ))}
      </div>
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-3 rounded-sm border border-border bg-surface animate-pulse">
            <div className="flex-1 space-y-1.5">
              <div className="h-3 w-48 rounded-sm bg-surface-2" />
              <div className="h-2.5 w-32 rounded-sm bg-surface-2" />
            </div>
            <div className="w-16 h-5 rounded-sm bg-surface-2" />
          </div>
        ))}
      </div>
    </div>
  )
}
