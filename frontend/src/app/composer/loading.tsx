export default function ComposerLoading() {
  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-2xl">
      <div className="h-8 w-32 rounded-sm bg-surface-2 animate-pulse" />
      <div className="h-4 w-48 rounded-sm bg-surface-2 animate-pulse mt-2" />
      <div className="space-y-4">
        <div className="h-10 rounded-sm bg-surface-2 animate-pulse" />
        <div className="h-32 rounded-sm bg-surface-2 animate-pulse" />
        <div className="h-10 rounded-sm bg-surface-2 animate-pulse" />
        <div className="h-10 rounded-sm bg-surface-2 animate-pulse" />
        <div className="h-24 rounded-sm bg-surface-2 animate-pulse" />
      </div>
    </div>
  )
}
