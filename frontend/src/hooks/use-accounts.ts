import { useState, useEffect, useCallback } from 'react'
import { useAuth } from './use-auth'
import { getAccounts } from '@/lib/query'
import type { SocialAccount } from '@/types/database'

export function useAccounts() {
  const { user } = useAuth()
  const [accounts, setAccounts] = useState<SocialAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!user) return
    try {
      const data = await getAccounts()
      setAccounts(Array.isArray(data.accounts) ? data.accounts : [])
      setLoading(false)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load accounts')
      setLoading(false)
    }
  }, [user])

  useEffect(() => { load() }, [load]) // eslint-disable-line react-hooks/set-state-in-effect

  const connect = async (platform: 'facebook') => {
    if (!user) return
    window.location.href = `/api/auth/meta/connect?platform=${platform}`
  }

  const disconnect = async (id: string) => {
    if (!user) return
    try {
      const res = await fetch('/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'delete-account', id }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }))
        throw new Error(err.error || `Failed to disconnect (${res.status})`)
      }
      await load()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to disconnect account')
      throw err
    }
  }

  return { accounts, loading, error, reload: load, connect, disconnect }
}
