'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'

interface LeftNavProps {
  mobileOpen?: boolean
  onMobileClose?: () => void
}

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: '◈' },
  { href: '/composer', label: 'Compose', icon: '◇' },
  { href: '/calendar', label: 'Schedule', icon: '☰' },
  { href: '/posts', label: 'Posts', icon: '☐' },
  { href: '/media', label: 'Media', icon: '▣' },
  { href: '/accounts', label: 'Accounts', icon: '◎' },
  { href: '/logs', label: 'Activity', icon: '⏣' },
  { href: '/settings', label: 'Settings', icon: '⚙' },
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.04, delayChildren: 0.1 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, x: -12 },
  visible: { opacity: 1, x: 0 },
}

export function LeftNav({ mobileOpen, onMobileClose }: LeftNavProps) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  const navContent = (
    <motion.nav
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] as const }}
      className={cn(
        'flex flex-col border-r border-border bg-surface h-full transition-all duration-300',
        collapsed ? 'w-16' : 'w-56',
      )}
    >
      <div className="flex items-center gap-2 px-4 h-14 border-b border-border">
        <span className="text-gold text-lg leading-none">◈</span>
        {!collapsed && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="font-serif text-text text-lg tracking-wide"
          >
            Console
          </motion.span>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="ml-auto text-text-dim hover:text-text-muted transition-colors text-xs"
        >
          {collapsed ? '▶' : '◀'}
        </button>
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="flex-1 flex flex-col gap-0.5 p-2"
      >
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <motion.div key={item.href} variants={itemVariants}>
              <Link
                href={item.href}
                onClick={onMobileClose}
                className={cn(
                  'flex items-center gap-3 rounded-sm px-3 h-9 text-sm transition-all duration-150',
                  'hover:bg-surface-2 group relative',
                  isActive
                    ? 'text-gold bg-gold/5 border-l-2 border-gold'
                    : 'text-text-muted border-l-2 border-transparent hover:text-text',
                )}
              >
                <span className={cn(
                  'text-base w-5 text-center',
                  isActive ? 'text-gold' : 'text-text-dim group-hover:text-text-muted',
                )}>
                  {item.icon}
                </span>
                {!collapsed && (
                  <span className="font-sans tracking-wide text-[13px]">
                    {item.label}
                  </span>
                )}
              </Link>
            </motion.div>
          )
        })}
      </motion.div>

      <div className="p-2 border-t border-border">
        <div className={cn(
          'flex items-center gap-2 rounded-sm px-3 h-9',
          collapsed && 'justify-center',
        )}>
          <div className="w-2 h-2 rounded-full bg-lime shadow-[0_0_6px_rgba(138,184,42,0.4)]" />
          {!collapsed && (
            <span className="text-[11px] text-text-dim font-mono uppercase tracking-wider">
              System Online
            </span>
          )}
        </div>
      </div>
    </motion.nav>
  )

  return (
    <>
      <div className="hidden lg:flex h-full">
        {navContent}
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-bg/60 backdrop-blur-sm"
            onClick={onMobileClose}
          />
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] as const }}
            className="relative h-full w-56 shadow-xl"
          >
            {navContent}
          </motion.div>
        </div>
      )}
    </>
  )
}
