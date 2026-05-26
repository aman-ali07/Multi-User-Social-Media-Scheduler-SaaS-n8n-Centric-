'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ConsoleShell } from '@/components/shell/console-shell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AuthGuard } from '@/components/auth/auth-guard'
import { MediaDropzone } from '@/components/composer/media-dropzone'
import { CaptionEditor } from '@/components/composer/caption-editor'
import { PlatformSelector } from '@/components/composer/platform-selector'
import { SchedulePicker } from '@/components/composer/schedule-picker'
import { AccountSelector } from '@/components/composer/account-selector'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/use-auth'
import { createPost } from '@/lib/n8n'
import { useRouter } from 'next/navigation'
import type { SocialAccount } from '@/types/database'

const container = {
  hidden: { opacity: 0 },
  visible: { transition: { staggerChildren: 0.06 } },
}

const item = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
}

export default function ComposerPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [accounts, setAccounts] = useState<SocialAccount[]>([])
  const [title, setTitle] = useState('')
  const [caption, setCaption] = useState('')
  const [platforms, setPlatforms] = useState<string[]>(['facebook'])
  const [scheduleAt, setScheduleAt] = useState('')
  const [mediaUrl, setMediaUrl] = useState('')
  const [accountId, setAccountId] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    supabase
      .from('social_accounts')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .then(({ data }) => setAccounts(data || []))
  }, [user])

  const handleSubmit = async (status: 'draft' | 'scheduled') => {
    if (!user) return
    setSaving(true)
    setError(null)
    try {
      await createPost({
        userId: user.id,
        accountId,
        title: title || undefined,
        caption: caption || undefined,
        platforms,
        scheduleAt: status === 'scheduled' && scheduleAt ? new Date(scheduleAt).toISOString() : null,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        status,
      })
      router.push('/posts')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save post'
      setError(message)
    } finally {
      setSaving(false)
    }
  }

  const handleFile = (file: File) => {
    setMediaUrl(URL.createObjectURL(file))
  }

  return (
    <AuthGuard>
      <ConsoleShell>
        <motion.div variants={container} initial="hidden" animate="visible" className="p-6 space-y-6 max-w-2xl">
          <motion.div variants={item}>
            <h1 className="font-serif text-[28px] text-text tracking-tight">Composer</h1>
            <p className="text-text-muted text-sm font-sans mt-1">Create a new post</p>
          </motion.div>

          <motion.div variants={item} className="space-y-4">
            <Input
              id="title"
              label="Title"
              placeholder="Post title (internal)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />

            <CaptionEditor value={caption} onChange={setCaption} />

            <PlatformSelector platforms={platforms} onToggle={(p) => {
              setPlatforms((prev) =>
                prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p],
              )
            }} />

            <AccountSelector accounts={accounts} value={accountId} onChange={setAccountId} />

            <MediaDropzone onFile={handleFile} />

            {mediaUrl && (
              <div className="rounded-sm border border-border bg-surface p-2">
                <img src={mediaUrl} alt="Preview" className="max-h-40 rounded-sm object-contain" />
              </div>
            )}

            <SchedulePicker value={scheduleAt} onChange={setScheduleAt} />

            {error && (
              <p className="text-red text-[12px] font-mono">{error}</p>
            )}

            <div className="flex gap-3 pt-2">
              <Button
                variant="ghost"
                size="md"
                onClick={() => handleSubmit('draft')}
                disabled={saving || !accountId}
              >
                {saving ? 'Saving...' : 'Save Draft'}
              </Button>
              <Button
                variant="gold"
                size="md"
                onClick={() => handleSubmit('scheduled')}
                disabled={saving || !accountId || platforms.length === 0}
              >
                {saving ? 'Saving...' : 'Schedule'}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      </ConsoleShell>
    </AuthGuard>
  )
}
