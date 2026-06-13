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

import gsap from 'gsap'
import { useRef, useEffect, useState } from 'react'

function TimelineBar({ label, count, max }: VelocityDay) {
  const pct = (count / max) * 100
  const tooltipRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isHovered, setIsHovered] = useState(false)

  useEffect(() => {
    if (!tooltipRef.current || !containerRef.current) return
    const xTo = gsap.quickTo(tooltipRef.current, 'x', { duration: 0.4, ease: 'power3.out' })
    const yTo = gsap.quickTo(tooltipRef.current, 'y', { duration: 0.4, ease: 'power3.out' })

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      xTo(e.clientX - rect.left)
      yTo(e.clientY - rect.top - 24)
    }

    const el = containerRef.current
    el.addEventListener('mousemove', handleMouseMove)
    return () => el.removeEventListener('mousemove', handleMouseMove)
  }, [])

  return (
    <div 
      ref={containerRef}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="flex items-center gap-3 relative group"
    >
      <div 
        ref={tooltipRef}
        className={`absolute top-0 left-0 -ml-4 pointer-events-none z-50 bg-ink text-canvas text-[11px] font-medium px-2 py-1 rounded shadow-lg transition-opacity duration-200 ${isHovered ? 'opacity-100' : 'opacity-0'}`}
      >
        {count} posts scheduled
      </div>
      
      <span className="text-[12px] text-muted font-medium w-16 shrink-0 transition-colors group-hover:text-ink">{label}</span>
      <div className="flex-1 h-2.5 bg-hairline rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="h-full rounded-full bg-ink"
        />
      </div>
      <span className="text-[12px] text-muted font-medium tabular-nums w-6 text-right transition-colors group-hover:text-ink">{count}</span>
    </div>
  )
}

export function PublishingVelocity({ days }: PublishingVelocityProps) {
  return (
    <div className="space-y-4 h-full flex flex-col">
      <h2 className="text-[13px] text-ink font-medium tracking-wide shrink-0">
        Publishing Velocity
      </h2>
      <div className="rounded-lg bg-surface-card p-6 space-y-4 flex-1">
        {days.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <p className="text-muted text-[14px] font-medium">No publishing data yet</p>
          </div>
        ) : (
          days.map((d) => (
            <TimelineBar key={d.label} {...d} />
          ))
        )}
      </div>
    </div>
  )
}
