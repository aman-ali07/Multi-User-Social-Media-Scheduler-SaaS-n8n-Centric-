'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import type { ScheduledPost } from '@/types/database'
import { Clock, CheckCircle2, XCircle, AlertCircle, CircleDashed } from 'lucide-react'

interface PostRowProps {
  post: ScheduledPost
  onCancel?: (id: string) => void
}

function StatusIcon({ status }: { status: string }) {
  switch (status) {
    case 'published':
      return <CheckCircle2 className="w-4 h-4 text-success" />
    case 'failed':
      return <XCircle className="w-4 h-4 text-error" />
    case 'scheduled':
      return <Clock className="w-4 h-4 text-brand-accent" />
    case 'cancelled':
      return <AlertCircle className="w-4 h-4 text-muted" />
    default:
      return <CircleDashed className="w-4 h-4 text-muted" />
  }
}

export function PostRow({ post, onCancel }: PostRowProps) {
  return (
    <Link href={`/posts/${post.id}`} className="block">
      <motion.div 
        className="flex items-center gap-4 py-2 px-3 rounded-md hover:bg-black/5 transition-all group group-hover/list:opacity-50 hover:!opacity-100 bg-surface-card cursor-pointer"
      >
        <div className="shrink-0 flex items-center justify-center w-8 h-8 rounded-md bg-canvas border border-hairline shadow-sm">
          <StatusIcon status={post.status} />
        </div>
        
        <div className="flex-1 min-w-0">
          <p className="text-ink font-medium text-[14px] truncate">
            {post.title || post.caption || '(untitled)'}
          </p>
        </div>

        <div className="shrink-0 flex gap-1.5 w-24">
          {Array.isArray(post.platforms) && post.platforms.map((p) => (
            <span key={p} className="text-[10px] text-muted font-bold uppercase tracking-widest bg-surface-strong/50 rounded-sm px-1.5 py-0.5">
              {p === 'facebook' ? 'FB' : 'IG'}
            </span>
          ))}
        </div>

        <div className="shrink-0 w-32 text-right">
          {post.schedule_at ? (
            <span className="text-[12px] text-muted font-medium tabular-nums">
              {new Date(post.schedule_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}{' '}
              {new Date(post.schedule_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          ) : post.published_at ? (
            <span className="text-[12px] text-muted font-medium tabular-nums">
              {new Date(post.published_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
            </span>
          ) : (
            <span className="text-[12px] text-muted/50 font-medium tabular-nums">--</span>
          )}
        </div>

        <div className="shrink-0 w-16 text-right">
          {(post.status === 'draft' || post.status === 'scheduled') && onCancel ? (
            <button 
              onClick={(e) => { 
                e.stopPropagation(); 
                e.preventDefault(); 
                if (window.confirm('Are you sure you want to cancel this post?')) {
                  onCancel(post.id) 
                }
              }}
              className="text-[12px] text-muted hover:text-error font-medium opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all"
            >
              Cancel
            </button>
          ) : (
             <span className="w-full inline-block" />
          )}
        </div>
      </motion.div>
    </Link>
  )
}
