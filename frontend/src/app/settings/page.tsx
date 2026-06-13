'use client'

import { motion } from 'framer-motion'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { SkeletonList } from '@/components/ui/skeleton'
import { useSettings } from '@/hooks/use-settings'
import { useState, useEffect } from 'react'

const container = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
}

const item = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
}

const timezones = Intl.supportedValuesOf?.('timeZone') || [
  'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
  'Europe/London', 'Europe/Berlin', 'Europe/Paris', 'Asia/Tokyo', 'Asia/Shanghai',
  'Asia/Kolkata', 'Australia/Sydney', 'Pacific/Auckland', 'UTC',
]

export default function SettingsPage() {
  const { profile, loading, saving, error, update, removeAccount } = useSettings()
  const [dirty, setDirty] = useState(false)
  
  // Reset dirty state when profile changes/loads
  useEffect(() => {
    if (!loading) setDirty(false)
  }, [loading, profile])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const form = e.target as HTMLFormElement
    const data = new FormData(form)
    await update({
      display_name: data.get('display_name') as string || null,
      timezone: data.get('timezone') as string,
    })
    setDirty(false)
  }

  const handleChange = () => {
    setDirty(true)
  }

  if (loading) {
    return (
      <div className="p-8 max-w-md">
        <div className="mb-8 border-b border-hairline pb-4">
          <div className="h-8 w-48 bg-surface-strong rounded animate-pulse mb-2" />
          <div className="h-4 w-64 bg-surface-strong rounded animate-pulse" />
        </div>
        <SkeletonList rows={3} />
      </div>
    )
  }

  const handleDeleteAccount = async () => {
    if (window.confirm('Are you sure you want to permanently delete your account? This action cannot be undone.')) {
      try {
        await removeAccount()
        window.location.href = '/'
      } catch (e) {
        // Error is handled in hook
      }
    }
  }

  return (
    <motion.div variants={container} initial="hidden" animate="visible">
      <motion.div variants={item} className="mb-8 border-b border-hairline pb-4">
        <h2 className="font-cal tracking-tighter text-[24px] text-ink">Profile Settings</h2>
        <p className="text-muted text-[13px] font-medium mt-1">Manage your personal information and preferences.</p>
      </motion.div>

      <motion.form variants={item} onSubmit={handleSubmit} onChange={handleChange} className="space-y-6">
        <div className="space-y-2">
          <label htmlFor="display_name" className="text-[13px] font-bold text-ink uppercase tracking-wider">
            Display Name
          </label>
          <Input
            id="display_name"
            name="display_name"
            placeholder="Your name"
            defaultValue={profile?.display_name || ''}
            className="max-w-md h-10"
          />
          <p className="text-[12px] text-muted">This is your public display name. It can be your real name or a pseudonym.</p>
        </div>

        <div className="space-y-2 pt-4">
          <label htmlFor="timezone" className="text-[13px] font-bold text-ink uppercase tracking-wider">
            Timezone
          </label>
          <select
            id="timezone"
            name="timezone"
            defaultValue={profile?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone}
            className="w-full max-w-md rounded-md bg-surface-soft px-3 h-10 text-[14px] text-ink border-none shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)] focus:bg-canvas focus:outline-none focus:ring-2 focus:ring-ink/20 focus:shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] transition-all"
          >
            {timezones.map((tz) => (
              <option key={tz} value={tz}>{tz}</option>
            ))}
          </select>
          <p className="text-[12px] text-muted">This timezone is used for scheduling posts.</p>
        </div>

        {error && (
          <div className="bg-error/10 border border-error/20 p-3 rounded-md max-w-md">
            <p className="text-error text-[12px] font-medium">{error}</p>
          </div>
        )}

        <div className="pt-6 border-t border-hairline flex items-center justify-between">
          <p className={`text-[12px] font-medium transition-opacity ${dirty ? 'text-badge-orange opacity-100' : 'opacity-0'}`}>
            You have unsaved changes.
          </p>
          <div className="flex gap-3">
             {dirty && (
               <Button type="button" variant="ghost" onClick={() => window.location.reload()}>
                 Discard
               </Button>
             )}
            <Button type="submit" variant="primary" disabled={saving || !dirty}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>

        <div className="pt-10 mt-10 border-t border-error/20 max-w-md">
          <h3 className="font-cal tracking-tighter text-[18px] text-error mb-2">Danger Zone</h3>
          <p className="text-muted text-[13px] font-medium mb-4">
            Once you delete your account, there is no going back. All your connected accounts, media, and scheduled posts will be permanently deleted.
          </p>
          <Button type="button" variant="ghost" onClick={handleDeleteAccount} disabled={saving} className="border border-error/30 text-error hover:bg-error/10 h-10">
            {saving ? 'Deleting...' : 'Delete Account'}
          </Button>
        </div>
      </motion.form>
    </motion.div>
  )
}
