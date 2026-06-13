'use client'

import { useState, useRef, useEffect } from 'react'
import { LeftNav } from './left-nav'
import { TopBar } from './top-bar'
import { StatusBar } from './status-bar'
import { PageTransition } from '@/components/providers/page-transition'
import gsap from 'gsap'
import { CustomEase } from 'gsap/CustomEase'

// Register CustomEase and create our engineered easing curve
if (typeof window !== 'undefined') {
  gsap.registerPlugin(CustomEase)
  CustomEase.create('engineered', '0.25, 0.1, 0.25, 1')
}

interface ConsoleShellProps {
  children: React.ReactNode
  rightPanel?: React.ReactNode
}

export function ConsoleShell({ children, rightPanel }: ConsoleShellProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const shellRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // The OS Boot Sequence
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'engineered', duration: 0.6 } })
      
      // 1. Structural hairlines & base layout snap in
      tl.fromTo('.gsap-structure', 
        { opacity: 0, scale: 0.98 }, 
        { opacity: 1, scale: 1, stagger: 0.05 }
      )
      
      // 2. Data/Content slides up rigidly
      tl.fromTo('.gsap-content', 
        { y: 12, opacity: 0 }, 
        { y: 0, opacity: 1, stagger: 0.04 },
        '-=0.4'
      )
    }, shellRef)

    return () => ctx.revert()
  }, [])

  return (
    <div ref={shellRef} className="flex h-screen overflow-hidden bg-canvas">
      <div className="gsap-structure opacity-0 z-20">
        <LeftNav mobileOpen={mobileNavOpen} onMobileClose={() => setMobileNavOpen(false)} />
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        <div className="gsap-structure opacity-0 z-10 relative">
          <TopBar onMenuClick={() => setMobileNavOpen(true)} />
        </div>

        <main className="flex-1 overflow-auto scrollbar-custom">
          <div className="flex flex-col lg:flex-row h-full">
            <PageTransition>
              <div className="flex-1 min-w-0 gsap-content opacity-0">
                {children}
              </div>
            </PageTransition>
            {rightPanel && (
              <aside className="lg:w-[320px] xl:w-[380px] border-t lg:border-t-0 lg:border-l border-hairline bg-surface-card overflow-y-auto flex-shrink-0 gsap-structure opacity-0">
                {rightPanel}
              </aside>
            )}
          </div>
        </main>

        <div className="gsap-structure opacity-0 relative z-10">
          <StatusBar />
        </div>
      </div>
    </div>
  )
}
