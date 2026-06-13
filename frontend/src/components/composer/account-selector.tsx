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
    <div className="space-y-2">
      <label className="text-[14px] font-medium text-ink tracking-wide">
        Account
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md bg-surface-soft px-3 py-2.5 text-[14px] text-ink border-none shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)] focus:bg-canvas focus:outline-none focus:ring-2 focus:ring-ink/20 focus:ring-offset-1 focus:shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] transition-all"
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
