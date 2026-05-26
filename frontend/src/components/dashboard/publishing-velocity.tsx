'use client'

import { motion } from 'framer-motion'

interface VelocityDay {
  label: string
  count: number
  max: number
}

interface PublishingVelocityProps {
  days: VelocityDay[]
}

function TimelineBar({ label, count, max }: VelocityDay) {
  const pct = (count / max) * 100
  return (
    <div className="flex items-center gap-3">
      <span className="text-[11px] text-text-muted font-mono w-16 shrink-0">{label}</span>
      <div className="flex-1 h-2 bg-surface-2 rounded-sm overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="h-full rounded-sm bg-gold/60"
        />
      </div>
      <span className="text-[11px] text-text-muted font-mono w-6 text-right">{count}</span>
    </div>
  )
}

export function PublishingVelocity({ days }: PublishingVelocityProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-[13px] text-text-muted font-mono uppercase tracking-wider">
        Publishing Velocity
      </h2>
      <div className="rounded-sm border border-border bg-surface p-4 space-y-3">
        {days.map((d) => (
          <TimelineBar key={d.label} {...d} />
        ))}
      </div>
    </div>
  )
}
