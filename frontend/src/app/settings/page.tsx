'use client'

import { motion } from 'framer-motion'
import { ConsoleShell } from '@/components/shell/console-shell'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { AuthGuard } from '@/components/auth/auth-guard'
import { useSettings } from '@/hooks/use-settings'

const container = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
}

const item = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
}

const timezones = Intl.supportedValuesOf?.('timeZone') || [
  'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
  'Europe/London', 'Europe/Berlin', 'Europe/Paris', 'Asia/Tokyo', 'Asia/Shanghai',
  'Asia/Kolkata', 'Australia/Sydney', 'Pacific/Auckland', 'UTC',
]

export default function SettingsPage() {
  const { profile, loading, saving, error, update } = useSettings()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const form = e.target as HTMLFormElement
    const data = new FormData(form)
    await update({
      display_name: data.get('display_name') as string || null,
      timezone: data.get('timezone') as string,
    })
  }

  return (
    <AuthGuard>
      <ConsoleShell>
        <motion.div variants={container} initial="hidden" animate="visible" className="p-4 sm:p-6 space-y-6 max-w-2xl">
          <motion.div variants={item}>
            <div className="flex items-center gap-3">
              <h1 className="font-serif text-[28px] text-text tracking-tight">Settings</h1>
              <span className="text-[10px] text-text-dim font-mono uppercase tracking-widest border border-border rounded-sm px-1.5 py-0.5">
                Profile
              </span>
            </div>
            <p className="text-text-muted text-sm font-sans mt-1">Profile and preferences</p>
          </motion.div>

          {loading ? (
            <motion.div variants={item} className="flex items-center gap-2 text-text-dim text-sm font-mono">
              <span className="w-3 h-3 border border-gold/30 border-t-gold rounded-full animate-spin" />
              Loading settings...
            </motion.div>
          ) : (
            <motion.form variants={item} onSubmit={handleSubmit} className="space-y-5">
              <Input
                id="display_name"
                name="display_name"
                label="Display Name"
                placeholder="Your name"
                defaultValue={profile?.display_name || ''}
              />

              <div className="space-y-1.5">
                <label htmlFor="timezone" className="text-[12px] text-text-dim font-mono uppercase tracking-wider">
                  Timezone
                </label>
                <select
                  id="timezone"
                  name="timezone"
                  defaultValue={profile?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone}
                  className="w-full rounded-sm border border-border bg-surface-2 px-3 py-2 text-sm text-text focus:outline-none focus:ring-1 focus:ring-gold/50 font-sans"
                >
                  {timezones.map((tz) => (
                    <option key={tz} value={tz}>{tz}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[12px] text-text-dim font-mono uppercase tracking-wider">Appearance</label>
                <a
                  href="/settings/appearance"
                  className="block w-full rounded-sm border border-border bg-surface-2 px-3 py-2 text-sm text-text hover:bg-surface-3 transition-colors font-sans"
                >
                  Theme & display settings →
                </a>
              </div>

              {error && (
                <p className="text-red text-[12px] font-mono">{error}</p>
              )}

              <Button type="submit" variant="primary" size="md" disabled={saving}>
                {saving ? 'Saving...' : 'Save Settings'}
              </Button>
            </motion.form>
          )}
        </motion.div>
      </ConsoleShell>
    </AuthGuard>
  )
}
