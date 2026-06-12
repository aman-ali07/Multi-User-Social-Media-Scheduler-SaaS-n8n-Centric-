import { supabase } from '@/lib/supabase'
import { useEffect, useState, useCallback } from 'react'
import type { User } from '@supabase/supabase-js'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

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

  const signIn = useCallback((email: string, password: string) =>
    supabase.auth.signInWithPassword({ email, password }), [])

  const signUp = useCallback((email: string, password: string) =>
    supabase.auth.signUp({ email, password }), [])

  const signOut = useCallback(() => supabase.auth.signOut(), [])

  // Expose a null session for backward compat — components only need user
  const session = user ? { user } : null

  return { session, loading, user, signIn, signUp, signOut }
}
