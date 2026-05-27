'use client'

import { Suspense } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { ConsoleShell } from '@/components/shell/console-shell'
import { AuthGuard } from '@/components/auth/auth-guard'
import { FilterBar } from '@/components/posts/filter-bar'
import { PostRow } from '@/components/posts/post-row'
import { usePosts } from '@/hooks/use-posts'
import { SkeletonList } from '@/components/ui/skeleton'
import { useState } from 'react'
import type { PostStatus } from '@/types/database'

const container = {
  hidden: { opacity: 0 },
  visible: { transition: { staggerChildren: 0.04 } },
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

  return (
    <AuthGuard>
      <ConsoleShell>
        <motion.div variants={container} initial="hidden" animate="visible" className="p-6 space-y-6 max-w-4xl">
          <motion.div variants={item}>
            <h1 className="font-serif text-[28px] text-text tracking-tight">Posts</h1>
            <p className="text-text-muted text-sm font-sans mt-1">Manage your content</p>
          </motion.div>

          <motion.div variants={item} className="space-y-2">
            <FilterBar active={filter} onChange={(tab) => setFilter(tab as PostStatus | 'all')} />
            {dateFilter && (
              <div className="flex items-center gap-2 text-[11px] text-text-dim font-mono">
                <span>Showing posts for <span className="text-gold">{dateFilter}</span></span>
                <Link href="/posts" className="text-gold hover:underline">(clear)</Link>
              </div>
            )}
          </motion.div>

          {error && (
            <motion.p variants={item} className="text-red text-[12px] font-mono">
              {error}
            </motion.p>
          )}

          {loading ? (
            <motion.div variants={item}>
              <SkeletonList rows={5} />
            </motion.div>
          ) : posts.length === 0 ? (
            <motion.div variants={item} className="rounded-sm border border-border bg-surface p-8 text-center">
              <p className="text-text-dim text-sm font-sans">No posts found.</p>
              <Link href="/composer" className="text-gold text-xs font-mono mt-1 inline-block hover:underline">
                Create your first post →
              </Link>
            </motion.div>
          ) : (
            <motion.div variants={item} className="space-y-2">
              {posts.map((post) => (
                <PostRow key={post.id} post={post} onCancel={cancelPost} />
              ))}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4 text-[11px] text-text-dim font-mono">
                  <span>{total} post{total !== 1 ? 's' : ''}</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => goToPage(page - 1)}
                      disabled={page === 0}
                      className="px-2 py-1 rounded-sm border border-border hover:border-gold/30 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      ← Prev
                    </button>
                    <span>
                      Page {page + 1} of {totalPages}
                    </span>
                    <button
                      onClick={() => goToPage(page + 1)}
                      disabled={page >= totalPages - 1}
                      className="px-2 py-1 rounded-sm border border-border hover:border-gold/30 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
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
      <div className="h-screen bg-bg flex items-center justify-center">
        <div className="w-8 h-8 border border-gold/30 border-t-gold rounded-full animate-spin" />
      </div>
    }>
      <PostsContent />
    </Suspense>
  )
}
