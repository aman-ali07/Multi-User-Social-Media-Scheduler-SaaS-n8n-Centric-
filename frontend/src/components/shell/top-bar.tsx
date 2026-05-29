'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/use-auth'

interface TopBarProps {
  onMenuClick?: () => void
}

export function TopBar({ onMenuClick }: TopBarProps) {
  const { user } = useAuth()

  return (
    <motion.header
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] as const }}
      className="h-14 border-b border-border bg-surface flex items-center justify-between px-4 lg:px-6"
    >
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="lg:hidden text-text-dim hover:text-text-muted transition-colors text-sm mr-1"
          aria-label="Open navigation"
        >
          ☰
        </button>
        <span className="text-[13px] text-text-muted font-sans tracking-wide hidden sm:inline">
          Content Operations
        </span>
        <span className="text-text-dim text-[10px] font-mono uppercase tracking-widest border border-border rounded-sm px-2 py-0.5">
          v0.1
        </span>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-[11px] text-text-dim font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-lime shadow-[0_0_4px_rgba(138,184,42,0.5)]" />
            <span className="hidden sm:inline">n8n</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-text-dim font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-lime shadow-[0_0_4px_rgba(138,184,42,0.5)]" />
            <span className="hidden sm:inline">API</span>
          </div>
        </div>

        <div className="w-px h-6 bg-border hidden sm:block" />

        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-sm bg-surface-3 border border-border flex items-center justify-center">
            <span className="text-[11px] text-text-muted font-sans uppercase">
              {user?.email?.charAt(0) || '?'}
            </span>
          </div>
        </div>
      </div>
    </motion.header>
  )
}
