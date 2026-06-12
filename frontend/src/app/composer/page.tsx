'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
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
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { SocialAccount } from '@/types/database'

const container = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
}

const item = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
}

const MAX_FILE_SIZE = 100 * 1024 * 1024
const MAX_CAPTION_LENGTH = 2200
const MAX_TITLE_LENGTH = 200
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/mov', 'video/quicktime']

interface ValidationErrors {
  title?: string
  caption?: string
  platform?: string
  account?: string
  schedule?: string
  media?: string
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
  const [mediaFile, setMediaFile] = useState<File | null>(null)
  const [accountId, setAccountId] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dirty, setDirty] = useState<Set<string>>(new Set())
  const prevObjectUrl = useRef<string | null>(null)

  const errors = useMemo<ValidationErrors>(() => {
    const e: ValidationErrors = {}
    if (title.length > MAX_TITLE_LENGTH) e.title = `Max ${MAX_TITLE_LENGTH} characters`
    if (caption.length > MAX_CAPTION_LENGTH) e.caption = `Max ${MAX_CAPTION_LENGTH} characters`
    if (!accountId) e.account = 'Select an account'
    if (platforms.length === 0) e.platform = 'Select at least one platform'
    if (scheduleAt) {
      const d = new Date(scheduleAt)
      if (d <= new Date()) e.schedule = 'Must be in the future'
    }
    return e
  }, [title, caption, accountId, platforms, scheduleAt])

  const canSaveDraft = !errors.account && !errors.title && !errors.caption
  const canSchedule = !errors.account && !errors.platform && !errors.title && !errors.caption && !errors.schedule

  useEffect(() => {
    if (!user) return
    supabase
      .from('social_accounts')
      .select('id, user_id, platform, page_id, page_name, ig_user_id, ig_username, status, token_expires_at, created_at')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .then(({ data }) => setAccounts(data || []))
  }, [user])

  const handleSubmit = async (status: 'draft' | 'scheduled') => {
    if (!user) return
    setDirty(new Set(['account', 'platform', 'schedule']))
    if (status === 'scheduled' && !canSchedule) return
    if (status === 'draft' && !canSaveDraft) return
    setSaving(true)
    setError(null)
    try {
      let mediaIds: string[] | undefined
      if (mediaFile) {
        const path = `${user.id}/${Date.now()}-${mediaFile.name}`
        const { error: uploadError } = await supabase.storage
          .from('media')
          .upload(path, mediaFile)
        if (uploadError) throw new Error(uploadError.message)

        const { data: { publicUrl } } = supabase.storage
          .from('media')
          .getPublicUrl(path)

        const { data: newMedia, error: insertError } = await supabase
          .from('media_assets')
          .insert({
            user_id: user.id,
            file_url: publicUrl,
            file_type: mediaFile.type,
            file_size: mediaFile.size,
            storage_path: path,
          })
          .select('id')
          .single()

        if (insertError) throw new Error(insertError.message)
        if (newMedia) mediaIds = [newMedia.id]
      }

      await createPost({
        accountId,
        title: title || undefined,
        caption: caption || undefined,
        mediaIds,
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

  useEffect(() => {
    return () => {
      if (prevObjectUrl.current) URL.revokeObjectURL(prevObjectUrl.current)
    }
  }, [])

  const handleFile = (file: File) => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('Unsupported file type. Use JPG, PNG, GIF, WebP, or MP4.')
      return
    }
    if (file.size > MAX_FILE_SIZE) {
      setError('File too large. Max 100 MB.')
      return
    }
    setError(null)
    if (prevObjectUrl.current) URL.revokeObjectURL(prevObjectUrl.current)
    const url = URL.createObjectURL(file)
    prevObjectUrl.current = url
    setMediaUrl(url)
    setMediaFile(file)
  }

  return (
    <AuthGuard>
      <ConsoleShell>
        <motion.div variants={container} initial="hidden" animate="visible" className="p-4 sm:p-6 space-y-6 max-w-2xl">
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
              onChange={(e) => { setTitle(e.target.value); setDirty((p) => new Set(p).add('title')) }}
              error={dirty.has('title') ? errors.title : undefined}
            />

            <div className="space-y-1.5">
              <CaptionEditor value={caption} onChange={(v) => { setCaption(v); setDirty((p) => new Set(p).add('caption')) }} />
              {dirty.has('caption') && errors.caption && (
                <span className="text-[12px] text-red font-mono">{errors.caption}</span>
              )}
            </div>

            <PlatformSelector platforms={platforms} onToggle={(p) => {
              setPlatforms((prev) =>
                prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p],
              )
              setDirty((prev) => new Set(prev).add('platform'))
            }} />
            {dirty.has('platform') && errors.platform && (
              <span className="text-[12px] text-red font-mono block -mt-3">{errors.platform}</span>
            )}

            <AccountSelector accounts={accounts} value={accountId} onChange={(v) => { setAccountId(v); setDirty((p) => new Set(p).add('account')) }} />
            {dirty.has('account') && errors.account && (
              <span className="text-[12px] text-red font-mono block -mt-3">{errors.account}</span>
            )}

            <MediaDropzone onFile={handleFile} />

            {mediaUrl && (
              <div className="rounded-sm border border-border bg-surface p-2 relative group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={mediaUrl} alt="Preview" className="max-h-40 rounded-sm object-contain" />
                <button
                  onClick={() => {
                    if (prevObjectUrl.current) URL.revokeObjectURL(prevObjectUrl.current)
                    prevObjectUrl.current = null
                    setMediaUrl('')
                    setMediaFile(null)
                  }}
                  className="absolute top-1 right-1 w-6 h-6 rounded-sm bg-red/80 text-white text-[10px] font-mono flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  ✕
                </button>
              </div>
            )}

            <SchedulePicker value={scheduleAt} onChange={(v) => { setScheduleAt(v); setDirty((p) => new Set(p).add('schedule')) }} />
            {dirty.has('schedule') && errors.schedule && (
              <span className="text-[12px] text-red font-mono block -mt-2">{errors.schedule}</span>
            )}

            {error && (
              <p className="text-red text-[12px] font-mono">{error}</p>
            )}

            <div className="flex gap-3 pt-2">
              <Button
                variant="ghost"
                size="md"
                onClick={() => handleSubmit('draft')}
                disabled={saving || !canSaveDraft}
              >
                {saving ? 'Saving...' : 'Save Draft'}
              </Button>
              <Button
                variant="gold"
                size="md"
                onClick={() => handleSubmit('scheduled')}
                disabled={saving || !canSchedule}
              >
                {saving ? 'Saving...' : 'Schedule'}
              </Button>
            </div>
            {dirty.has('account') && !accountId && accounts.length > 0 && (
              <p className="text-[11px] text-text-dim font-mono">Select an account to enable saving</p>
            )}
            {accounts.length === 0 && (
              <p className="text-[11px] text-text-dim font-mono">
                No active accounts.{' '}
                <Link href="/accounts" className="text-gold hover:underline">Connect one</Link>
              </p>
            )}
          </motion.div>
        </motion.div>
      </ConsoleShell>
    </AuthGuard>
  )
}
