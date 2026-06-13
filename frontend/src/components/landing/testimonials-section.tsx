'use client'

import { useRef } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const testimonials = [
  {
    name: 'Sarah Chen',
    role: 'Social Media Manager',
    company: 'GrowthLab',
    quote: 'Console eliminated the chaos of managing multiple Facebook and Instagram accounts. The scheduling engine is rock-solid — we went from manual posting to full autopilot in a day.',
    rating: 5,
  },
  {
    name: 'Marcus Williams',
    role: 'Head of Content',
    company: 'Pulse Media',
    quote: 'The telemetry and retry logic alone are worth it. When the Meta API has issues, Console handles it gracefully instead of silently failing.',
    rating: 5,
  },
]

export function TestimonialsSection() {
  const containerRef = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: containerRef.current,
        start: 'top 75%',
      }
    })

    tl.from('.testimonial-header', {
      y: 30,
      opacity: 0,
      duration: 0.8,
      ease: 'power3.out'
    })
    .from('.testimonial-card', {
      y: 40,
      opacity: 0,
      duration: 0.8,
      stagger: 0.2,
      ease: 'power3.out'
    }, '-=0.4')
  }, { scope: containerRef })

  return (
    <section ref={containerRef} className="w-full bg-surface-soft">
      <div className="max-w-6xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <span className="testimonial-header block text-[13px] text-muted font-medium uppercase tracking-wider opacity-0">
            Trusted by teams
          </span>
          <h2 className="testimonial-header block font-cal text-[32px] md:text-[40px] text-ink mt-3 leading-tight tracking-tighter opacity-0">
            Used by content teams
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {testimonials.map((t) => (
            <div key={t.name} className="testimonial-card rounded-lg bg-surface-card p-6 opacity-0">
              <div className="flex items-center gap-1 mb-4">
                {Array.from({ length: t.rating }).map((_, i) => (
                  <svg key={i} className="w-4 h-4 text-badge-orange" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-[16px] text-body leading-relaxed mb-6">
                &ldquo;{t.quote}&rdquo;
              </p>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-badge-violet/20 border border-badge-violet/10 flex items-center justify-center">
                  <span className="text-[12px] font-bold text-badge-violet">
                    {t.name.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
                <div>
                  <p className="text-[14px] font-semibold text-ink">{t.name}</p>
                  <p className="text-[12px] text-muted font-medium">{t.role}, {t.company}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
