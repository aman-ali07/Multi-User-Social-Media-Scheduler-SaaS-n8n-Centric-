import { useState, useEffect, useCallback } from 'react'
import { useAuth } from './use-auth'
import { getSettings, updateProfile, deleteAccount } from '@/lib/query'
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
    try {
      const data = await getSettings()
      setProfile(data.profile)
      setLoading(false)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load profile')
      setLoading(false)
    }
  }, [user])

  useEffect(() => { load() }, [load]) // eslint-disable-line react-hooks/set-state-in-effect

  const update = async (updates: Partial<Profile>) => {
    if (!user) return
    setSaving(true)
    setError(null)
    const prev = profile
    try {
      setProfile((p) => p ? { ...p, ...updates, updated_at: new Date().toISOString() } : { id: user.id, ...updates } as Profile)
      await updateProfile(updates)
    } catch (err: unknown) {
      setProfile(prev)
      setError(err instanceof Error ? err.message : 'Failed to update profile')
    }
    setSaving(false)
  }

  const removeAccount = async () => {
    if (!user) return
    setSaving(true)
    setError(null)
    try {
      await deleteAccount()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to delete account')
      setSaving(false)
      throw err
    }
  }

  return { profile, loading, saving, error, update, removeAccount }
}
