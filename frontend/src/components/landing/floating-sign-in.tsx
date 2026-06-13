'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { useRef } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'

const AUTH_PATHS = ['/auth/login', '/auth/register']

export function FloatingSignIn() {
  const pathname = usePathname()
  const ref = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    if (!ref.current) return
    gsap.from(ref.current, {
      y: -8,
      opacity: 0,
      duration: 0.4,
      delay: 0.5,
      ease: 'power2.out'
    })
  }, [pathname])

  if (AUTH_PATHS.includes(pathname)) return null

  return (
    <div
      ref={ref}
      className="fixed top-4 right-4 sm:top-6 sm:right-6 z-50 opacity-100"
    >
      <Link
        href="/auth/login"
        className="inline-flex items-center justify-center h-10 px-5 rounded-md bg-canvas border border-hairline text-ink font-medium text-[14px]"
      >
        Sign In
      </Link>
    </div>
  )
}
