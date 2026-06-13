'use client'

import { useRef } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export function Footer() {
  const ref = useRef<HTMLElement>(null)

  useGSAP(() => {
    if (!ref.current) return
    gsap.from(ref.current, {
      opacity: 0,
      duration: 0.8,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: ref.current,
        start: 'top 95%',
      }
    })
  }, [])

  return (
    <footer
      ref={ref}
      className="w-full bg-surface-dark"
    >
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          <div>
            <div className="flex items-center gap-2 mb-6">
              <span className="text-on-dark text-lg font-bold">◈</span>
              <span className="font-cal text-on-dark text-lg tracking-tight">Console</span>
              <span className="text-on-dark-soft text-[11px] font-medium uppercase tracking-wider bg-surface-dark-elevated rounded-sm px-1.5 py-0.5 ml-2">
                v0.1
              </span>
            </div>
            <p className="text-[13px] text-on-dark-soft font-medium leading-relaxed max-w-xs">
              Content orchestration platform for teams that treat distribution as an engineering problem.
            </p>
          </div>

          <div>
            <h4 className="text-[11px] text-on-dark font-bold uppercase tracking-widest mb-4">Product</h4>
            <ul className="space-y-3">
              <li><a href="#" className="text-[14px] text-on-dark-soft font-medium">Features</a></li>
              <li><a href="#" className="text-[14px] text-on-dark-soft font-medium">Documentation</a></li>
              <li><a href="#" className="text-[14px] text-on-dark-soft font-medium">Status</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-[11px] text-on-dark font-bold uppercase tracking-widest mb-4">Resources</h4>
            <ul className="space-y-3">
              <li><a href="#" className="text-[14px] text-on-dark-soft font-medium">API Reference</a></li>
              <li><a href="#" className="text-[14px] text-on-dark-soft font-medium">GitHub</a></li>
              <li><a href="#" className="text-[14px] text-on-dark-soft font-medium">Changelog</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-[11px] text-on-dark font-bold uppercase tracking-widest mb-4">Company</h4>
            <ul className="space-y-3">
              <li><a href="#" className="text-[14px] text-on-dark-soft font-medium">Privacy</a></li>
              <li><a href="#" className="text-[14px] text-on-dark-soft font-medium">Terms</a></li>
              <li><a href="#" className="text-[14px] text-on-dark-soft font-medium">Contact</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-surface-dark-elevated pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-[13px] text-on-dark-soft font-medium">
            &copy; {new Date().getFullYear()} Console. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
