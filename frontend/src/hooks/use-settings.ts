import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from './use-auth'
import type { Profile } from '@/types/database'

export function useSettings() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    if (!user) return
    setLoading(true)
    const { data, error: err } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    if (err) setError(err.message)
    else setProfile(data)
    setLoading(false)
  }

  useEffect(() => { load() }, [user])

  const update = async (updates: Partial<Profile>) => {
    if (!user) return
    setSaving(true)
    setError(null)
    const { error: err } = await supabase
      .from('profiles')
      .upsert({ id: user.id, ...updates, updated_at: new Date().toISOString() })
    if (err) setError(err.message)
    else setProfile((prev) => prev ? { ...prev, ...updates, updated_at: new Date().toISOString() } : prev)
    setSaving(false)
  }

  return { profile, loading, saving, error, update }
}
