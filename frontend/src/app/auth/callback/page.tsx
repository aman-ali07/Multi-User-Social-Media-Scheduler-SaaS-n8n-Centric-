'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function AuthCallbackPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handleCallback = async () => {
      const { error } = await supabase.auth.exchangeCodeForSession(
        window.location.href
      )
      if (error) {
        setError(error.message)
        return
      }
      router.push('/dashboard')
    }
    handleCallback()
  }, [router])

  if (error) {
    return (
      <div className="h-screen bg-bg flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-red text-sm font-mono">{error}</p>
          <a href="/auth/login" className="text-gold text-sm hover:underline">
            Back to login
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-bg flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="w-8 h-8 border border-gold/30 border-t-gold rounded-full animate-spin mx-auto" />
        <p className="text-text-dim text-sm font-mono">Completing authentication...</p>
      </div>
    </div>
  )
}
