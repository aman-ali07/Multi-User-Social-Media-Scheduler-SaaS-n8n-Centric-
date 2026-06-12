import { useState, useEffect } from 'react'
import { useAuth } from './use-auth'
import { getCalendar } from '@/lib/query'

interface CalendarPost {
  id: string
  title: string | null
  status: string
  platforms: string[]
  schedule_at: string | null
  published_at: string | null
}

export function useCalendar(year: number, month: number) {
  const { user } = useAuth()
  const [posts, setPosts] = useState<CalendarPost[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    setLoading(true) // eslint-disable-line react-hooks/set-state-in-effect

    const abort = new AbortController()
    getCalendar(year, month, { signal: abort.signal })
      .then((data) => {
        setPosts((data.posts || []) as CalendarPost[])
        setLoading(false)
      })
      .catch(() => setLoading(false))

    return () => abort.abort()
  }, [user, year, month])

  const postsByDate = posts.reduce<Record<string, CalendarPost[]>>((acc, post) => {
    const date = post.schedule_at ? post.schedule_at.split('T')[0] : 'unknown'
    if (!acc[date]) acc[date] = []
    acc[date].push(post)
    return acc
  }, {})

  return { posts, postsByDate, loading }
}
