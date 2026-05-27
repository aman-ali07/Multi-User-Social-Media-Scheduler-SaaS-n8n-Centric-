'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { ConsoleShell } from '@/components/shell/console-shell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AuthGuard } from '@/components/auth/auth-guard'
import { CaptionEditor } from '@/components/composer/caption-editor'
import { SchedulePicker } from '@/components/composer/schedule-picker'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/use-auth'
import { updatePost } from '@/lib/n8n'
import type { ScheduledPost } from '@/types/database'

const container = {
  hidden: { opacity: 0 },
  visible: { transition: { staggerChildren: 0.06 } },
}

const item = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
}

export default function EditPostPage() {
  const { user } = useAuth()
  const params = useParams()
  const router = useRouter()
  const [post, setPost] = useState<ScheduledPost | null>(null)
  const [caption, setCaption] = useState('')
  const [scheduleAt, setScheduleAt] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user || !params.id) return
    supabase
      .from('scheduled_posts')
      .select('*')
      .eq('id', params.id as string)
      .eq('user_id', user.id)
      .single()
      .then(({ data, error }) => {
        if (error) { setError(error.message); return }
        if (data) {
          setPost(data)
          setCaption(data.caption || '')
          setScheduleAt(data.schedule_at ? data.schedule_at.slice(0, 16) : '')
        }
        setLoading(false)
      })
  }, [user, params.id])

  const handleSave = async (status?: string) => {
    if (!user || !post) return
    setSaving(true)
    setError(null)
    try {
      await updatePost({
        postId: post.id,
        userId: user.id,
        title: post.title || undefined,
        caption: caption || undefined,
        platforms: post.platforms,
        accountId: post.account_id || undefined,
        scheduleAt: scheduleAt ? new Date(scheduleAt).toISOString() : null,
        status,
      })
      router.push('/posts')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update post'
      setError(message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <AuthGuard>
        <ConsoleShell>
          <div className="p-6 flex items-center gap-2 text-text-dim text-sm font-mono">
            <span className="w-3 h-3 border border-gold/30 border-t-gold rounded-full animate-spin" />
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
            <p className="text-red text-sm font-mono">{error || 'Post not found'}</p>
            <Link href="/posts" className="text-gold text-sm hover:underline">← Back to posts</Link>
          </div>
        </ConsoleShell>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard>
      <ConsoleShell>
        <motion.div variants={container} initial="hidden" animate="visible" className="p-6 space-y-6 max-w-2xl">
          <motion.div variants={item}>
            <h1 className="font-serif text-[28px] text-text tracking-tight">Edit Post</h1>
            <p className="text-text-muted text-sm font-sans mt-1">{post.title || 'Untitled'}</p>
          </motion.div>

          <motion.div variants={item} className="space-y-4">
            <Input
              id="title"
              label="Title"
              value={post.title || ''}
              disabled
            />

            <CaptionEditor value={caption} onChange={setCaption} />

            <div className="space-y-1.5">
              <label className="text-[12px] text-text-dim font-mono uppercase tracking-wider">Platforms</label>
              <div className="flex gap-2">
                {post.platforms.map((p) => (
                  <span key={p} className="px-3 py-1.5 rounded-sm text-[12px] font-mono uppercase tracking-wider border border-gold/50 bg-gold/10 text-gold">
                    {p === 'facebook' ? 'FB' : 'IG'}
                  </span>
                ))}
              </div>
            </div>

            <SchedulePicker value={scheduleAt} onChange={setScheduleAt} />

            {error && (
              <p className="text-red text-[12px] font-mono">{error}</p>
            )}

            <div className="flex gap-3 pt-2">
              <Button variant="ghost" size="md" onClick={() => router.push('/posts')}>
                Cancel
              </Button>
              <Button variant="gold" size="md" onClick={() => handleSave()} disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
              {post.status === 'draft' && (
                <Button variant="primary" size="md" onClick={() => handleSave('scheduled')} disabled={saving}>
                  {saving ? 'Saving...' : 'Schedule'}
                </Button>
              )}
            </div>
          </motion.div>
        </motion.div>
      </ConsoleShell>
    </AuthGuard>
  )
}
