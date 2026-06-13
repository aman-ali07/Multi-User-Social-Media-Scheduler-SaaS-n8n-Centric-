'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { LayoutDashboard, PenSquare, CalendarDays, Grid3X3, Image as ImageIcon, Users, Activity, Settings, ChevronLeft, ChevronRight, ChevronsUpDown, LogOut } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'

interface LeftNavProps {
  mobileOpen?: boolean
  onMobileClose?: () => void
}

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/composer', label: 'Composer', icon: PenSquare },
  { href: '/calendar', label: 'Schedule', icon: CalendarDays },
  { href: '/posts', label: 'Posts', icon: Grid3X3 },
  { href: '/media', label: 'Media', icon: ImageIcon },
  { href: '/accounts', label: 'Accounts', icon: Users },
  { href: '/logs', label: 'Activity', icon: Activity },
  { href: '/settings', label: 'Settings', icon: Settings },
]

export function LeftNav({ mobileOpen, onMobileClose }: LeftNavProps) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const { user, signOut } = useAuth()

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
      initial={false}
      className={cn(
        'flex flex-col border-r border-hairline bg-surface-soft h-full transition-all duration-300 relative',
        collapsed ? 'w-16' : 'w-56',
      )}
    >
      <div className="flex items-center gap-3 px-4 h-16 border-b border-hairline relative z-10 bg-surface-soft">
        <div className="w-6 h-6 rounded-md flex items-center justify-center bg-ink shrink-0 shadow-sm border border-ink/20">
          <span className="text-canvas text-[11px] font-bold">C</span>
        </div>
        {!collapsed && (
          <div className="flex flex-col flex-1 min-w-0 overflow-hidden cursor-pointer group">
            <span className="font-cal text-ink text-[15px] tracking-tight leading-tight truncate">
              Workspace
            </span>
            <span className="text-[11px] text-muted font-medium truncate group-hover:text-ink transition-colors">
              {user?.email || 'Loading...'}
            </span>
          </div>
        )}
        {!collapsed && (
          <ChevronsUpDown className="w-3.5 h-3.5 text-muted shrink-0" />
        )}
      </div>

      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 z-20 w-6 h-6 rounded-full border border-hairline bg-canvas shadow-sm flex items-center justify-center text-muted hover:text-ink transition-colors"
      >
        {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
      </button>

      <div className="flex-1 flex flex-col gap-1 p-3 overflow-y-auto no-scrollbar pt-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onMobileClose}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 h-9 text-sm transition-all duration-150 group',
                isActive
                  ? 'bg-canvas text-ink shadow-[inset_0_1px_2px_rgba(0,0,0,0.02),0_1px_2px_rgba(0,0,0,0.04)] border border-hairline font-semibold'
                  : 'text-muted hover:bg-black/5 hover:text-ink font-medium border border-transparent',
              )}
            >
              <item.icon className={cn(
                'w-[18px] h-[18px] shrink-0',
                isActive ? 'text-ink' : 'text-muted group-hover:text-ink',
              )} />
              {!collapsed && (
                <span className="tracking-wide text-[13px] whitespace-nowrap">
                  {item.label}
                </span>
              )}
            </Link>
          )
        })}
      </div>

      <div className="p-4 border-t border-hairline bg-surface-soft">
        <div className={cn(
          'flex items-center gap-2 rounded-md h-8 mb-2',
          collapsed && 'justify-center',
        )}>
          <div className="w-2 h-2 rounded-full bg-success/20 flex items-center justify-center shrink-0">
            <div className="w-1 h-1 rounded-full bg-success" />
          </div>
          {!collapsed && (
            <span className="text-[12px] text-muted font-medium whitespace-nowrap">
              Operational
            </span>
          )}
        </div>
        
        <button
          onClick={() => signOut().then(() => window.location.href = '/')}
          className={cn(
            'flex items-center gap-3 rounded-md h-9 text-sm w-full transition-all duration-150 group text-muted hover:bg-black/5 hover:text-ink font-medium',
            collapsed ? 'justify-center px-0' : 'px-3',
          )}
        >
          <LogOut className="w-[18px] h-[18px] shrink-0 text-muted group-hover:text-ink" />
          {!collapsed && (
            <span className="tracking-wide text-[13px] whitespace-nowrap">
              Sign Out
            </span>
          )}
        </button>
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
            className="absolute inset-0 bg-ink/20 backdrop-blur-sm"
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
