import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from './use-auth'
import { connectOAuth as connectOAuthApi } from '@/lib/n8n'
import type { SocialAccount } from '@/types/database'

export function useAccounts() {
  const { user } = useAuth()
  const [accounts, setAccounts] = useState<SocialAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const { data, error: err } = await supabase
      .from('social_accounts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    if (err) setError(err.message)
    else setAccounts(data || [])
    setLoading(false)
  }, [user])

  useEffect(() => { load() }, [load])

  const connect = async (platform: 'facebook') => {
    if (!user) return
    const res = await connectOAuthApi(user.id, platform)
    if (res.url) window.location.href = res.url
  }

  return { accounts, loading, error, reload: load, connect }
}
