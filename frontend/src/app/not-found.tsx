import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-bg text-text flex items-center justify-center p-6">
      <div className="max-w-md text-center space-y-4">
        <h1 className="font-serif text-[64px] text-text tracking-tight leading-none">404</h1>
        <p className="text-text-muted text-sm font-sans">
          This page does not exist.
        </p>
        <Link
          href="/dashboard"
          className="inline-block px-4 py-2 rounded-sm border border-gold/50 text-gold text-[12px] font-mono uppercase tracking-wider hover:bg-gold/5 transition-colors"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  )
}