'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { ScheduledPost } from '@/types/database'

interface PostRowProps {
  post: ScheduledPost
  onCancel?: (id: string) => void
}

export function PostRow({ post, onCancel }: PostRowProps) {
  return (
    <div className="rounded-sm border border-border bg-surface p-4 flex items-center justify-between hover:bg-surface-2 transition-colors">
      <div className="flex-1 min-w-0">
        <p className="text-text font-sans text-[14px] truncate">
          {post.title || '(untitled)'}
        </p>
        <div className="flex items-center gap-3 mt-1">
          <div className="flex gap-1">
            {post.platforms.map((p) => (
              <span key={p} className="text-[9px] text-text-muted font-mono uppercase border border-border rounded-sm px-1">
                {p === 'facebook' ? 'FB' : 'IG'}
              </span>
            ))}
          </div>
          {post.schedule_at && (
            <span className="text-[10px] text-text-dim font-mono">
              {new Date(post.schedule_at).toLocaleDateString()}{' '}
              {new Date(post.schedule_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          {post.published_at && (
            <span className="text-[10px] text-lime font-mono">
              Published {new Date(post.published_at).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <Badge variant={post.status}>
          {post.status === 'failed' && post.retry_count > 0
            ? `${post.status} (${post.retry_count})`
            : post.status}
        </Badge>
        {(post.status === 'draft' || post.status === 'scheduled') && onCancel && (
          <Button variant="ghost" size="sm" onClick={() => onCancel(post.id)}>
            Cancel
          </Button>
        )}
      </div>
    </div>
  )
}
