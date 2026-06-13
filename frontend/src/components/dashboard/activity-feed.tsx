'use client'

import { motion } from 'framer-motion'

interface ActivityItem {
  action: string
  time: string
  status: 'success' | 'error' | 'retry'
}

import { useState } from 'react'

export function ActivityFeed({ items }: { items: ActivityItem[] }) {
  const [visible, setVisible] = useState(15)
  return (
    <div className="flex flex-col h-full bg-surface-soft border-l border-hairline font-mono text-[12px] p-6 text-muted">
      <div className="flex items-center gap-2 mb-6 pb-4 border-b border-hairline/60">
        <div className="flex items-center justify-center w-2 h-2 rounded-full bg-success/20">
          <div className="w-1 h-1 rounded-full bg-success animate-pulse" />
        </div>
        <span className="uppercase tracking-widest font-bold">System Log</span>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar space-y-1 pb-8">
        {items.slice(0, visible).map((a, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -4 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="flex gap-4 group hover:bg-hairline/30 px-2 py-1 -mx-2 rounded transition-colors"
          >
            <span className="shrink-0 opacity-50">{a.time.split(' ')[0]}</span>
            <div className="flex-1 min-w-0">
              <span className={`mr-2 ${a.status === 'error' ? 'text-error' : a.status === 'retry' ? 'text-badge-orange' : 'text-success'}`}>
                {a.status === 'error' ? '[ERR]' : a.status === 'retry' ? '[WARN]' : '[OK]'}
              </span>
              <span className="text-ink truncate break-all">{a.action}</span>
            </div>
          </motion.div>
        ))}
        {items.length === 0 && (
          <div className="opacity-50">Waiting for events...</div>
        )}
        {visible < items.length && (
          <button 
            onClick={() => setVisible(v => v + 15)} 
            className="w-full text-center mt-4 text-[10px] text-muted hover:text-ink uppercase tracking-widest font-bold transition-colors"
          >
            Show More
          </button>
        )}
      </div>
    </div>
  )
}
