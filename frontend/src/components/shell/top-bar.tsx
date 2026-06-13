'use client'

import { motion } from 'framer-motion'
import { useAuth } from '@/hooks/use-auth'
import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Menu, UserCircle, LogOut } from 'lucide-react'

interface TopBarProps {
  onMenuClick?: () => void
}

export function TopBar({ onMenuClick }: TopBarProps) {
  const { user, signOut } = useAuth()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  async function handleSignOut() {
    setDropdownOpen(false)
    await signOut()
    router.push('/')
  }

  return (
    <motion.header
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] as const }}
      className="h-16 border-b border-hairline bg-canvas sticky top-0 flex items-center justify-between px-4 lg:px-6 z-50"
    >
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="lg:hidden text-muted hover:text-ink transition-colors mr-1 flex items-center justify-center w-8 h-8 rounded-md hover:bg-surface-soft"
          aria-label="Open navigation"
        >
          <Menu className="w-4 h-4" />
        </button>
        <span className="text-[14px] text-muted font-medium hidden sm:inline tracking-wide">
          Content Operations
        </span>
        <span className="text-muted text-[10px] font-bold uppercase tracking-widest bg-surface-card rounded-sm px-1.5 py-0.5">
          v0.1
        </span>
      </div>

      <div className="flex items-center gap-5">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-[12px] text-muted font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-success opacity-80" />
            <span className="hidden sm:inline tracking-wide">n8n Engine</span>
          </div>
          <div className="flex items-center gap-1.5 text-[12px] text-muted font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-success opacity-80" />
            <span className="hidden sm:inline tracking-wide">Graph API</span>
          </div>
        </div>

        <div className="w-px h-4 bg-hairline hidden sm:block" />

        <div className="flex items-center relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 hover:bg-surface-soft p-1.5 rounded-md transition-colors cursor-pointer"
          >
            <div className="w-7 h-7 rounded-md bg-surface-strong border border-hairline shadow-sm flex items-center justify-center">
              <span className="text-[12px] text-ink font-bold uppercase">
                {user?.email?.charAt(0) || '?'}
              </span>
            </div>
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-1 w-56 bg-canvas border border-hairline rounded-lg shadow-lg z-50 py-1 overflow-hidden">
              <div className="px-4 py-3 border-b border-hairline">
                <p className="text-[12px] text-muted font-medium uppercase tracking-widest mb-0.5">Signed In As</p>
                <p className="text-[13px] text-ink truncate font-medium">{user?.email || 'Unknown'}</p>
              </div>
              
              <div className="p-1">
                <button
                  className="w-full text-left px-3 py-2 flex items-center gap-2 text-[13px] text-muted hover:bg-surface-soft hover:text-ink transition-colors rounded-md font-medium"
                >
                  <UserCircle className="w-4 h-4" />
                  Profile
                </button>
                <button
                  onClick={handleSignOut}
                  className="w-full text-left px-3 py-2 flex items-center gap-2 text-[13px] text-error hover:bg-error/10 transition-colors rounded-md font-medium"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.header>
  )
}
