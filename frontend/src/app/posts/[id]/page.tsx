'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { ConsoleShell } from '@/components/shell/console-shell'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AuthGuard } from '@/components/auth/auth-guard'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/use-auth'
import { cancelPost } from '@/lib/n8n'
import type { ScheduledPost, PostLog } from '@/types/database'

const container = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
}

const item = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
}

export default function PostDetailPage() {
  const { user } = useAuth()
  const params = useParams()
  const router = useRouter()
  const [post, setPost] = useState<ScheduledPost | null>(null)
  const [logs, setLogs] = useState<PostLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    if (!user || !params.id) return
    setLoading(true)
    const { data: postData, error: postError } = await supabase
      .from('scheduled_posts')
      .select('id, user_id, account_id, title, caption, platforms, schedule_at, published_at, published_meta_id, container_id, timezone, status, retry_count, max_retries, error_message, created_at, updated_at, deleted_at')
      .eq('id', params.id as string)
      .eq('user_id', user.id)
      .single()

    if (postError) { setError(postError.message); setLoading(false); return }
    setPost(postData)

    const { data: logData } = await supabase
      .from('post_logs')
      .select('id, post_id, workflow_name, status, error_message, response_payload, attempt_number, user_id, created_at')
      .eq('post_id', params.id as string)
      .order('created_at', { ascending: false })

    setLogs(logData || [])
    setLoading(false)
  }

  // eslint-disable-next-line react-hooks/set-state-in-effect, react-hooks/exhaustive-deps
  useEffect(() => { load() }, [user, params.id])

  const handleCancel = async () => {
    if (!user || !post) return
    await cancelPost(post.id)
    setPost({ ...post, status: 'cancelled' })
  }

  if (loading) {
    return (
      <AuthGuard>
        <ConsoleShell>
          <div className="p-6 flex items-center gap-2 text-muted text-sm font-mono">
            <span className="w-3 h-3 border border-muted/30 border-t-ink rounded-full animate-spin" />
            Loading post...
          </div>
        </ConsoleShell>
      </AuthGuard>
    )
  }

  if (error || !post) {
    return (
      <AuthGuard>
        <ConsoleShell>
          <div className="p-6 space-y-4">
            <p className="text-error text-sm font-mono">{error || 'Post not found'}</p>
            <Link href="/posts" className="text-ink text-sm hover:underline">← Back to posts</Link>
          </div>
        </ConsoleShell>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard>
      <ConsoleShell>
        <motion.div variants={container} initial="hidden" animate="visible" className="p-4 sm:p-6 space-y-6 max-w-3xl">
          <motion.div variants={item} className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3">
                <button onClick={() => router.push('/posts')} className="text-muted hover:text-ink transition-colors text-sm">
                  ←
                </button>
                <h1 className="font-cal text-[28px] text-ink tracking-tight">
                  {post.title || '(untitled)'}
                </h1>
              </div>
              <p className="text-muted text-sm font-sans mt-1 ml-7">Post details & history</p>
            </div>
            <Badge variant={post.status} />
          </motion.div>

          <motion.div variants={item} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-md border border-hairline bg-surface-card p-4 space-y-3">
              <h3 className="text-[10px] text-muted font-mono uppercase tracking-wider">Details</h3>
              <div className="space-y-2 text-[13px]">
                <div className="flex justify-between">
                  <span className="text-muted font-sans">Platforms</span>
                  <div className="flex gap-2">
                    {Array.isArray(post.platforms) && post.platforms.map((p) => (
                      <span key={p} className="px-3 py-1.5 rounded-md text-[12px] font-mono uppercase tracking-wider border border-brand-accent/20 bg-brand-accent/10 text-brand-accent">
                        {p === 'facebook' ? 'FB' : 'IG'}
                      </span>
                    ))}
                  </div>
                </div>
                {post.schedule_at && (
                  <div className="flex justify-between">
                    <span className="text-muted font-sans">Scheduled</span>
                    <span className="text-ink font-mono text-[12px]">
                      {new Date(post.schedule_at).toLocaleDateString()}{' '}
                      {new Date(post.schedule_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                )}
                {post.published_at && (
                  <div className="flex justify-between">
                    <span className="text-muted font-sans">Published</span>
                    <span className="text-success font-mono text-[12px]">
                      {new Date(post.published_at).toLocaleDateString()}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted font-sans">Retries</span>
                  <span className="text-ink font-mono text-[12px]">{post.retry_count}/{post.max_retries}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted font-sans">Timezone</span>
                  <span className="text-ink font-mono text-[12px]">{post.timezone}</span>
                </div>
              </div>
            </div>

            <div className="rounded-md border border-hairline bg-surface-card p-4 space-y-3">
              <h3 className="text-[10px] text-muted font-mono uppercase tracking-wider">Caption</h3>
              <p className="text-ink text-[13px] font-sans whitespace-pre-wrap leading-relaxed">
                {post.caption || <span className="text-muted italic">No caption</span>}
              </p>
            </div>
          </motion.div>

          {post.status === 'failed' && post.error_message && (
            <motion.div variants={item} className="rounded-md border border-error/20 bg-error/5 p-4">
              <p className="text-[10px] text-error font-mono uppercase tracking-wider">Error</p>
              <p className="text-body text-[13px] font-sans mt-1">{post.error_message}</p>
            </motion.div>
          )}

          <motion.div variants={item} className="space-y-3">
            <h2 className="text-[13px] text-muted font-mono uppercase tracking-wider">
              Logs ({logs.length})
            </h2>
            {logs.length === 0 ? (
              <p className="text-muted text-sm font-sans">No log entries yet.</p>
            ) : (
              <div className="rounded-md border border-hairline bg-surface-card divide-y divide-hairline">
                {logs.map((log) => (
                  <div key={log.id} className="p-3 flex items-start gap-3">
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 mt-1.5 ${
                      log.status === 'success' ? 'bg-success' :
                      log.status === 'error' ? 'bg-error' : 'bg-badge-orange'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[12px] text-ink font-mono">{log.workflow_name}</span>
                        <Badge variant={log.status} />
                      </div>
                      {log.error_message && (
                        <p className="text-[11px] text-error/80 font-sans mt-0.5">{log.error_message}</p>
                      )}
                      <p className="text-[10px] text-muted font-mono mt-0.5">
                        Attempt {log.attempt_number} — {new Date(log.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>

          {(post.status === 'draft' || post.status === 'scheduled') && (
            <motion.div variants={item} className="flex gap-3 pt-2">
              <Button variant="secondary" size="md" onClick={() => router.push(`/composer/${post.id}`)}>
                Edit
              </Button>
              <Button variant="destructive" size="md" onClick={handleCancel}>
                Cancel Post
              </Button>
            </motion.div>
          )}
        </motion.div>
      </ConsoleShell>
    </AuthGuard>
  )
}
