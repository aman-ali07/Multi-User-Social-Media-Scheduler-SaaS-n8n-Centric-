'use client'

import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'

export default function LogsError({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => { Sentry.captureException(error) }, [error])

  return (
    <div className="p-4 sm:p-6 space-y-4 max-w-4xl">
      <div className="rounded-md border border-error/20 bg-error/5 p-4">
        <p className="text-[10px] text-error font-mono uppercase tracking-wider">Error</p>
        <p className="text-body text-[13px] font-sans mt-1">{error.message}</p>
      </div>
      <button
        onClick={reset}
        className="px-4 py-2 rounded-md border border-hairline bg-canvas text-ink text-[12px] font-medium hover:bg-surface-soft transition-colors"
      >
        Try again
      </button>
    </div>
  )
}
