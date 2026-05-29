'use client'

import { motion } from 'framer-motion'

const item = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] as const } },
}

const colors = ['gold', 'lime', 'red', 'steel'] as const
type StatColor = typeof colors[number]

interface StatCardProps {
  label: string
  value: string
  trend?: string
  color: StatColor
}

const barColors: Record<StatColor, string> = {
  gold: 'bg-gold/10',
  lime: 'bg-lime/10',
  red: 'bg-red/10',
  steel: 'bg-steel/10',
}

function StatCard({ label, value, trend, color }: StatCardProps) {
  return (
    <motion.div variants={item} className="rounded-sm border border-border bg-surface p-3 lg:p-4">
      <p className="text-[11px] text-text-muted font-mono uppercase tracking-wider">{label}</p>
      <div className="flex items-baseline gap-2 mt-2">
        <span className="font-serif text-[24px] sm:text-[32px] text-text leading-none">{value}</span>
        {trend && (
          <span className={`text-[12px] font-mono ${trend.startsWith('+') ? 'text-lime' : 'text-red'}`}>
            {trend}
          </span>
        )}
      </div>
      <div className={`mt-3 h-px ${barColors[color] || 'bg-border'}`} />
    </motion.div>
  )
}

interface StatsRowProps {
  stats: StatCardProps[]
}

export function StatsRow({ stats }: StatsRowProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
      {stats.map((s) => (
        <StatCard key={s.label} {...s} />
      ))}
    </div>
  )
}
