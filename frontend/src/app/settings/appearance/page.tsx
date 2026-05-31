'use client'

import { motion } from 'framer-motion'
import { ConsoleShell } from '@/components/shell/console-shell'
import { Button } from '@/components/ui/button'
import { AuthGuard } from '@/components/auth/auth-guard'

const container = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
}

const item = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
}

const themes = [
  { id: 'dark', label: 'Console Dark', desc: 'Warm dark — broadcast control room', active: true },
  { id: 'light', label: 'Signal Light', desc: 'Warm light mode (coming soon)', active: false },
]

export default function AppearancePage() {
  return (
    <AuthGuard>
      <ConsoleShell>
        <motion.div variants={container} initial="hidden" animate="visible" className="p-4 sm:p-6 space-y-6 max-w-2xl">
          <motion.div variants={item}>
            <div className="flex items-center gap-3">
              <a href="/settings" className="text-text-dim hover:text-text transition-colors text-sm">←</a>
              <h1 className="font-serif text-[28px] text-text tracking-tight">Appearance</h1>
            </div>
            <p className="text-text-muted text-sm font-sans mt-1 ml-7">Theme and display preferences</p>
          </motion.div>

          <motion.div variants={item} className="space-y-3">
            <h2 className="text-[13px] text-text-muted font-mono uppercase tracking-wider">Theme</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {themes.map((theme) => (
                <div
                  key={theme.id}
                  className={`rounded-sm border p-4 transition-all ${
                    theme.active
                      ? 'border-gold/40 bg-gold/5'
                      : 'border-border bg-surface opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[14px] text-text font-sans">{theme.label}</span>
                    {theme.active && (
                      <span className="text-[10px] text-gold font-mono uppercase">Active</span>
                    )}
                  </div>
                  <p className="text-[11px] text-text-muted font-sans mt-1">{theme.desc}</p>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div variants={item} className="space-y-3">
            <h2 className="text-[13px] text-text-muted font-mono uppercase tracking-wider">Typography</h2>
            <div className="rounded-sm border border-border bg-surface p-4 space-y-3">
              <div>
                <p className="text-[11px] text-text-dim font-mono uppercase tracking-wider">Headings</p>
                <p className="font-serif text-[20px] text-text mt-1">Bilderberg</p>
              </div>
              <div>
                <p className="text-[11px] text-text-dim font-mono uppercase tracking-wider">Body</p>
                <p className="font-sans text-[14px] text-text mt-1">Satoshi</p>
              </div>
              <div>
                <p className="text-[11px] text-text-dim font-mono uppercase tracking-wider">Monospace</p>
                <p className="font-mono text-[13px] text-text mt-1">JetBrains Mono</p>
              </div>
            </div>
          </motion.div>

          <motion.div variants={item}>
            <Button variant="ghost" size="md" onClick={() => window.history.back()}>
              ← Back to Settings
            </Button>
          </motion.div>
        </motion.div>
      </ConsoleShell>
    </AuthGuard>
  )
}
