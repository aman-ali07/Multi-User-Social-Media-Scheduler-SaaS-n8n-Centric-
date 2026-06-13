'use client'

import { Suspense } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ConsoleShell } from '@/components/shell/console-shell'
import { AuthGuard } from '@/components/auth/auth-guard'
import { FilterBar } from '@/components/posts/filter-bar'
import { PostRow } from '@/components/posts/post-row'
import { usePosts } from '@/hooks/use-posts'
import { SkeletonList } from '@/components/ui/skeleton'
import { useState, useCallback } from 'react'
import type { PostStatus } from '@/types/database'
import { useToast } from '@/components/ui/toast'

const container = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.04 } },
}

const item = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
}

function PostsContent() {
  const searchParams = useSearchParams()
  const dateFilter = searchParams.get('date') || undefined
  const [filter, setFilter] = useState<PostStatus | 'all'>('all')
  const { posts, total, page, totalPages, loading, error, cancelPost, goToPage } = usePosts(filter, dateFilter)
  const { addToast } = useToast()

  const handleCancel = useCallback(async (id: string) => {
    try {
      await cancelPost(id)
      addToast('Post cancelled', 'success')
    } catch {
      addToast('Failed to cancel post', 'error')
    }
  }, [cancelPost, addToast])

  return (
    <AuthGuard>
      <ConsoleShell>
        <motion.div variants={container} initial="hidden" animate="visible" className="p-8 max-w-7xl mx-auto h-full flex flex-col">
          <motion.div variants={item} className="flex items-center justify-between mb-8 border-b border-hairline pb-6">
            <div>
              <h1 className="font-cal text-[32px] text-ink leading-none mb-4 tracking-tighter">Posts</h1>
              <div className="flex items-center gap-4">
                <FilterBar active={filter} onChange={(tab) => setFilter(tab as PostStatus | 'all')} />
                {dateFilter && (
                  <div className="flex items-center gap-2 text-[12px] text-muted font-medium bg-surface-card px-3 py-1.5 rounded-md border border-hairline">
                    <span>Date: <span className="text-ink font-semibold">{dateFilter}</span></span>
                    <Link href="/posts" className="text-muted hover:text-ink hover:underline transition-colors ml-1">Clear</Link>
                  </div>
                )}
              </div>
            </div>
            <div>
              <Link href="/composer">
                <Button variant="primary" className="h-9 px-4 text-[13px] font-semibold">
                  New Post
                </Button>
              </Link>
            </div>
          </motion.div>

          {error && (
            <motion.p variants={item} className="text-error text-[13px] font-medium">
              {error}
            </motion.p>
          )}

          {loading ? (
            <motion.div variants={item}>
              <SkeletonList rows={5} />
            </motion.div>
          ) : posts.length === 0 ? (
            <motion.div variants={item} className="rounded-xl border border-dashed border-hairline bg-surface-card/50 p-24 text-center flex flex-col items-center justify-center">
              <motion.div 
                animate={{ scale: [1, 1.05, 1], rotate: [-2, 2, -2] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                className="w-16 h-16 rounded-2xl bg-gradient-to-br from-surface-soft to-canvas border border-hairline shadow-[0_4px_12px_rgba(0,0,0,0.05)] flex items-center justify-center mb-6"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>
              </motion.div>
              <h3 className="font-cal text-[20px] text-ink mb-2">No posts yet</h3>
              <p className="text-muted text-[14px] font-medium mb-6 max-w-sm">You haven&apos;t created any posts. Start scheduling your content to see it appear here.</p>
              <Link href="/composer">
                <Button variant="primary" className="h-10 px-6">
                  Create First Post
                </Button>
              </Link>
            </motion.div>
          ) : (
            <motion.div variants={item} className="space-y-3 group/list">
              {posts.map((post) => (
                <PostRow key={post.id} post={post} onCancel={handleCancel} />
              ))}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-6 text-[13px] text-muted font-medium">
                  <span>{total} post{total !== 1 ? 's' : ''}</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => goToPage(page - 1)}
                      disabled={page === 0}
                      className="px-3 py-1.5 rounded-md border border-hairline hover:border-muted hover:bg-surface-soft disabled:opacity-50 disabled:hover:bg-transparent transition-colors"
                    >
                      ← Prev
                    </button>
                    <span className="px-2">
                      Page {page + 1} of {totalPages}
                    </span>
                    <button
                      onClick={() => goToPage(page + 1)}
                      disabled={page >= totalPages - 1}
                      className="px-3 py-1.5 rounded-md border border-hairline hover:border-muted hover:bg-surface-soft disabled:opacity-50 disabled:hover:bg-transparent transition-colors"
                    >
                      Next →
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </motion.div>
      </ConsoleShell>
    </AuthGuard>
  )
}

export default function PostsPage() {
  return (
    <Suspense fallback={
      <div className="h-screen bg-canvas flex items-center justify-center">
        <div className="w-8 h-8 border border-muted/30 border-t-ink rounded-full animate-spin" />
      </div>
    }>
      <PostsContent />
    </Suspense>
  )
}
