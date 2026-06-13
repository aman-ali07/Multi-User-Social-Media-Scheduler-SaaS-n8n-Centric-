'use client'

import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

interface GlobalStat {
  label: string
  value: number
  suffix: string
}

const fallbackStats: GlobalStat[] = [
  { label: 'Posts Published', value: 12500, suffix: '+' },
  { label: 'Accounts Connected', value: 3400, suffix: '+' },
  { label: 'Avg. Uptime', value: 99, suffix: '%' },
  { label: 'Active Users', value: 2800, suffix: '+' },
]

function AnimatedNumber({ target, suffix }: { target: number; suffix: string }) {
  const ref = useRef<HTMLSpanElement>(null)

  useGSAP(() => {
    if (!ref.current) return
    
    const obj = { val: 0 }
    
    gsap.to(obj, {
      val: target,
      duration: 2,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: ref.current,
        start: 'top 85%',
      },
      onUpdate: () => {
        if (ref.current) {
          ref.current.innerText = Math.round(obj.val).toLocaleString() + suffix
        }
      }
    })
  }, [target])

  return <span ref={ref}>0{suffix}</span>
}

export function StatsBar() {
  const [stats, setStats] = useState<GlobalStat[]>(fallbackStats)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch('/api/stats/global')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) setStats(data)
      })
      .catch(() => {})
  }, [])

  useGSAP(() => {
    gsap.from('.stat-item', {
      y: 30,
      opacity: 0,
      duration: 0.8,
      stagger: 0.1,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: containerRef.current,
        start: 'top 85%',
      }
    })
  }, { scope: containerRef })

  return (
    <section ref={containerRef} className="w-full border-y border-hairline bg-surface-soft">
      <div className="max-w-6xl mx-auto px-6 py-24">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat) => (
            <div key={stat.label} className="stat-item text-center opacity-0">
              <p className="font-cal text-[40px] text-ink leading-none mb-3 tracking-tighter tabular-nums">
                <AnimatedNumber target={stat.value} suffix={stat.suffix} />
              </p>
              <p className="text-[13px] text-muted font-medium uppercase tracking-wide">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
