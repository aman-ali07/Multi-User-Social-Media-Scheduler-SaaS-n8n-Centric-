export default function CallbackLoading() {
  return (
    <div className="h-screen bg-canvas flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="w-8 h-8 border border-muted/30 border-t-ink rounded-full animate-spin mx-auto" />
        <p className="text-muted text-sm font-mono">Completing authentication...</p>
      </div>
    </div>
  )
}
