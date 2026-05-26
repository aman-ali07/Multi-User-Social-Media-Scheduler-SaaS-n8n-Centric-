import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from './use-auth'
import { cancelPost as cancelPostApi } from '@/lib/n8n'
import type { ScheduledPost, PostStatus } from '@/types/database'

export function usePosts(filter: PostStatus | 'all' = 'all') {
  const { user } = useAuth()
  const [posts, setPosts] = useState<ScheduledPost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    if (!user) return
    setLoading(true)
    setError(null)
    let query = supabase
      .from('scheduled_posts')
      .select('*')
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    if (filter !== 'all') query = query.eq('status', filter)

    const { data, error: err } = await query
    if (err) setError(err.message)
    else setPosts(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [user, filter])

  const cancelPost = async (postId: string) => {
    if (!user) return
    await cancelPostApi(postId, user.id)
    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, status: 'cancelled' as const } : p)),
    )
  }

  return { posts, loading, error, reload: load, cancelPost }
}
