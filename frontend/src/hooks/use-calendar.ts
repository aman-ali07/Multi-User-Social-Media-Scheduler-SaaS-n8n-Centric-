import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from './use-auth'

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
    setLoading(true)

    const from = new Date(year, month, 1).toISOString()
    const to = new Date(year, month + 1, 0, 23, 59, 59).toISOString()

    supabase
      .from('scheduled_posts')
      .select('id, title, status, platforms, schedule_at, published_at')
      .eq('user_id', user.id)
      .in('status', ['scheduled', 'published'])
      .gte('schedule_at', from)
      .lte('schedule_at', to)
      .then(({ data }) => {
        setPosts(data || [])
        setLoading(false)
      })
  }, [user, year, month])

  const postsByDate = posts.reduce<Record<string, CalendarPost[]>>((acc, post) => {
    const date = post.schedule_at ? post.schedule_at.split('T')[0] : 'unknown'
    if (!acc[date]) acc[date] = []
    acc[date].push(post)
    return acc
  }, {})

  return { posts, postsByDate, loading }
}
