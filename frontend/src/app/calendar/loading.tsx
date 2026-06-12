export default function CalendarLoading() {
  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-6xl">
      <div className="h-8 w-32 rounded-sm bg-surface-2 animate-pulse" />
      <div className="h-4 w-48 rounded-sm bg-surface-2 animate-pulse mt-2" />
      <div className="rounded-sm border border-border bg-surface p-4 animate-pulse">
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="h-3 w-8 rounded-sm bg-surface-2 mx-auto" />
          ))}
        </div>
        <div className="grid grid-cols-7 gap-2 mt-4">
          {Array.from({ length: 35 }).map((_, i) => (
            <div key={i} className="aspect-square rounded-sm bg-surface-2" />
          ))}
        </div>
      </div>
    </div>
  )
}
