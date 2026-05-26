'use client'

import { motion } from 'framer-motion'
import { ConsoleShell } from '@/components/shell/console-shell'
import { AuthGuard } from '@/components/auth/auth-guard'
import { FilterBar } from '@/components/posts/filter-bar'
import { PostRow } from '@/components/posts/post-row'
import { usePosts } from '@/hooks/use-posts'
import { useState } from 'react'

const container = {
  hidden: { opacity: 0 },
  visible: { transition: { staggerChildren: 0.04 } },
}

const item = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
}

export default function PostsPage() {
  const [filter, setFilter] = useState<string>('all')
  const { posts, loading, error, cancelPost } = usePosts(filter as any)

  return (
    <AuthGuard>
      <ConsoleShell>
        <motion.div variants={container} initial="hidden" animate="visible" className="p-6 space-y-6 max-w-4xl">
          <motion.div variants={item}>
            <h1 className="font-serif text-[28px] text-text tracking-tight">Posts</h1>
            <p className="text-text-muted text-sm font-sans mt-1">Manage your content</p>
          </motion.div>

          <motion.div variants={item}>
            <FilterBar active={filter} onChange={setFilter} />
          </motion.div>

          {error && (
            <motion.p variants={item} className="text-red text-[12px] font-mono">
              {error}
            </motion.p>
          )}

          {loading ? (
            <motion.div variants={item} className="flex items-center gap-2 text-text-dim text-sm font-mono">
              <span className="w-3 h-3 border border-gold/30 border-t-gold rounded-full animate-spin" />
              Loading posts...
            </motion.div>
          ) : posts.length === 0 ? (
            <motion.div variants={item} className="rounded-sm border border-border bg-surface p-8 text-center">
              <p className="text-text-dim text-sm font-sans">No posts found.</p>
              <a href="/composer" className="text-gold text-xs font-mono mt-1 inline-block hover:underline">
                Create your first post →
              </a>
            </motion.div>
          ) : (
            <motion.div variants={item} className="space-y-2">
              {posts.map((post) => (
                <PostRow key={post.id} post={post} onCancel={cancelPost} />
              ))}
            </motion.div>
          )}
        </motion.div>
      </ConsoleShell>
    </AuthGuard>
  )
}
