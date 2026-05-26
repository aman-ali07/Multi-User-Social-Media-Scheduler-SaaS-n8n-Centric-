'use client'

import type { SocialAccount } from '@/types/database'

interface AccountSelectorProps {
  accounts: SocialAccount[]
  value: string
  onChange: (value: string) => void
}

export function AccountSelector({ accounts, value, onChange }: AccountSelectorProps) {
  if (accounts.length === 0) return null

  return (
    <div className="space-y-1.5">
      <label className="text-[12px] text-text-dim font-mono uppercase tracking-wider">
        Account
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-sm border border-border bg-surface-2 px-3 py-2 text-sm text-text focus:outline-none focus:ring-1 focus:ring-gold/50 font-sans"
      >
        <option value="">Select account...</option>
        {accounts.map((a) => (
          <option key={a.id} value={a.id}>
            {a.page_name || a.page_id} ({a.platform})
          </option>
        ))}
      </select>
    </div>
  )
}
