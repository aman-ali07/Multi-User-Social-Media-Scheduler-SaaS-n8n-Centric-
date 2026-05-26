'use client'

import { Badge } from '@/components/ui/badge'
import type { ScheduledPost } from '@/types/database'

interface PostCardProps {
  post: ScheduledPost
}

export function PostCard({ post }: PostCardProps) {
  return (
    <div className="rounded-sm border border-border bg-surface p-3 hover:bg-surface-2 transition-colors">
      <p className="text-[12px] text-text font-sans truncate">
        {post.title || '(untitled)'}
      </p>
      <div className="flex items-center justify-between mt-2">
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            {post.platforms.map((p) => (
              <span key={p} className="text-[8px] text-text-muted font-mono uppercase border border-border rounded-sm px-1">
                {p === 'facebook' ? 'FB' : 'IG'}
              </span>
            ))}
          </div>
          {post.schedule_at && (
            <span className="text-[9px] text-text-dim font-mono">
              {new Date(post.schedule_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>
        <Badge variant={post.status} />
      </div>
    </div>
  )
}
