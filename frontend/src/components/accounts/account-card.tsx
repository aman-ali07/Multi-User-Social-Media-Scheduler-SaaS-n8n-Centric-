'use client'

import { Badge } from '@/components/ui/badge'
import type { SocialAccount } from '@/types/database'

interface AccountCardProps {
  account: SocialAccount
}

export function AccountCard({ account }: AccountCardProps) {
  return (
    <div className="rounded-sm border border-border bg-surface p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div className="flex items-center gap-4">
        <span className="text-gold text-lg shrink-0">◎</span>
        <div className="min-w-0">
          <p className="text-text font-sans text-[14px] truncate">{account.page_name || account.page_id}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[10px] text-text-dim font-mono uppercase">
              {account.platform}
            </span>
            {account.ig_username && (
              <span className="text-[10px] text-text-dim font-mono">
                IG: {account.ig_username}
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3 shrink-0 self-start sm:self-auto">
        {account.token_expires_at && (
          <span className="text-[10px] text-text-muted font-mono">
            Expires {new Date(account.token_expires_at).toLocaleDateString()}
          </span>
        )}
        <Badge variant={account.status} />
      </div>
    </div>
  )
}
