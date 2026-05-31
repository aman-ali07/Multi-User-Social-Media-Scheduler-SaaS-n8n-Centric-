import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from './use-auth'
import type { Profile } from '@/types/database'

export function useSettings() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)
    setError(null)
    const { data, error: err } = await supabase
      .from('profiles')
      .select('id, display_name, timezone, created_at, updated_at')
      .eq('id', user.id)
      .maybeSingle()
    if (err) setError(err.message)
    else setProfile(data)
    setLoading(false)
  }, [user])

  useEffect(() => { load() }, [load])

  const update = async (updates: Partial<Profile>) => {
    if (!user) return
    setSaving(true)
    setError(null)
    const { error: err } = await supabase
      .from('profiles')
      .upsert({ id: user.id, ...updates, updated_at: new Date().toISOString() })
    if (err) setError(err.message)
    else setProfile((prev) => prev ? { ...prev, ...updates, updated_at: new Date().toISOString() } : { id: user.id, ...updates } as Profile)
    setSaving(false)
  }

  return { profile, loading, saving, error, update }
}
