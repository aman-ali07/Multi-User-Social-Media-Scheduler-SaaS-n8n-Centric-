'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function AuthCallbackPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // @supabase/ssr handles code exchange automatically on createBrowserClient.
    // Wait for the session to settle, then redirect.
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        setError(error.message)
        return
      }
      if (session) {
        router.push('/dashboard')
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        router.push('/dashboard')
      }
    })

    return () => subscription.unsubscribe()
  }, [router])

  if (error) {
    return (
      <div className="h-screen bg-canvas flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-error text-sm font-mono">{error}</p>
          <a href="/auth/login" className="text-ink text-sm hover:underline">
            Back to login
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-canvas flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="w-8 h-8 border border-muted/30 border-t-ink rounded-full animate-spin mx-auto" />
        <p className="text-muted text-sm font-mono">Completing authentication...</p>
      </div>
    </div>
  )
}
