import { useState, useEffect, useCallback } from 'react'
import { useAuth } from './use-auth'
import { cancelPost as cancelPostApi } from '@/lib/n8n'
import { getPosts } from '@/lib/query'
import type { ScheduledPost, PostStatus } from '@/types/database'

const PAGE_SIZE = 20

export function usePosts(filter: PostStatus | 'all' = 'all', dateFilter?: string) {
  const { user } = useAuth()
  const [posts, setPosts] = useState<ScheduledPost[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async (pageNum = 0, signal?: AbortSignal) => {
    if (!user) return
    setLoading(true)
    setError(null)
    try {
      const data = await getPosts(filter, pageNum, dateFilter, { signal })
      setPosts(Array.isArray(data.posts) ? (data.posts as ScheduledPost[]) : [])
      setTotal(data.total)
      setPage(data.page)
      setLoading(false)
    } catch (err: unknown) {
      if ((err as Error)?.name === 'AbortError') return
      setError(err instanceof Error ? err.message : 'Failed to load posts')
      setLoading(false)
    }
  }, [user, filter, dateFilter])

  useEffect(() => {
    const abort = new AbortController()
    load(0, abort.signal) // eslint-disable-line react-hooks/set-state-in-effect
    return () => abort.abort()
  }, [load])

  const cancelPost = async (postId: string) => {
    if (!user) return
    const prevPosts = [...posts]
    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, status: 'cancelled' as const } : p)),
    )
    try {
      await cancelPostApi(postId)
    } catch (err) {
      setPosts(prevPosts)
      throw err
    }
  }

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return { posts, total, page, totalPages, loading, error, reload: load, cancelPost, goToPage: load }
}
