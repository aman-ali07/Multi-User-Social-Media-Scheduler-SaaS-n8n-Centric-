'use client'

import { useRef } from 'react'
import { FeatureCard } from './feature-card'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const features = [
  {
    icon: 'layers',
    title: 'Multi-Platform Orchestration',
    description: 'Manage Facebook Pages and Instagram Business accounts from a single console. One interface, two platforms, consistent branding.',
  },
  {
    icon: 'clock',
    title: 'Intelligent Scheduling',
    description: 'Set your publish times and let Console handle the rest. Automatic retry with exponential backoff when things go wrong.',
  },
  {
    icon: 'activity',
    title: 'Real-Time Monitoring',
    description: 'Detailed activity logs, token health checks, and failure diagnostics. Know exactly what happened and when.',
  },
]

export function FeaturesSection() {
  const containerRef = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: containerRef.current,
        start: 'top 75%',
      }
    })

    tl.from('.feature-header', {
      y: 30,
      opacity: 0,
      duration: 0.8,
      stagger: 0.15,
      ease: 'power3.out'
    })
    .from('.feature-card', {
      y: 40,
      opacity: 0,
      duration: 0.8,
      stagger: 0.15,
      ease: 'power3.out'
    }, '-=0.4')
  }, { scope: containerRef })

  return (
    <section ref={containerRef} className="w-full max-w-6xl mx-auto px-6 py-24">
      <div className="text-center mb-16">
        <span className="feature-header block text-[13px] text-muted font-medium uppercase tracking-wider opacity-0">Features</span>
        <h2 className="feature-header block font-cal text-[32px] md:text-[40px] text-ink mt-3 leading-tight tracking-tighter opacity-0">
          Everything you need
        </h2>
        <p className="feature-header block text-muted text-[16px] font-medium mt-4 max-w-md mx-auto opacity-0">
          Built for content teams who need reliability without the complexity.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {features.map((f) => (
          <FeatureCard key={f.title} {...f} />
        ))}
      </div>
    </section>
  )
}
