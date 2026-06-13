import type { PostStatus } from '@/types/database'

interface N8nResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
}

interface CreatePostData {
  accountId: string
  title?: string
  caption?: string
  mediaIds?: string[]
  platforms: string[]
  scheduleAt?: string | null
  timezone: string
  status: 'draft' | 'scheduled'
}

interface UpdatePostData {
  postId: string
  title?: string
  caption?: string
  platforms?: string[]
  accountId?: string
  scheduleAt?: string | null
  status?: string
}

async function callWebhook<T = unknown>(path: string, body?: unknown): Promise<N8nResponse<T>> {
  const res = await fetch(`/api/n8n/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(15000),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error || `Request failed (${res.status})`)
  }

  return res.json()
}

export async function connectOAuth(platform: 'facebook') {
  return callWebhook<{ url: string }>('oauth-connect', { platform })
}

export async function createPost(data: CreatePostData) {
  return callWebhook<{ id: string; status: PostStatus }>('post', { operation: 'create', ...data })
}

export async function updatePost(data: UpdatePostData) {
  return callWebhook<{ id: string; status: PostStatus }>('post', { operation: 'edit', ...data })
}

export async function cancelPost(postId: string) {
  return callWebhook<{ id: string; status: PostStatus }>('post', { operation: 'cancel', postId })
}
