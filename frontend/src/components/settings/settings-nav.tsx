'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { User, Palette, CreditCard, Key } from 'lucide-react'

const navItems = [
  { href: '/settings', label: 'Profile', icon: User },
  { href: '/settings/appearance', label: 'Appearance', icon: Palette },
  { href: '/settings/billing', label: 'Billing', icon: CreditCard },
  { href: '#', label: 'API Keys', icon: Key, disabled: true },
]

export function SettingsNav() {
  const pathname = usePathname()

  return (
    <nav className="flex flex-col gap-1">
      {navItems.map((item) => {
        const isActive = pathname === item.href
        return (
          <Link
            key={item.label}
            href={item.disabled ? '#' : item.href}
            aria-disabled={item.disabled}
            tabIndex={item.disabled ? -1 : undefined}
            className={`flex items-center gap-3 px-3 py-2 rounded-md text-[13px] font-medium transition-colors ${
              isActive 
                ? 'bg-ink text-canvas shadow-sm' 
                : item.disabled 
                  ? 'text-muted/50 cursor-not-allowed pointer-events-none' 
                  : 'text-muted hover:text-ink hover:bg-hairline/30'
            }`}
          >
            <item.icon className={`w-4 h-4 ${isActive ? 'text-canvas' : 'text-muted/80'}`} />
            {item.label}
            {item.disabled && (
               <span className="ml-auto text-[9px] uppercase tracking-widest border border-hairline px-1 rounded bg-canvas">Soon</span>
            )}
          </Link>
        )
      })}
    </nav>
  )
}
