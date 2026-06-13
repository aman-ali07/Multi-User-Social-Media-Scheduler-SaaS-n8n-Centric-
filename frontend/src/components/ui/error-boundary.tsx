'use client'

import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-canvas text-body flex items-center justify-center p-6">
          <div className="text-center space-y-6">
            <h1 className="font-sans text-[24px] text-ink tracking-tight">Something went wrong</h1>
            <p className="text-muted text-sm font-sans">
              An unexpected error occurred. Try refreshing the page.
            </p>
            {this.state.error && (
              <div className="text-left space-y-2">
                <p className="text-error/70 text-[11px] font-mono bg-error/5 rounded-sm p-2 truncate">
                  {this.state.error.message}
                </p>
                <pre className="text-error/50 text-[9px] font-mono bg-error/5 rounded-sm p-2 overflow-auto max-h-32 text-left whitespace-pre-wrap">
                  {this.state.error.stack}
                </pre>
              </div>
            )}
            <button
              onClick={() => window.location.reload()}
              className="inline-block px-4 py-2 rounded-md border border-hairline bg-canvas text-ink text-[12px] font-medium hover:bg-surface-soft transition-colors"
            >
              Refresh Page
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}