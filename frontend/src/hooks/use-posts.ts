import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from './use-auth'
import { cancelPost as cancelPostApi } from '@/lib/n8n'
import type { ScheduledPost, PostStatus } from '@/types/database'

const PAGE_SIZE = 20

export function usePosts(filter: PostStatus | 'all' = 'all', dateFilter?: string) {
  const { user } = useAuth()
  const [posts, setPosts] = useState<ScheduledPost[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async (pageNum = 0) => {
    if (!user) return
    setLoading(true)
    setError(null)

    const from = pageNum * PAGE_SIZE
    const to = from + PAGE_SIZE - 1

    let query = supabase
      .from('scheduled_posts')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .range(from, to)

    if (filter !== 'all') query = query.eq('status', filter)
    if (dateFilter) {
      const dateFrom = `${dateFilter}T00:00:00.000Z`
      const dateTo = `${dateFilter}T23:59:59.999Z`
      query = query.gte('schedule_at', dateFrom).lte('schedule_at', dateTo)
    }

    const { data, error: err, count } = await query
    if (err) setError(err.message)
    else {
      setPosts(data || [])
      setTotal(count ?? 0)
      setPage(pageNum)
    }
    setLoading(false)
  }, [user, filter, dateFilter])

  useEffect(() => { load() }, [load])

  const cancelPost = async (postId: string) => {
    if (!user) return
    await cancelPostApi(postId, user.id)
    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, status: 'cancelled' as const } : p)),
    )
  }

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return { posts, total, page, totalPages, loading, error, reload: load, cancelPost, goToPage: load }
}
