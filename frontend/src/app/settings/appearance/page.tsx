'use client'

import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { useState } from 'react'

const container = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
}

const item = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
}

const themes = [
  { id: 'light', label: 'White Canvas', desc: 'Premium white theme — Default', active: true },
  { id: 'dark', label: 'Dark Ink', desc: 'Dark mode (coming soon)', active: false },
]

export default function AppearancePage() {
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)

  const handleSave = () => {
    setSaving(true)
    setTimeout(() => {
      setSaving(false)
      setDirty(false)
    }, 800)
  }

  return (
    <motion.div variants={container} initial="hidden" animate="visible">
      <motion.div variants={item} className="mb-8 border-b border-hairline pb-4">
        <h2 className="font-cal tracking-tighter text-[24px] text-ink">Appearance</h2>
        <p className="text-muted text-[13px] font-medium mt-1">Manage theme and display preferences.</p>
      </motion.div>

      <motion.div variants={item} className="space-y-8">
        <div className="space-y-3">
          <label className="text-[13px] font-bold text-ink uppercase tracking-wider">
            Theme
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
            {themes.map((theme) => (
              <button
                key={theme.id}
                type="button"
                onClick={() => setDirty(true)}
                className={`text-left rounded-lg border p-5 transition-all shadow-sm ${
                  theme.active
                    ? 'border-hairline bg-surface-card ring-1 ring-inset ring-ink/5'
                    : 'border-hairline bg-canvas opacity-60 hover:opacity-100 hover:bg-surface-soft'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[15px] text-ink font-semibold">{theme.label}</span>
                  {theme.active && (
                    <span className="text-[10px] text-muted font-bold uppercase tracking-widest bg-surface-soft px-1.5 py-0.5 rounded">Active</span>
                  )}
                </div>
                <p className="text-[13px] text-muted font-medium mt-2">{theme.desc}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <label className="text-[13px] font-bold text-ink uppercase tracking-wider">
            Typography Scale
          </label>
          <div className="rounded-lg bg-surface-card p-5 space-y-6 max-w-2xl">
            <div>
              <p className="text-[11px] text-muted font-bold uppercase tracking-widest">Display Headings</p>
              <p className="font-cal text-[24px] text-ink mt-1">Cal Sans</p>
            </div>
            <div className="border-t border-hairline pt-4">
              <p className="text-[11px] text-muted font-bold uppercase tracking-widest">Functional Body</p>
              <p className="font-sans text-[15px] text-ink mt-1 font-medium">Inter</p>
            </div>
            <div className="border-t border-hairline pt-4">
              <p className="text-[11px] text-muted font-bold uppercase tracking-widest">Data & Code</p>
              <p className="font-mono text-[14px] text-ink mt-1 font-medium tabular-nums">JetBrains Mono</p>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-hairline flex items-center justify-between">
          <p className={`text-[12px] font-medium transition-opacity ${dirty ? 'text-badge-orange opacity-100' : 'opacity-0'}`}>
            You have unsaved changes.
          </p>
          <div className="flex gap-3">
             {dirty && (
               <Button type="button" variant="ghost" onClick={() => setDirty(false)}>
                 Discard
               </Button>
             )}
            <Button type="button" variant="primary" onClick={handleSave} disabled={saving || !dirty}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
