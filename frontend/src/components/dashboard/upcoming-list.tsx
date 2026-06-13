'use client'

import { motion } from 'framer-motion'
import { Badge } from '@/components/ui/badge'

import Link from 'next/link'

interface UpcomingPost {
  id: string
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
    <div className="space-y-4 h-full flex flex-col">
      <h2 className="text-[13px] text-ink font-medium tracking-wide shrink-0">
        Upcoming Queue
      </h2>
      <div className="rounded-lg bg-surface-card group/list flex-1">
        {posts.length === 0 ? (
          <div className="h-full flex items-center justify-center p-6">
            <p className="text-muted text-[14px] font-medium">No upcoming posts</p>
          </div>
        ) : (
          posts.map((post, i) => (
            <Link key={post.id} href={`/calendar?post=${post.id}`}>
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.06 }}
                className="p-3 flex items-center justify-between gap-3 hover:bg-black/5 transition-all group-hover/list:opacity-50 hover:!opacity-100"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] text-ink font-medium truncate">{post.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[12px] text-muted font-medium tabular-nums">{post.time}</span>
                    <div className="flex gap-1.5">
                      {Array.isArray(post.platforms) && post.platforms.map((p) => (
                        <span
                          key={p}
                          className="text-[10px] text-muted font-bold tracking-widest uppercase bg-surface-strong/50 rounded-sm px-1.5 py-0.5"
                        >
                          {p === 'facebook' ? 'FB' : 'IG'}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <Badge variant={post.status} />
              </motion.div>
            </Link>
          ))
        )}
      </div>
    </div>
  )
}
