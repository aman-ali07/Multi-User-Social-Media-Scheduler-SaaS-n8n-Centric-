import { useState, useEffect } from 'react'
import { useAuth } from './use-auth'
import { getCalendar } from '@/lib/query'
import type { ScheduledPost } from '@/types/database'

export function useCalendar(year: number, month: number) {
  const { user } = useAuth()
  const [posts, setPosts] = useState<ScheduledPost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    setLoading(true) // eslint-disable-line react-hooks/set-state-in-effect
    setError(null)

    const abort = new AbortController()
    getCalendar(year, month, { signal: abort.signal })
      .then((data) => {
        setPosts(Array.isArray(data.posts) ? data.posts : [])
        setLoading(false)
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Failed to load calendar')
        setLoading(false)
      })

    return () => abort.abort()
  }, [user, year, month])

  const postsByDate = posts.reduce<Record<string, ScheduledPost[]>>((acc, post) => {
    const date = post.schedule_at ? post.schedule_at.split('T')[0] : 'unknown'
    if (!acc[date]) acc[date] = []
    acc[date].push(post)
    return acc
  }, {})

  return { posts, postsByDate, loading, error }
}
