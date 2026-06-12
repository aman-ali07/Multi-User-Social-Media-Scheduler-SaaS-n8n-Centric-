'use client'

import { motion } from 'framer-motion'
import { Badge } from '@/components/ui/badge'

interface UpcomingPost {
  title: string
  platforms: string[]
  time: string
  status: 'draft' | 'scheduled' | 'published' | 'failed' | 'cancelled'
}

interface UpcomingListProps {
  posts: UpcomingPost[]
}

export function UpcomingList({ posts }: UpcomingListProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-[13px] text-text-muted font-mono uppercase tracking-wider">
        Upcoming Queue
      </h2>
      <div className="rounded-sm border border-border bg-surface divide-y divide-border">
        {posts.map((post, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + i * 0.06 }}
            className="p-3 flex items-center justify-between gap-3 hover:bg-surface-2 transition-colors"
          >
            <div className="flex-1 min-w-0">
              <p className="text-[13px] text-text font-sans truncate">{post.title}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] text-text-dim font-mono">{post.time}</span>
                <div className="flex gap-1">
                  {Array.isArray(post.platforms) && post.platforms.map((p) => (
                    <span
                      key={p}
                      className="text-[9px] text-text-muted font-mono uppercase border border-border rounded-sm px-1"
                    >
                      {p === 'facebook' ? 'FB' : 'IG'}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <Badge variant={post.status} />
          </motion.div>
        ))}
      </div>
    </div>
  )
}
