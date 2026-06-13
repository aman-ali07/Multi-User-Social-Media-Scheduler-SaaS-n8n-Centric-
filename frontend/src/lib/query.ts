import type { SocialAccount, MediaAsset, PostLog, Profile, ScheduledPost } from '@/types/database'

const BASE = '/api/query'

interface QueryOptions {
  signal?: AbortSignal
}

async function call<T>(type: string, params?: Record<string, unknown>, opts?: QueryOptions): Promise<T> {
  const res = await fetch(BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type, ...params }),
    signal: opts?.signal,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error || `Query failed (${res.status})`)
  }
  return res.json()
}

export interface DashboardResult {
  stats: {
    scheduledToday: number
    totalPublished: number
    totalFailed: number
    connectedAccounts: number
    publishingVelocity: { date: string; count: number }[]
  }
  upcoming: Array<{
    id: string
    title: string | null
    platforms: string[]
    schedule_at: string | null
    status: string
  }>
  velocity: Array<{ label: string; count: number; max: number }>
  activity: Array<{ id: string; action: string; time: string; status: 'success' | 'error' | 'retry' }>
}

export async function getDashboard(opts?: QueryOptions) {
  return call<DashboardResult>('dashboard', undefined, opts)
}

export async function getPosts(filter: string, page: number, dateFilter?: string, opts?: QueryOptions) {
  return call<{ posts: ScheduledPost[]; total: number; page: number; totalPages: number }>('posts', { filter, page, dateFilter }, opts)
}

export async function getAccounts(opts?: QueryOptions) {
  return call<{ accounts: SocialAccount[] }>('accounts', undefined, opts)
}

export async function getMedia(opts?: QueryOptions) {
  return call<{ media: MediaAsset[] }>('media', undefined, opts)
}

export async function getCalendar(year: number, month: number, opts?: QueryOptions) {
  return call<{ posts: ScheduledPost[]; postsByDate: Record<string, ScheduledPost[]> }>('calendar', { year, month }, opts)
}

export async function getSettings(opts?: QueryOptions) {
  return call<{ profile: Profile }>('settings', undefined, opts)
}

export async function updateProfile(updates: Partial<Profile>, opts?: QueryOptions) {
  return call<{ success: boolean }>('update-profile', { updates }, opts)
}

export async function deleteAccount(opts?: QueryOptions) {
  return call<{ success: boolean }>('delete-user', undefined, opts)
}
