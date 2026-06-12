'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { ConsoleShell } from '@/components/shell/console-shell'
import { AuthGuard } from '@/components/auth/auth-guard'
import { ActivityTimeline } from '@/components/logs/activity-timeline'
import { SkeletonList } from '@/components/ui/skeleton'
import { useAuth } from '@/hooks/use-auth'
import type { PostLog } from '@/types/database'

const container = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
}

const item = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
}

export default function LogsPage() {
  const { user } = useAuth()
  const [logs, setLogs] = useState<PostLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async (signal?: AbortSignal) => {
    if (!user) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'logs' }),
        signal,
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }))
        throw new Error(err.error || `Failed (${res.status})`)
      }
      const data = await res.json()
      setLogs((data.logs || []) as PostLog[])
    } catch (err: unknown) {
      if ((err as Error)?.name === 'AbortError') return
      setError(err instanceof Error ? err.message : 'Failed to load logs')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    const abort = new AbortController()
    load(abort.signal)
    return () => abort.abort()
  }, [load])

  return (
    <AuthGuard>
      <ConsoleShell>
        <motion.div variants={container} initial="hidden" animate="visible" className="p-4 sm:p-6 space-y-6 max-w-4xl">
          <motion.div variants={item}>
            <div className="flex items-center gap-3">
              <h1 className="font-serif text-[28px] text-text tracking-tight">Activity Log</h1>
              <div className="flex items-center gap-1.5 text-[10px] text-lime font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-lime animate-pulse shadow-[0_0_4px_rgba(138,184,42,0.5)]" />
                Live
              </div>
            </div>
            <p className="text-text-muted text-sm font-sans mt-1">Post logs and workflow runs</p>
          </motion.div>

          {error && (
            <motion.p variants={item} className="text-red text-[12px] font-mono">{error}</motion.p>
          )}

          {loading ? (
            <motion.div variants={item}>
              <SkeletonList rows={5} />
            </motion.div>
          ) : logs.length === 0 ? (
            <motion.div variants={item} className="rounded-sm border border-border bg-surface p-8 text-center">
              <p className="text-text-dim text-sm font-sans">No activity recorded yet.</p>
            </motion.div>
          ) : (
            <motion.div variants={item}>
              <ActivityTimeline logs={logs} />
            </motion.div>
          )}
        </motion.div>
      </ConsoleShell>
    </AuthGuard>
  )
}
