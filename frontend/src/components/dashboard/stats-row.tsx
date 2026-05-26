'use client'

import { motion } from 'framer-motion'

const item = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] as const } },
}

interface StatCardProps {
  label: string
  value: string
  trend?: string
  color: string
}

const colorMap: Record<string, string> = {
  gold: 'border-gold/20 text-gold',
  lime: 'border-lime/20 text-lime',
  red: 'border-red/20 text-red',
  steel: 'border-steel/20 text-steel',
}

function StatCard({ label, value, trend, color }: StatCardProps) {
  return (
    <motion.div variants={item} className="flex-1 min-w-[160px] rounded-sm border border-border bg-surface p-4">
      <p className="text-[11px] text-text-muted font-mono uppercase tracking-wider">{label}</p>
      <div className="flex items-baseline gap-2 mt-2">
        <span className="font-serif text-[32px] text-text leading-none">{value}</span>
        {trend && (
          <span className={`text-[12px] font-mono ${trend.startsWith('+') ? 'text-lime' : 'text-red'}`}>
            {trend}
          </span>
        )}
      </div>
      <div className={`mt-3 h-px ${colorMap[color]?.split(' ')[0] ? `bg-${color}/10` : 'bg-border'}`} />
    </motion.div>
  )
}

interface StatsRowProps {
  stats: StatCardProps[]
}

export function StatsRow({ stats }: StatsRowProps) {
  return (
    <div className="flex flex-wrap gap-4">
      {stats.map((s) => (
        <StatCard key={s.label} {...s} />
      ))}
    </div>
  )
}
