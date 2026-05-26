'use client'

import { motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'

const stats = [
  { label: 'Posts Published', value: 1247, suffix: '+' },
  { label: 'Accounts Connected', value: 89, suffix: '+' },
  { label: 'Avg. Uptime', value: 99.9, suffix: '%' },
  { label: 'Retries Saved', value: 342, suffix: '+' },
]

function AnimatedNumber({ target, suffix }: { target: number; suffix: string }) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const hasAnimated = useRef(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true
          const duration = 1500
          const steps = 30
          const interval = duration / steps
          let current = 0
          const timer = setInterval(() => {
            current++
            const progress = current / steps
            const eased = 1 - Math.pow(1 - progress, 3)
            setCount(Math.round(eased * target))
            if (current >= steps) {
              clearInterval(timer)
              setCount(target)
            }
          }, interval)
        }
      },
      { threshold: 0.5 },
    )

    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [target])

  return <span ref={ref}>{count}{suffix}</span>
}

export function StatsBar() {
  return (
    <section className="w-full border-y border-border bg-surface/80">
      <div className="max-w-5xl mx-auto px-6 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="text-center"
            >
              <p className="font-serif text-[36px] text-gold leading-none mb-2">
                <AnimatedNumber target={stat.value} suffix={stat.suffix} />
              </p>
              <p className="text-[11px] text-text-muted font-mono uppercase tracking-wider">
                {stat.label}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
