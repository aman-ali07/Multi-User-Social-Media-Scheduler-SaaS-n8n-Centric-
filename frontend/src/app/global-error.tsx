'use client'

import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <html>
      <body>
        <div className="min-h-screen flex items-center justify-center bg-canvas text-body">
          <div className="text-center space-y-4 max-w-md">
            <h1 className="text-4xl font-bold text-error">500</h1>
            <p className="text-lg text-muted">
              Something went wrong. Our team has been notified.
            </p>
            <button
              onClick={reset}
              className="px-4 py-2 bg-primary text-on-primary rounded-md hover:bg-primary-active"
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
