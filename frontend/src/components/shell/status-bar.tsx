'use client'

import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/use-auth'

export function StatusBar() {
  const { user } = useAuth()
  const [queue, setQueue] = useState<number | null>(null)
  const [lastPublish, setLastPublish] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return

    const fetchStats = async () => {
      const { count: queueCount } = await supabase
        .from('scheduled_posts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('status', 'scheduled')
        .is('deleted_at', null)

      if (queueCount !== null) setQueue(queueCount)

      const { data: last } = await supabase
        .from('scheduled_posts')
        .select('published_at')
        .eq('user_id', user.id)
        .eq('status', 'published')
        .not('published_at', 'is', null)
        .order('published_at', { ascending: false })
        .limit(1)

      if (last && last.length > 0) {
        const d = new Date(last[0].published_at)
        setLastPublish(d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }))
      }
    }

    fetchStats()
    const interval = setInterval(fetchStats, 30000)
    return () => clearInterval(interval)
  }, [user])

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
      className="h-8 border-t border-border bg-surface flex items-center justify-between px-3 lg:px-4"
    >
      <div className="flex items-center gap-3 lg:gap-4 text-[10px] text-text-dim font-mono uppercase tracking-widest">
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-lime shadow-[0_0_4px_rgba(138,184,42,0.5)]" />
          <span className="hidden sm:inline">Live</span>
        </span>
        <span>Q: {queue ?? '—'}</span>
      </div>

      <div className="flex items-center gap-3 lg:gap-4 text-[10px] text-text-dim font-mono">
        <span className="hidden md:inline">Last: {lastPublish ?? '—'}</span>
        <span>{timeStr}</span>
      </div>
    </motion.footer>
  )
}
