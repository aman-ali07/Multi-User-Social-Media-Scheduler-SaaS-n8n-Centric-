'use client'

import { useRef } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const steps = [
  {
    number: '01',
    title: 'Connect Your Accounts',
    description: 'Link your Facebook pages and Instagram business accounts in one click. Console handles the OAuth flow and token refresh automatically.',
  },
  {
    number: '02',
    title: 'Compose Your Content',
    description: 'Write captions, upload media, and preview how your post will look across platforms. Save drafts or schedule for later.',
  },
  {
    number: '03',
    title: 'Publish on Autopilot',
    description: 'Console delivers your content through the Meta Graph API at the scheduled time. Failed posts retry automatically with detailed logs.',
  },
]

export function HowItWorks() {
  const containerRef = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: containerRef.current,
        start: 'top 75%',
      }
    })

    tl.from('.how-header', {
      y: 30,
      opacity: 0,
      duration: 0.8,
      stagger: 0.15,
      ease: 'power3.out'
    })
    .from('.how-step', {
      y: 40,
      opacity: 0,
      duration: 0.8,
      stagger: 0.15,
      ease: 'power3.out'
    }, '-=0.4')
  }, { scope: containerRef })

  return (
    <section ref={containerRef} className="w-full max-w-6xl mx-auto px-6 py-24">
      <div className="text-center mb-20">
        <span className="how-header block text-[13px] text-muted font-medium uppercase tracking-wider opacity-0">
          How It Works
        </span>
        <h2 className="how-header block font-cal text-[32px] md:text-[40px] text-ink mt-3 leading-tight tracking-tighter opacity-0">
          Three steps to go live
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
        {steps.map((step, i) => (
          <div key={step.number} className="how-step relative opacity-0">
            <div className="flex items-center gap-4 mb-5">
              <span className="text-[40px] font-cal text-muted/30 leading-none">{step.number}</span>
              {i < steps.length - 1 && (
                <div className="hidden md:block flex-1 h-px bg-hairline" />
              )}
            </div>
            <h3 className="text-[18px] text-ink font-medium tracking-wide mb-2">
              {step.title}
            </h3>
            <p className="text-muted text-[15px] font-medium leading-relaxed">{step.description}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
