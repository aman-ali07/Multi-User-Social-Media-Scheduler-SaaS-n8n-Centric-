'use client'

import { useRef, useEffect, ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import gsap from 'gsap'

export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const ctx = gsap.context(() => {
      gsap.fromTo(containerRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.15, ease: 'power2.out' }
      )
    }, containerRef)

    return () => ctx.revert()
  }, [pathname])

  return (
    <div ref={containerRef} className="min-h-0 flex-1 flex flex-col">
      {children}
    </div>
  )
}
