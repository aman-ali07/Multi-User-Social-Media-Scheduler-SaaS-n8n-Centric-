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
        <div className="min-h-screen bg-bg text-text flex items-center justify-center p-6">
          <div className="max-w-md text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-red/10 border border-red/20 flex items-center justify-center mx-auto">
              <span className="text-red text-lg">!</span>
            </div>
            <h1 className="font-serif text-[24px] text-text tracking-tight">Something went wrong</h1>
            <p className="text-text-muted text-sm font-sans">
              An unexpected error occurred. Try refreshing the page.
            </p>
            {this.state.error && (
              <div className="text-left space-y-2">
                <p className="text-red/70 text-[11px] font-mono bg-red/5 rounded-sm p-2 truncate">
                  {this.state.error.message}
                </p>
                <pre className="text-red/50 text-[9px] font-mono bg-red/5 rounded-sm p-2 overflow-auto max-h-32 text-left whitespace-pre-wrap">
                  {this.state.error.stack}
                </pre>
              </div>
            )}
            <button
              onClick={() => window.location.reload()}
              className="inline-block px-4 py-2 rounded-sm border border-gold/50 text-gold text-[12px] font-mono uppercase tracking-wider hover:bg-gold/5 transition-colors"
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