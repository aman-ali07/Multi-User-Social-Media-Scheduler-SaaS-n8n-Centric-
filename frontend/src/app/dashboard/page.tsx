'use client'

import { motion } from 'framer-motion'
import { ConsoleShell } from '@/components/shell/console-shell'
import { AuthGuard } from '@/components/auth/auth-guard'
import { StatsRow } from '@/components/dashboard/stats-row'
import { PublishingVelocity } from '@/components/dashboard/publishing-velocity'
import { UpcomingList } from '@/components/dashboard/upcoming-list'
import { ActivityFeed } from '@/components/dashboard/activity-feed'
import { useDashboard } from '@/hooks/use-dashboard'

const container = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.1 } },
}

const item = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] as const } },
}

export default function DashboardPage() {
  const { stats, upcoming, velocity, activity, loading } = useDashboard()

  if (loading) {
    return (
      <AuthGuard>
        <ConsoleShell>
          <div className="p-6 flex items-center gap-2 text-text-dim text-sm font-mono">
            <span className="w-3 h-3 border border-gold/30 border-t-gold rounded-full animate-spin" />
            Loading dashboard...
          </div>
        </ConsoleShell>
      </AuthGuard>
    )
  }

  const statCards = [
    { label: 'Scheduled Today', value: String(stats?.scheduledToday ?? 0), trend: '', color: 'gold' as const },
    { label: 'Published', value: String(stats?.totalPublished ?? 0), trend: '', color: 'lime' as const },
    { label: 'Failed', value: String(stats?.totalFailed ?? 0), trend: '', color: 'red' as const },
    { label: 'Connected', value: String(stats?.connectedAccounts ?? 0), trend: '', color: 'steel' as const },
  ]

  return (
    <AuthGuard>
      <ConsoleShell
        rightPanel={<ActivityFeed items={activity} />}
      >
        <motion.div variants={container} initial="hidden" animate="visible" className="p-4 sm:p-6 space-y-8 max-w-6xl">
          <motion.div variants={item}>
            <h1 className="font-serif text-[28px] text-text tracking-tight">Dashboard</h1>
            <p className="text-text-muted text-sm font-sans mt-1">Content operations cockpit</p>
          </motion.div>

          <motion.div variants={item}>
            <StatsRow stats={statCards} />
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <motion.div variants={item}>
              <PublishingVelocity days={velocity.length > 0 ? velocity : []} />
            </motion.div>

            <motion.div variants={item}>
              <UpcomingList posts={upcoming.map(p => ({
                title: p.title || 'Untitled',
                platforms: p.platforms,
                time: p.schedule_at
                  ? new Date(p.schedule_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  : '',
                status: p.status as 'draft' | 'scheduled' | 'published' | 'failed' | 'cancelled',
              }))} />
            </motion.div>
          </div>
        </motion.div>
      </ConsoleShell>
    </AuthGuard>
  )
}
