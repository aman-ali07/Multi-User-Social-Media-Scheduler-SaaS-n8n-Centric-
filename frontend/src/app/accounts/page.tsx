'use client'

import { motion } from 'framer-motion'
import { ConsoleShell } from '@/components/shell/console-shell'
import { AuthGuard } from '@/components/auth/auth-guard'
import { AccountCard } from '@/components/accounts/account-card'
import { ConnectButton } from '@/components/accounts/connect-button'
import { SkeletonCard } from '@/components/ui/skeleton'
import { useAccounts } from '@/hooks/use-accounts'
import { useSearchParams } from 'next/navigation'

const container = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
}

const item = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
}

const oauthErrors: Record<string, string> = {
  oauth_denied: 'Authorization denied. Please try again.',
  missing_params: 'Missing OAuth parameters from Meta.',
  callback_failed: 'Connection failed. Please try again.',
  token_exchange_failed: 'Token exchange failed. Please try again.',
  invalid_state: 'Invalid OAuth state. Please start over.',
}

export default function AccountsPage() {
  const { accounts, loading, error, connect, disconnect } = useAccounts()
  const searchParams = useSearchParams()
  const oauthSuccess = searchParams.get('success')
  const oauthError = searchParams.get('error')

  return (
    <AuthGuard>
      <ConsoleShell>
        <motion.div variants={container} initial="hidden" animate="visible" className="p-4 sm:p-6 space-y-6 max-w-3xl">
          {oauthSuccess === 'connected' && (
            <motion.div variants={item} className="rounded-sm border border-lime/30 bg-lime/5 p-3 text-lime text-sm font-mono">
              ✓ Facebook account connected successfully
            </motion.div>
          )}

          {oauthError && oauthErrors[oauthError] && (
            <motion.div variants={item} className="rounded-sm border border-red/30 bg-red/5 p-3 text-red text-sm font-mono">
              ✕ {oauthErrors[oauthError]}
            </motion.div>
          )}

          <motion.div variants={item} className="flex items-center justify-between">
            <div>
              <h1 className="font-serif text-[28px] text-text tracking-tight">Accounts</h1>
              <p className="text-text-muted text-sm font-sans mt-1">Connected social accounts</p>
            </div>
            <ConnectButton platform="facebook" onClick={() => connect('facebook')} />
          </motion.div>

          {error && (
            <motion.p variants={item} className="text-red text-[12px] font-mono">
              {error}
            </motion.p>
          )}

          {loading ? (
            <motion.div variants={item} className="grid grid-cols-1 gap-3">
              <SkeletonCard />
              <SkeletonCard />
            </motion.div>
          ) : accounts.length === 0 ? (
            <motion.div variants={item} className="rounded-sm border border-border bg-surface p-8 text-center">
              <p className="text-text-dim text-sm font-sans">No accounts connected yet.</p>
              <p className="text-text-muted text-xs font-mono mt-1">
                Click &ldquo;Connect Facebook&rdquo; to link your Meta pages.
              </p>
            </motion.div>
          ) : (
            <motion.div variants={item} className="space-y-3">
              {accounts.map((acct) => (
                <AccountCard key={acct.id} account={acct} onDisconnect={disconnect} />
              ))}
            </motion.div>
          )}
        </motion.div>
      </ConsoleShell>
    </AuthGuard>
  )
}
