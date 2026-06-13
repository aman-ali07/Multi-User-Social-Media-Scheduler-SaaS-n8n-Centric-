export default function SettingsLoading() {
  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-3xl">
      <div className="h-8 w-32 rounded-md bg-surface-strong animate-pulse" />
      <div className="h-4 w-48 rounded-md bg-surface-strong animate-pulse mt-2" />
      <div className="space-y-4">
        <div className="rounded-md border border-hairline bg-surface-card p-4 animate-pulse">
          <div className="h-3 w-24 rounded-md bg-surface-strong" />
          <div className="h-8 w-full rounded-md bg-surface-strong mt-3" />
          <div className="h-px bg-surface-strong mt-3" />
        </div>
        <div className="rounded-md border border-hairline bg-surface-card p-4 animate-pulse">
          <div className="h-3 w-24 rounded-md bg-surface-strong" />
          <div className="h-8 w-full rounded-md bg-surface-strong mt-3" />
          <div className="h-px bg-surface-strong mt-3" />
        </div>
      </div>
    </div>
  )
}
