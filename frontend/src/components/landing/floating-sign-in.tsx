'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'

const AUTH_PATHS = ['/auth/login', '/auth/register']

export function FloatingSignIn() {
  const pathname = usePathname()

  if (AUTH_PATHS.includes(pathname)) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.5 }}
      className="fixed top-4 right-4 sm:top-6 sm:right-6 z-50"
    >
      <Link
        href="/auth/login"
        className="inline-flex items-center justify-center h-9 px-4 rounded-sm bg-transparent border border-gold/40 text-gold font-mono text-[11px] uppercase tracking-widest hover:bg-gold/10 transition-colors"
      >
        Sign In
      </Link>
    </motion.div>
  )
}
