import { supabase } from './supabase'
import type { PostStatus, DashboardStats } from '@/types/database'

export async function getMyPosts(userId: string, filters: {
  status?: PostStatus
  limit?: number
  offset?: number
} = {}) {
  let query = supabase
    .from('scheduled_posts')
    .select('id, title, caption, platforms, status, schedule_at, published_at, timezone, retry_count, max_retries, created_at, deleted_at')
    .eq('user_id', userId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (filters.status) query = query.eq('status', filters.status)
  if (filters.limit) query = query.limit(filters.limit)
  if (filters.offset !== undefined && filters.limit) query = query.range(filters.offset, filters.offset + filters.limit - 1)

  return query
}

export async function getUpcomingPosts(userId: string, limit = 5) {
  return supabase
    .from('scheduled_posts')
    .select('id, title, status, schedule_at, platforms')
    .eq('user_id', userId)
    .eq('status', 'scheduled')
    .gte('schedule_at', new Date().toISOString())
    .order('schedule_at', { ascending: true })
    .limit(limit)
}

export async function getCalendarPosts(userId: string, from: string, to: string) {
  return supabase
    .from('scheduled_posts')
    .select('id, title, status, platforms, schedule_at, published_at')
    .eq('user_id', userId)
    .in('status', ['scheduled', 'published'])
    .gte('schedule_at', from)
    .lte('schedule_at', to)
}

export async function getPostById(userId: string, id: string) {
  return supabase
    .from('scheduled_posts')
    .select('id, user_id, account_id, title, caption, platforms, schedule_at, published_at, timezone, status, retry_count, max_retries, error_message, created_at, updated_at, deleted_at')
    .eq('user_id', userId)
    .eq('id', id)
    .single()
}

export async function getMyAccounts(userId: string) {
  return supabase
    .from('social_accounts')
    .select('id, user_id, platform, page_id, page_name, ig_user_id, ig_username, status, token_expires_at, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
}

export async function getMyMedia(userId: string) {
  return supabase
    .from('media_assets')
    .select('id, user_id, file_url, file_type, file_size, storage_path, width, height, duration, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
}

export async function getLogsForPost(postId: string) {
  return supabase
    .from('post_logs')
    .select('id, post_id, workflow_name, status, error_message, response_payload, attempt_number, created_at')
    .eq('post_id', postId)
    .order('created_at', { ascending: false })
}

export async function getAllLogs(userId: string, limit = 50) {
  return supabase
    .from('post_logs')
    .select('id, post_id, workflow_name, status, error_message, response_payload, attempt_number, created_at, user_id')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)
}

export async function getScheduledQueueCount(userId: string) {
  const { count } = await supabase
    .from('scheduled_posts')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('status', 'scheduled')
    .is('deleted_at', null)
  return count ?? 0
}

export async function getLastPublishDate(userId: string) {
  const { data } = await supabase
    .from('scheduled_posts')
    .select('published_at')
    .eq('user_id', userId)
    .eq('status', 'published')
    .not('published_at', 'is', null)
    .order('published_at', { ascending: false })
    .limit(1)
  return data?.[0]?.published_at ?? null
}

export async function getDashboardStats(userId: string): Promise<{ data: DashboardStats | null; error: string | null }> {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayStr = today.toISOString()

  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const tomorrowStr = tomorrow.toISOString()

  const { count: scheduledToday } = await supabase
    .from('scheduled_posts')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('status', 'scheduled')
    .gte('schedule_at', todayStr)
    .lt('schedule_at', tomorrowStr)

  const { count: totalPublished } = await supabase
    .from('scheduled_posts')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('status', 'published')

  const { count: totalFailed } = await supabase
    .from('scheduled_posts')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('status', 'failed')

  const { count: connectedAccounts } = await supabase
    .from('social_accounts')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
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
