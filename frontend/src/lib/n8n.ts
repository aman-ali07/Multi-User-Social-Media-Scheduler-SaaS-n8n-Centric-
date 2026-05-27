interface WebhookOptions {
  body?: unknown
}

async function callWebhook(path: string, options: WebhookOptions = {}) {
  const res = await fetch(`/api/n8n/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: options.body ? JSON.stringify(options.body) : undefined,
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error || `Request failed (${res.status})`)
  }

  return res.json()
}

export async function connectOAuth(userId: string, platform: 'facebook') {
  return callWebhook('oauth-connect', { body: { userId, platform } })
}

export async function createPost(data: {
  userId: string
  accountId: string
  title?: string
  caption?: string
  mediaIds?: string[]
  platforms: string[]
  scheduleAt?: string | null
  timezone: string
  status: 'draft' | 'scheduled'
}) {
  return callWebhook('post', { body: { operation: 'create', ...data } })
}

export async function updatePost(data: {
  postId: string
  title?: string
  caption?: string
  platforms?: string[]
  accountId?: string
  scheduleAt?: string | null
  status?: string
  userId: string
}) {
  return callWebhook('post', { body: { operation: 'edit', ...data } })
}

export async function cancelPost(postId: string, userId: string) {
  return callWebhook('post', { body: { operation: 'cancel', postId, userId } })
}


