'use client'

import { motion } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import type { SocialAccount } from '@/types/database'

interface AccountCardProps {
  account: SocialAccount
  onDisconnect?: (id: string) => void
  onReconnect?: () => void
}

export function AccountCard({ account, onDisconnect, onReconnect }: AccountCardProps) {
  const isExpired = account.token_expires_at ? new Date(account.token_expires_at) <= new Date() : false

  return (
    <motion.div 
      whileHover={{ y: -2, transition: { duration: 0.15 } }}
      className="rounded-lg border border-hairline bg-surface-card p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="flex items-center gap-4">
        <span className="text-ink text-2xl shrink-0 opacity-80">◎</span>
        <div className="min-w-0">
          <p className="text-ink font-medium text-[15px] truncate">{account.page_name || account.page_id}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[12px] text-muted font-medium uppercase bg-surface-soft px-1.5 py-0.5 rounded-sm">
              {account.platform}
            </span>
            {account.ig_username && (
              <span className="text-[12px] text-muted font-medium">
                IG: {account.ig_username}
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-4 shrink-0 self-start sm:self-auto">
        {account.token_expires_at && (
          <span className={`text-[12px] font-medium ${isExpired ? 'text-error' : 'text-muted'}`}>
            {isExpired ? 'Expired' : `Expires ${new Date(account.token_expires_at).toLocaleDateString()}`}
          </span>
        )}
        {!isExpired && <Badge variant={account.status} />}
        {isExpired && onReconnect && (
          <button
            onClick={onReconnect}
            className="text-[12px] text-badge-orange border-badge-orange bg-badge-orange/10 font-medium uppercase tracking-wider border hover:bg-badge-orange/20 px-3 py-1.5 rounded-md transition-colors shadow-sm"
          >
            Reconnect
          </button>
        )}
        {onDisconnect && account.status !== 'disconnected' && (
          <button
            onClick={() => {
              if (window.confirm('Are you sure you want to disconnect this account?')) {
                onDisconnect(account.id)
              }
            }}
            className="text-[12px] text-muted font-medium uppercase tracking-wider border border-hairline hover:border-error hover:text-error hover:bg-error/5 px-3 py-1.5 rounded-md transition-colors shadow-[0_1px_2px_rgba(0,0,0,0.05)]"
          >
            Disconnect
          </button>
        )}
      </div>
    </motion.div>
  )
}
