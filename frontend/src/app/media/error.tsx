'use client'

import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'

export default function MediaError({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => { Sentry.captureException(error) }, [error])

  return (
    <div className="p-4 sm:p-6 space-y-4 max-w-5xl">
      <div className="rounded-sm border border-red/20 bg-red/5 p-4">
        <p className="text-[10px] text-red font-mono uppercase tracking-wider">Error</p>
        <p className="text-text text-[13px] font-sans mt-1">{error.message}</p>
      </div>
      <button
        onClick={reset}
        className="px-4 py-2 rounded-sm border border-gold/50 text-gold text-[12px] font-mono uppercase tracking-wider hover:bg-gold/5 transition-colors"
      >
        Try again
      </button>
    </div>
  )
}
