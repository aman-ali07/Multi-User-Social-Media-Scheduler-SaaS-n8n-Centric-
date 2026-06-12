import { useState, useEffect, useCallback } from 'react'
import { useAuth } from './use-auth'
import { getDashboard } from '@/lib/query'
import type { DashboardResult } from '@/lib/query'

export function useDashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState<DashboardResult['stats'] | null>(null)
  const [upcoming, setUpcoming] = useState<DashboardResult['upcoming']>([])
  const [velocity, setVelocity] = useState<DashboardResult['velocity']>([])
  const [activity, setActivity] = useState<DashboardResult['activity']>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async (signal: AbortSignal) => {
    if (!user) return
    try {
      const data = await getDashboard({ signal })
      if (signal.aborted) return
      setStats(data.stats)
      setUpcoming(data.upcoming)
      setVelocity(data.velocity)
      setActivity(data.activity)
      setLoading(false)
    } catch (err: unknown) {
      if (signal.aborted) return
      setError(err instanceof Error ? err.message : 'Failed to load dashboard')
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    const abort = new AbortController()
    load(abort.signal) // eslint-disable-line react-hooks/set-state-in-effect
    return () => abort.abort()
  }, [load])

  const retry = useCallback(() => {
    setLoading(true)
    setError(null)
    const abort = new AbortController()
    load(abort.signal)
  }, [load])

  return { stats, upcoming, velocity, activity, loading, error, retry }
}
