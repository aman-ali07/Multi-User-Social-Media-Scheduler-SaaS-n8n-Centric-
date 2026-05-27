import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from './use-auth'
import type { DashboardStats } from '@/types/database'

interface UpcomingPost {
  id: string
  title: string | null
  platforms: string[]
  schedule_at: string | null
  status: string
}

interface VelocityDay {
  label: string
  count: number
  max: number
}

interface ActivityItem {
  id: string
  action: string
  time: string
  status: 'success' | 'error' | 'retry'
}

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

function getDayLabel(dateStr: string): string {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  return days[new Date(dateStr).getDay()]
}

export function useDashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [upcoming, setUpcoming] = useState<UpcomingPost[]>([])
  const [velocity, setVelocity] = useState<VelocityDay[]>([])
  const [activity, setActivity] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    setLoading(true)

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayStr = today.toISOString()

    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    const tomorrowStr = tomorrow.toISOString()

    const weekAgo = new Date(today)
    weekAgo.setDate(weekAgo.getDate() - 6)
    const weekAgoStr = weekAgo.toISOString()

    Promise.all([
      supabase
        .from('scheduled_posts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('status', 'scheduled')
        .gte('schedule_at', todayStr)
        .lt('schedule_at', tomorrowStr),

      supabase
        .from('scheduled_posts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('status', 'published'),

      supabase
        .from('scheduled_posts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('status', 'failed'),

      supabase
        .from('social_accounts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('status', 'active'),

      supabase
        .from('scheduled_posts')
        .select('id, title, platforms, schedule_at, status')
        .eq('user_id', user.id)
        .eq('status', 'scheduled')
        .gte('schedule_at', todayStr)
        .order('schedule_at', { ascending: true })
        .limit(5),

      supabase
        .from('scheduled_posts')
        .select('id, title, platforms, schedule_at, status')
        .eq('user_id', user.id)
        .in('status', ['scheduled', 'published'])
        .gte('schedule_at', weekAgoStr)
        .lte('schedule_at', tomorrowStr),

      supabase
        .from('post_logs')
        .select('*, scheduled_posts!inner(user_id)')
        .eq('scheduled_posts.user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20),
    ]).then(([
      { count: scheduledToday },
      { count: totalPublished },
      { count: totalFailed },
      { count: connectedAccounts },
      upcomingRes,
      velocityRes,
      logsRes,
    ]) => {
      setStats({
        scheduledToday: scheduledToday ?? 0,
        totalPublished: totalPublished ?? 0,
        totalFailed: totalFailed ?? 0,
        connectedAccounts: connectedAccounts ?? 0,
        publishingVelocity: [],
      })

      setUpcoming((upcomingRes.data || []) as UpcomingPost[])

      const dayCounts: Record<string, number> = {}
      for (let i = 0; i < 7; i++) {
        const d = new Date(weekAgo)
        d.setDate(d.getDate() + i)
        dayCounts[d.toISOString().split('T')[0]] = 0
      }

      for (const post of (velocityRes.data || []) as UpcomingPost[]) {
        if (post.schedule_at) {
          const dateKey = post.schedule_at.split('T')[0]
          if (dateKey in dayCounts) dayCounts[dateKey]++
        }
      }

      const maxCount = Math.max(...Object.values(dayCounts), 1)
      setVelocity(
        Object.entries(dayCounts).map(([date, count]) => ({
          label: getDayLabel(date),
          count,
          max: maxCount,
        }))
      )

      setActivity(
        ((logsRes.data || []) as Record<string, unknown>[]).map((log) => ({
          id: log.id as string,
          action: (log.workflow_name as string)
            + (log.error_message ? ` — ${log.error_message as string}` : ''),
          time: formatRelativeTime(log.created_at as string),
          status: (log.status === 'success' ? 'success'
            : log.status === 'error' ? 'error' : 'retry') as 'success' | 'error' | 'retry',
        }))
      )

      setLoading(false)
    }).catch((err: Error) => {
      setError(err.message)
      setLoading(false)
    })
  }, [user])

  return { stats, upcoming, velocity, activity, loading, error }
}