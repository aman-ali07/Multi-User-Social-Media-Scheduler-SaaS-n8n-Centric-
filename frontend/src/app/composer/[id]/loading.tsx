export default function Loading() {
  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-2xl">
      <div className="h-8 w-48 rounded-sm bg-surface-2 animate-pulse" />
      <div className="space-y-4">
        <div className="h-10 rounded-sm bg-surface-2 animate-pulse" />
        <div className="h-32 rounded-sm bg-surface-2 animate-pulse" />
        <div className="h-10 rounded-sm bg-surface-2 animate-pulse" />
        <div className="h-10 rounded-sm bg-surface-2 animate-pulse" />
      </div>
    </div>
  )
}
