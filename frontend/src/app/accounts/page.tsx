'use client'

import { motion } from 'framer-motion'
import { ConsoleShell } from '@/components/shell/console-shell'
import { AuthGuard } from '@/components/auth/auth-guard'
import { AccountCard } from '@/components/accounts/account-card'
import { ConnectButton } from '@/components/accounts/connect-button'
import { SkeletonCard } from '@/components/ui/skeleton'
import { useAccounts } from '@/hooks/use-accounts'

const container = {
  hidden: { opacity: 0 },
  visible: { transition: { staggerChildren: 0.06 } },
}

const item = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
}

export default function AccountsPage() {
  const { accounts, loading, error, connect } = useAccounts()

  return (
    <AuthGuard>
      <ConsoleShell>
        <motion.div variants={container} initial="hidden" animate="visible" className="p-6 space-y-6 max-w-3xl">
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
                Click "Connect Facebook" to link your Meta pages.
              </p>
            </motion.div>
          ) : (
            <motion.div variants={item} className="space-y-3">
              {accounts.map((acct) => (
                <AccountCard key={acct.id} account={acct} />
              ))}
            </motion.div>
          )}
        </motion.div>
      </ConsoleShell>
    </AuthGuard>
  )
}
