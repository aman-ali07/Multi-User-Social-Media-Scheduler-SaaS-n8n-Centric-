'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { motion } from 'framer-motion'
import { ConsoleShell } from '@/components/shell/console-shell'
import { Button } from '@/components/ui/button'
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
import { X, Loader2, Image as ImageIcon } from 'lucide-react'

const MAX_FILE_SIZE = 100 * 1024 * 1024
const MAX_TITLE_LENGTH = 200
const FB_MAX_LENGTH = 63206
const IG_MAX_LENGTH = 2200
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

  const dynamicMaxLength = platforms.includes('instagram') ? IG_MAX_LENGTH : FB_MAX_LENGTH

  const errors = useMemo<ValidationErrors>(() => {
    const e: ValidationErrors = {}
    if (title.length > MAX_TITLE_LENGTH) e.title = `Max ${MAX_TITLE_LENGTH} characters`
    if (caption.length > dynamicMaxLength) e.caption = `Max ${dynamicMaxLength} characters`
    if (!accountId) e.account = 'Select an account'
    if (platforms.length === 0) e.platform = 'Select at least one platform'
    if (scheduleAt) {
      const d = new Date(scheduleAt)
      const now = new Date()
      const minimumTime = new Date(now.getTime() + 15 * 60000)
      
      if (d <= now) {
        e.schedule = 'Cannot schedule in the past'
      } else if (d < minimumTime) {
        e.schedule = 'Must be at least 15 minutes in the future'
      }
    }
    return e
  }, [title, caption, accountId, platforms, scheduleAt])

  const canSaveDraft = !errors.account && !errors.title && !errors.caption
  const canSchedule = !errors.account && !errors.platform && !errors.title && !errors.caption && !errors.schedule

  const hasUnsavedChanges = title !== '' || caption !== '' || mediaFile !== null
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [hasUnsavedChanges])

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

  const [isSyncing, setIsSyncing] = useState(false)
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const handleTyping = () => {
    setIsSyncing(true)
    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current)
    syncTimeoutRef.current = setTimeout(() => {
      setIsSyncing(false)
    }, 800)
  }

  const RightPanel = (
    <div className="flex flex-col h-full bg-surface-soft p-6">
      <div className="mb-6 flex justify-between items-start">
        <div>
          <h3 className="font-cal text-ink text-[16px] tracking-tight mb-1">Post Settings</h3>
          <p className="text-[12px] text-muted font-medium">Configure distribution and scheduling.</p>
        </div>
        <div className="flex items-center gap-1.5 bg-canvas px-2 py-1 rounded-full border border-hairline shadow-sm">
          <div className={`w-1.5 h-1.5 rounded-full ${isSyncing ? 'bg-brand-accent animate-pulse' : 'bg-success'}`} />
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted">
            {isSyncing ? 'Syncing' : 'Synced'}
          </span>
        </div>
      </div>

      <div className="space-y-6 flex-1">
        <div>
          <PlatformSelector platforms={platforms} onToggle={(p) => {
            setPlatforms((prev) => prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p])
            setDirty((prev) => new Set(prev).add('platform'))
          }} />
          {dirty.has('platform') && errors.platform && (
            <span className="text-[12px] text-error font-medium block mt-1">{errors.platform}</span>
          )}
        </div>

        <div>
          <AccountSelector accounts={accounts} value={accountId} onChange={(v) => { setAccountId(v); setDirty((p) => new Set(p).add('account')) }} />
          {dirty.has('account') && errors.account && (
            <span className="text-[12px] text-error font-medium block mt-1">{errors.account}</span>
          )}
        </div>

        <div>
          <SchedulePicker value={scheduleAt} onChange={(v) => { setScheduleAt(v); setDirty((p) => new Set(p).add('schedule')) }} />
          {dirty.has('schedule') && errors.schedule && (
            <span className="text-[12px] text-error font-medium block mt-1">{errors.schedule}</span>
          )}
        </div>
        
        {error && (
          <div className="bg-error/10 border border-error/20 p-3 rounded-md">
            <p className="text-error text-[12px] font-medium">{error}</p>
          </div>
        )}
      </div>

      <div className="pt-6 mt-6 border-t border-hairline flex flex-col gap-3">
        <Button
          variant="primary"
          className="w-full h-11 text-[13px] font-semibold tracking-wide"
          onClick={() => handleSubmit('scheduled')}
          disabled={saving || !canSchedule}
        >
          {saving && canSchedule ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
          {saving && canSchedule ? 'Scheduling...' : 'Schedule Post'}
        </Button>
        <Button
          variant="ghost"
          className="w-full h-11 text-[13px] font-semibold text-muted hover:text-ink hover:bg-hairline"
          onClick={() => handleSubmit('draft')}
          disabled={saving || !canSaveDraft}
        >
          {saving && !canSchedule ? 'Saving...' : 'Save as Draft'}
        </Button>
        
        {dirty.has('account') && !accountId && accounts.length > 0 && (
          <p className="text-[11px] text-center text-muted font-medium mt-1">Select an account to enable saving</p>
        )}
        {accounts.length === 0 && (
          <p className="text-[11px] text-center text-muted font-medium mt-1">
            No active accounts.{' '}
            <Link href="/accounts" className="text-ink underline hover:text-ink/80 transition-colors">Connect one</Link>
          </p>
        )}
      </div>
    </div>
  )

  return (
    <AuthGuard>
      <ConsoleShell rightPanel={RightPanel}>
        <div className="max-w-3xl mx-auto p-8 sm:p-12 lg:p-16 h-full flex flex-col">
          <input
            type="text"
            placeholder="Document Title"
            value={title}
            onChange={(e) => { setTitle(e.target.value); setDirty((p) => new Set(p).add('title')); handleTyping() }}
            className="w-full bg-transparent px-0 py-2 text-[32px] font-cal tracking-tighter text-ink placeholder:text-muted/30 focus:outline-none mb-6"
          />
          {dirty.has('title') && errors.title && (
            <span className="text-[12px] text-error font-medium block -mt-4 mb-6">{errors.title}</span>
          )}

          <div className="flex-1">
            <CaptionEditor 
              value={caption} 
              onChange={(v) => { setCaption(v); setDirty((p) => new Set(p).add('caption')); handleTyping() }} 
              maxLength={dynamicMaxLength}
            />
            {dirty.has('caption') && errors.caption && (
              <span className="text-[12px] text-error font-medium block mt-1">{errors.caption}</span>
            )}
          </div>

          <div className="mt-8">
            <div className="flex items-center gap-2 mb-3">
              <ImageIcon className="w-4 h-4 text-muted" />
              <span className="text-[12px] font-bold text-muted uppercase tracking-widest">Media</span>
            </div>
            
            {!mediaUrl ? (
              <MediaDropzone onFile={handleFile} />
            ) : (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border border-hairline bg-surface-card p-2 relative group shadow-sm inline-block max-w-full"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={mediaUrl} alt="Preview" className="max-h-64 rounded-lg object-contain" />
                <button
                  onClick={() => {
                    if (prevObjectUrl.current) URL.revokeObjectURL(prevObjectUrl.current)
                    prevObjectUrl.current = null
                    setMediaUrl('')
                    setMediaFile(null)
                  }}
                  className="absolute top-4 right-4 w-8 h-8 rounded-full bg-canvas/80 backdrop-blur-md text-ink flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-canvas shadow-sm"
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            )}
          </div>
        </div>
      </ConsoleShell>
    </AuthGuard>
  )
}
