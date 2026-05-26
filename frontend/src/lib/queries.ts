import { supabase } from './supabase'
import type { PostStatus, ScheduledPost, SocialAccount, MediaAsset, PostLog, DashboardStats } from '@/types/database'

export async function getMyPosts(filters: {
  status?: PostStatus
  limit?: number
  offset?: number
} = {}) {
  let query = supabase
    .from('scheduled_posts')
    .select('*')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (filters.status) query = query.eq('status', filters.status)
  if (filters.limit) query = query.limit(filters.limit)
  if (filters.offset && filters.limit) query = query.range(filters.offset, filters.offset + filters.limit - 1)

  return query
}

export async function getUpcomingPosts(limit = 5) {
  return supabase
    .from('scheduled_posts')
    .select('*')
    .eq('status', 'scheduled')
    .gte('schedule_at', new Date().toISOString())
    .order('schedule_at', { ascending: true })
    .limit(limit)
}

export async function getCalendarPosts(from: string, to: string) {
  return supabase
    .from('scheduled_posts')
    .select('id, title, status, platforms, schedule_at, published_at')
    .in('status', ['scheduled', 'published'])
    .gte('schedule_at', from)
    .lte('schedule_at', to)
}

export async function getPostById(id: string) {
  return supabase
    .from('scheduled_posts')
    .select('*')
    .eq('id', id)
    .single()
}

export async function getMyAccounts() {
  return supabase
    .from('social_accounts')
    .select('*')
    .order('created_at', { ascending: false })
}

export async function getMyMedia() {
  return supabase
    .from('media_assets')
    .select('*')
    .order('created_at', { ascending: false })
}

export async function getLogsForPost(postId: string) {
  return supabase
    .from('post_logs')
    .select('*')
    .eq('post_id', postId)
    .order('created_at', { ascending: false })
}

export async function getAllLogs(limit = 50) {
  return supabase
    .from('post_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)
}

export async function getDashboardStats(): Promise<{ data: DashboardStats | null; error: string | null }> {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayStr = today.toISOString()

  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const tomorrowStr = tomorrow.toISOString()

  const { count: scheduledToday } = await supabase
    .from('scheduled_posts')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'scheduled')
    .gte('schedule_at', todayStr)
    .lt('schedule_at', tomorrowStr)

  const { count: totalPublished } = await supabase
    .from('scheduled_posts')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'published')

  const { count: totalFailed } = await supabase
    .from('scheduled_posts')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'failed')

  const { count: connectedAccounts } = await supabase
    .from('social_accounts')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active')

  return {
    data: {
      scheduledToday: scheduledToday ?? 0,
      totalPublished: totalPublished ?? 0,
      totalFailed: totalFailed ?? 0,
      connectedAccounts: connectedAccounts ?? 0,
      publishingVelocity: [],
    },
    error: null,
  }
}
