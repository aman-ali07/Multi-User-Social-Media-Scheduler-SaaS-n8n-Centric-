'use client'

import { useRef } from 'react'
import Link from 'next/link'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Button } from '@/components/ui/button'

gsap.registerPlugin(ScrollTrigger)

export function CTASection() {
  const ref = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    gsap.from('.cta-content', {
      y: 30,
      opacity: 0,
      duration: 0.8,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: ref.current,
        start: 'top 80%',
      }
    })
  }, { scope: ref })

  return (
    <section ref={ref} className="w-full max-w-6xl mx-auto px-6 py-24">
      <div className="cta-content rounded-lg bg-surface-card p-12 text-center opacity-0">
        <h2 className="font-cal text-[28px] md:text-[28px] text-ink leading-tight tracking-tighter">
          Ready to orchestrate your content?
        </h2>
        <p className="text-[16px] text-body mt-4 max-w-md mx-auto">
          Connect your accounts, compose your posts, and let Console handle distribution.
        </p>
        <div className="mt-8">
          <Link href="/auth/register">
            <Button variant="primary" size="lg">
              Get Started Free
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}
