async function callWebhook(path: string, body?: unknown) {
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
  return callWebhook('oauth-connect', { platform })
}

export async function createPost(data: {
  accountId: string
  title?: string
  caption?: string
  mediaIds?: string[]
  platforms: string[]
  scheduleAt?: string | null
  timezone: string
  status: 'draft' | 'scheduled'
}) {
  return callWebhook('post', { operation: 'create', ...data })
}

export async function updatePost(data: {
  postId: string
  title?: string
  caption?: string
  platforms?: string[]
  accountId?: string
  scheduleAt?: string | null
  status?: string
}) {
  return callWebhook('post', { operation: 'edit', ...data })
}

export async function cancelPost(postId: string) {
  return callWebhook('post', { operation: 'cancel', postId })
}
