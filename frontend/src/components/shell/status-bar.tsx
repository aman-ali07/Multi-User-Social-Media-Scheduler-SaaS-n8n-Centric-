'use client'

import { motion } from 'framer-motion'

export function StatusBar() {
  const now = new Date()
  const timeStr = now.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })

  return (
    <motion.footer
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.2 }}
      className="h-8 border-t border-border bg-surface flex items-center justify-between px-4"
    >
      <div className="flex items-center gap-4 text-[10px] text-text-dim font-mono uppercase tracking-widest">
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-lime shadow-[0_0_4px_rgba(138,184,42,0.5)]" />
          Live
        </span>
        <span>Queue: 0</span>
      </div>

      <div className="flex items-center gap-4 text-[10px] text-text-dim font-mono">
        <span>Last publish: --</span>
        <span>{timeStr} UTC</span>
      </div>
    </motion.footer>
  )
}
