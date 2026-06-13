'use client'
import React from 'react'
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

function AccountsContent() {
  const { accounts, loading, error, connect, disconnect } = useAccounts()
  const searchParams = useSearchParams()
  const oauthSuccess = searchParams.get('success')
  const oauthError = searchParams.get('error')

  return (
    <motion.div variants={container} initial="hidden" animate="visible" className="p-6 sm:p-10 space-y-8 max-w-3xl mx-auto">
      {oauthSuccess === 'connected' && (
        <motion.div variants={item} className="rounded-md border border-success/20 bg-success/5 p-4 text-success text-[13px] font-medium">
          ✓ Facebook account connected successfully
        </motion.div>
      )}

      {oauthError && oauthErrors[oauthError] && (
        <motion.div variants={item} className="rounded-md border border-error/20 bg-error/5 p-4 text-error text-[13px] font-medium">
          ✕ {oauthErrors[oauthError]}
        </motion.div>
      )}

      <motion.div variants={item} className="flex items-center justify-between">
        <div>
          <h1 className="font-cal text-[36px] text-ink leading-none tracking-tighter">Accounts</h1>
          <p className="text-muted text-sm mt-2 font-medium">Connected social accounts</p>
        </div>
        <ConnectButton platform="facebook" onClick={() => connect('facebook')} />
      </motion.div>

      {error && (
        <motion.p variants={item} className="text-error text-[13px] font-medium">
          {error}
        </motion.p>
      )}

      {loading ? (
        <motion.div variants={item} className="grid grid-cols-1 gap-3">
          <SkeletonCard />
          <SkeletonCard />
        </motion.div>
      ) : accounts.length === 0 ? (
        <motion.div variants={item} className="rounded-lg bg-surface-card p-12 text-center">
          <p className="text-muted text-[15px] font-medium">No accounts connected yet.</p>
          <p className="text-muted/70 text-[13px] font-medium mt-2">
            Click &ldquo;Connect Facebook&rdquo; to link your Meta pages.
          </p>
        </motion.div>
      ) : (
        <motion.div variants={item} className="space-y-4">
          {accounts.map((acct) => (
            <AccountCard 
              key={acct.id} 
              account={acct} 
              onDisconnect={disconnect} 
              onReconnect={() => connect(acct.platform)}
            />
          ))}
        </motion.div>
      )}
    </motion.div>
  )
}

export default function AccountsPage() {
  return (
    <AuthGuard>
      <ConsoleShell>
        <React.Suspense fallback={
          <div className="p-6 sm:p-10 space-y-8 max-w-3xl mx-auto">
            <SkeletonCard />
            <SkeletonCard />
          </div>
        }>
          <AccountsContent />
        </React.Suspense>
      </ConsoleShell>
    </AuthGuard>
  )
}
