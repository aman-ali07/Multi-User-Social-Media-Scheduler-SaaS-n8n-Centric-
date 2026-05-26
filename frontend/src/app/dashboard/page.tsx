'use client'

import { motion } from 'framer-motion'
import { ConsoleShell } from '@/components/shell/console-shell'
import { AuthGuard } from '@/components/auth/auth-guard'
import { StatsRow } from '@/components/dashboard/stats-row'
import { PublishingVelocity } from '@/components/dashboard/publishing-velocity'
import { UpcomingList } from '@/components/dashboard/upcoming-list'
import { ActivityFeed } from '@/components/dashboard/activity-feed'

const container = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.1 } },
}

const item = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] as const } },
}

const statCards = [
  { label: 'Scheduled Today', value: '4', trend: '+2', color: 'gold' },
  { label: 'Published', value: '127', trend: '+12', color: 'lime' },
  { label: 'Failed', value: '3', trend: '-1', color: 'red' },
  { label: 'Connected', value: '3', trend: '', color: 'steel' },
]

const velocityDays = [
  { label: 'Mon', count: 3, max: 5 },
  { label: 'Tue', count: 5, max: 5 },
  { label: 'Wed', count: 2, max: 5 },
  { label: 'Thu', count: 4, max: 5 },
  { label: 'Fri', count: 1, max: 5 },
  { label: 'Sat', count: 0, max: 5 },
  { label: 'Sun', count: 0, max: 5 },
]

const upcomingPosts = [
  { title: 'Product Launch Announcement', platforms: ['facebook', 'instagram'], time: '14:30', status: 'scheduled' as const },
  { title: 'Behind the Scenes — Team Photo', platforms: ['instagram'], time: '16:00', status: 'scheduled' as const },
  { title: 'Weekly Industry Roundup', platforms: ['facebook'], time: '18:00', status: 'draft' as const },
  { title: 'Customer Spotlight: Case Study', platforms: ['facebook', 'instagram'], time: '09:00', status: 'scheduled' as const },
]

const activityItems = [
  { action: 'Post published to Facebook', time: '12m ago', status: 'success' as const },
  { action: 'Instagram container created', time: '12m ago', status: 'success' as const },
  { action: 'Token refreshed for Tech Page', time: '45m ago', status: 'success' as const },
  { action: 'Post failed — rate limit exceeded', time: '2h ago', status: 'error' as const },
  { action: 'Retry scheduled for Product Post', time: '2h ago', status: 'retry' as const },
  { action: 'Media uploaded: team-photo.jpg', time: '3h ago', status: 'success' as const },
]

export default function DashboardPage() {
  return (
    <AuthGuard>
      <ConsoleShell
        rightPanel={<ActivityFeed items={activityItems} />}
      >
        <motion.div variants={container} initial="hidden" animate="visible" className="p-6 space-y-8 max-w-6xl">
          <motion.div variants={item}>
            <h1 className="font-serif text-[28px] text-text tracking-tight">Dashboard</h1>
            <p className="text-text-muted text-sm font-sans mt-1">Content operations cockpit</p>
          </motion.div>

          <motion.div variants={item}>
            <StatsRow stats={statCards} />
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <motion.div variants={item}>
              <PublishingVelocity days={velocityDays} />
            </motion.div>

            <motion.div variants={item}>
              <UpcomingList posts={upcomingPosts} />
            </motion.div>
          </div>
        </motion.div>
      </ConsoleShell>
    </AuthGuard>
  )
}
