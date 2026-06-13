'use client'

import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { getScheduledQueueCount, getLastPublishDate } from '@/lib/queries'

export function StatusBar() {
  const { user } = useAuth()
  const [queue, setQueue] = useState<number | null>(null)
  const [lastPublish, setLastPublish] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return

    const fetchStats = async () => {
      const queueCount = await getScheduledQueueCount(user.id)
      setQueue(queueCount)

      const lastDate = await getLastPublishDate(user.id)
      if (lastDate) {
        const d = new Date(lastDate)
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
      className="h-8 border-t border-hairline bg-surface-soft flex items-center justify-between px-3 lg:px-4"
    >
      <div className="flex items-center gap-3 lg:gap-4 text-[11px] text-muted font-medium uppercase tracking-wider">
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-success shadow-sm" />
          <span className="hidden sm:inline">Live</span>
        </span>
        <span>Q: {queue ?? '\u2014'}</span>
      </div>

      <div className="flex items-center gap-3 lg:gap-4 text-[11px] text-muted font-mono">
        <span className="hidden md:inline">Last: {lastPublish ?? '\u2014'}</span>
        <span>{timeStr}</span>
      </div>
    </motion.footer>
  )
}
