import { supabase } from '@/lib/supabase'
import { useEffect, useState, useCallback } from 'react'
import type { User } from '@supabase/supabase-js'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    // getUser() validates the JWT against Supabase Auth server (not just localStorage)
    supabase.auth.getUser()
      .then(({ data: { user } }) => {
        if (!cancelled) { setUser(user); setLoading(false) }
      })
      .catch(() => { if (!cancelled) setLoading(false) })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!cancelled) setUser(session?.user ?? null)
    })

    return () => { cancelled = true; subscription.unsubscribe() }
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    setError(null)
    const result = await supabase.auth.signInWithPassword({ email, password })
    if (result.error) setError(result.error.message)
    return result
  }, [])

  const signUp = useCallback(async (email: string, password: string) => {
    setError(null)
    const result = await supabase.auth.signUp({ email, password })
    if (result.error) setError(result.error.message)
    return result
  }, [])

  const signOut = useCallback(async () => {
    const result = await supabase.auth.signOut()
    setUser(null)
    return result
  }, [])

  const resetPassword = useCallback(async (email: string) => {
    setError(null)
    const result = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })
    if (result.error) setError(result.error.message)
    return result
  }, [])

  const updatePassword = useCallback(async (password: string) => {
    setError(null)
    const result = await supabase.auth.updateUser({ password })
    if (result.error) setError(result.error.message)
    return result
  }, [])

  // Expose a null session for backward compat — components only need user
  const session = user ? { user } : null

  return { session, loading, user, signIn, signUp, signOut, resetPassword, updatePassword, error, setError }
}
