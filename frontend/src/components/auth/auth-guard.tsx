'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !session) {
      router.push('/')
    }
  }, [session, loading, router])

  if (loading) {
    return (
      <div className="h-screen bg-canvas flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border border-muted/30 border-t-ink rounded-full animate-spin mx-auto" />
          <p className="text-muted text-sm font-mono">Initializing console...</p>
        </div>
      </div>
    )
  }

  if (!session) return null

  return <>{children}</>
}
