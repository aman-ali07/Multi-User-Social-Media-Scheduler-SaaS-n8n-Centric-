'use client'

import { motion } from 'framer-motion'

interface ActivityItem {
  action: string
  time: string
  status: 'success' | 'error' | 'retry'
}

interface ActivityFeedProps {
  items: ActivityItem[]
}

function ActivityDot({ status }: { status: string }) {
  const colors: Record<string, string> = {
    success: 'bg-lime shadow-[0_0_4px_rgba(138,184,42,0.5)]',
    error: 'bg-red shadow-[0_0_4px_rgba(217,56,74,0.5)]',
    retry: 'bg-orange shadow-[0_0_4px_rgba(217,90,32,0.5)]',
  }
  return <span className={`w-1.5 h-1.5 rounded-full shrink-0 mt-1.5 ${colors[status] || 'bg-text-dim'}`} />
}

export function ActivityFeed({ items }: ActivityFeedProps) {
  return (
    <div className="p-4 space-y-4">
      <h3 className="text-[11px] text-text-muted font-mono uppercase tracking-wider">
        Activity Feed
      </h3>
      <div className="space-y-0">
        {items.map((a, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 + i * 0.04 }}
            className="flex gap-3 py-2.5 border-b border-border last:border-0"
          >
            <ActivityDot status={a.status} />
            <div className="flex-1 min-w-0">
              <p className="text-[12px] text-text font-sans truncate">{a.action}</p>
              <p className="text-[10px] text-text-dim font-mono mt-0.5">{a.time}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
