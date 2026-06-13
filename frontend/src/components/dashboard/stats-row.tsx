'use client'

interface StatProps {
  label: string
  value: string
  trend?: string
  href?: string
}

import Link from 'next/link'

export function StatsRow({ stats }: { stats: StatProps[] }) {
  return (
    <div className="flex items-center gap-12 pb-6 mb-8 overflow-x-auto no-scrollbar">
      {stats.map((s) => {
        const content = (
          <div className="flex flex-col gap-1 min-w-max">
            <p className="text-[12px] text-muted font-bold uppercase tracking-widest">{s.label}</p>
            <div className="flex items-baseline gap-2">
              <span className="font-cal text-[24px] text-ink leading-none tabular-nums tracking-tighter">{s.value}</span>
              {s.trend && (
                <span className={`text-[12px] font-medium tabular-nums ${s.trend.startsWith('+') ? 'text-success' : 'text-error'}`}>
                  {s.trend}
                </span>
              )}
            </div>
          </div>
        )

        return s.href ? (
          <Link key={s.label} href={s.href} className="hover:opacity-80 transition-opacity">
            {content}
          </Link>
        ) : (
          <div key={s.label}>{content}</div>
        )
      })}
    </div>
  )
}
