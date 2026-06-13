'use client'

import { useEffect } from 'react'

import { motion } from 'framer-motion'
import { ConsoleShell } from '@/components/shell/console-shell'
import { AuthGuard } from '@/components/auth/auth-guard'
import { StatsRow } from '@/components/dashboard/stats-row'
import { PublishingVelocity } from '@/components/dashboard/publishing-velocity'
import { UpcomingList } from '@/components/dashboard/upcoming-list'
import { ActivityFeed } from '@/components/dashboard/activity-feed'
import { useDashboard } from '@/hooks/use-dashboard'
import { useRouter } from 'next/navigation'

const container = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.1 } },
}

const item = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] as const } },
}

export default function DashboardPage() {
  const { stats, upcoming, velocity, activity, loading, error, retry } = useDashboard()
  const router = useRouter()

  useEffect(() => {
    if (!loading && stats && stats.connectedAccounts === 0) {
      if (typeof window !== 'undefined' && localStorage.getItem('has_skipped_onboarding') === '1') {
        return
      }
      router.push('/onboarding')
    }
  }, [loading, stats, router])

  if (loading) {
    return (
      <AuthGuard>
        <ConsoleShell>
          <div className="p-8 max-w-7xl mx-auto w-full space-y-8">
            <div className="h-8 w-48 bg-surface-strong rounded animate-pulse" />
            <div className="flex gap-12">
              <div className="h-12 w-24 bg-surface-strong rounded animate-pulse" />
              <div className="h-12 w-24 bg-surface-strong rounded animate-pulse" />
              <div className="h-12 w-24 bg-surface-strong rounded animate-pulse" />
              <div className="h-12 w-24 bg-surface-strong rounded animate-pulse" />
            </div>
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
              <div className="xl:col-span-2 h-[400px] bg-surface-card rounded animate-pulse border border-hairline" />
              <div className="h-[400px] bg-surface-card rounded animate-pulse border border-hairline p-4 space-y-4">
                <div className="h-4 w-32 bg-surface-strong rounded" />
                <div className="space-y-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="h-16 bg-surface-strong rounded" />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </ConsoleShell>
      </AuthGuard>
    )
  }

  const statCards = [
    { label: 'Scheduled Today', value: String(stats?.scheduledToday ?? 0), href: '/calendar' },
    { label: 'Published', value: String(stats?.totalPublished ?? 0), href: '/posts?filter=published' },
    { label: 'Failed', value: String(stats?.totalFailed ?? 0), href: '/posts?filter=failed' },
    { label: 'Connected', value: String(stats?.connectedAccounts ?? 0), href: '/accounts' },
  ]

  return (
    <AuthGuard>
      <ConsoleShell
        rightPanel={<ActivityFeed items={activity} />}
      >
        <motion.div variants={container} initial="hidden" animate="visible" className="p-8 max-w-7xl mx-auto h-full flex flex-col">
          <motion.div variants={item} className="mb-8">
            <h1 className="font-cal text-[32px] text-ink leading-none tracking-tighter">Dashboard</h1>
          </motion.div>

          {error && (
            <motion.div variants={item} className="mb-6 rounded-md border border-error/20 bg-error/5 p-4 flex items-center justify-between">
              <p className="text-[13px] text-error font-medium">{error}</p>
              <button
                onClick={retry}
                className="px-4 py-1.5 rounded-md bg-canvas border border-error/30 text-error text-[12px] font-bold uppercase tracking-wider hover:bg-error/10 transition-colors"
              >
                Retry
              </button>
            </motion.div>
          )}

          <motion.div variants={item}>
            <StatsRow stats={statCards} />
          </motion.div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 flex-1 min-h-0">
            <motion.div variants={item} className="xl:col-span-2 flex flex-col min-h-[400px]">
              <PublishingVelocity days={velocity.length > 0 ? velocity : []} />
            </motion.div>

            <motion.div variants={item} className="flex flex-col min-h-[400px]">
              <UpcomingList posts={upcoming.map(p => ({
                id: p.id,
                title: p.title || 'Untitled',
                platforms: Array.isArray(p.platforms) ? p.platforms : [],
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
