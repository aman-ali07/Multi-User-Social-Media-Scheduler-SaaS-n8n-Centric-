export default function Loading() {
  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-2xl">
      <div className="h-8 w-48 rounded-md bg-surface-strong animate-pulse" />
      <div className="space-y-4">
        <div className="h-6 w-32 rounded-md bg-surface-strong animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-24 rounded-md bg-surface-strong animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  )
}
