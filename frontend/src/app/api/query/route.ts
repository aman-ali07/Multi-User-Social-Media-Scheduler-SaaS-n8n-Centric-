import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

function badRequest(msg: string) {
  return NextResponse.json({ error: msg }, { status: 400 })
}

function serverError(msg: string) {
  return NextResponse.json({ error: msg }, { status: 500 })
}

async function getServerClient(request: NextRequest, response: NextResponse) {
  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet) => {
        cookiesToSet.forEach(({ name, value, options }) => {
          request.cookies.set(name, value)
          response.cookies.set(name, value, options)
        })
      },
    },
  })
}

export async function POST(request: NextRequest) {
  try {
    // Strict Content-Type validation to prevent CSRF via cross-origin text/plain forms
    const contentType = request.headers.get('content-type') || ''
    if (!contentType.includes('application/json')) {
      return NextResponse.json({ error: 'Unsupported Media Type' }, { status: 415 })
    }

    // We'll create a base response first to capture any cookie updates
    const response = NextResponse.json({})
    const supabase = await getServerClient(request, response)
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return unauthorized()

    const body = await request.json()
    const type = body.type as string
    let resultResponse: NextResponse;
    switch (type) {
      case 'dashboard': resultResponse = await handleDashboard(supabase, user.id); break;
      case 'posts': resultResponse = await handlePosts(supabase, user.id, body); break;
      case 'accounts': resultResponse = await handleAccounts(supabase, user.id); break;
      case 'media': resultResponse = await handleMedia(supabase, user.id); break;
      case 'calendar': resultResponse = await handleCalendar(supabase, user.id, body); break;
      case 'settings': resultResponse = await handleSettings(supabase, user.id); break;
      case 'update-profile': resultResponse = await handleUpdateProfile(supabase, user.id, body); break;
      case 'logs': resultResponse = await handleLogs(supabase, user.id); break;
      case 'delete-media': resultResponse = await handleDeleteMedia(supabase, user.id, body); break;
      case 'delete-account': resultResponse = await handleDeleteAccount(supabase, user.id, body); break;
      case 'delete-user': resultResponse = await handleDeleteUser(supabase, user.id); break;
      default: return badRequest(`Unknown query type: ${type}`)
    }

    // Apply any refreshed cookies to the final response
    response.cookies.getAll().forEach((cookie) => {
      resultResponse.cookies.set(cookie.name, cookie.value)
    })
    return resultResponse;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Internal server error'
    return serverError(msg)
  }
}

async function handleDeleteUser(supabase: ReturnType<typeof createServerClient>, userId: string) {
  // First delete all media from storage since auth.users CASCADE doesn't clear storage
  const { data: media } = await supabase.from('media_assets').select('storage_path').eq('user_id', userId)
  if (media && media.length > 0) {
    const paths = media.map((m: any) => m.storage_path).filter(Boolean) as string[]
    if (paths.length > 0) await supabase.storage.from('media').remove(paths)
  }

  // Then delete the user from auth.users via rpc
  const { error } = await supabase.rpc('delete_user')
  if (error) {
    // Fallback: manual data deletion if RPC doesn't exist or fails
    await supabase.from('social_accounts').delete().eq('user_id', userId)
    await supabase.from('scheduled_posts').delete().eq('user_id', userId)
    await supabase.from('media_assets').delete().eq('user_id', userId)
    await supabase.from('profiles').delete().eq('id', userId)
  }
  
  return NextResponse.json({ success: true })
}

async function handleDashboard(supabase: ReturnType<typeof createServerClient>, userId: string) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayStr = today.toISOString()

  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const tomorrowStr = tomorrow.toISOString()

  const weekAgo = new Date(today)
  weekAgo.setDate(weekAgo.getDate() - 6)
  const weekAgoStr = weekAgo.toISOString()

  const [
    { count: scheduledToday, error: err1 },
    { count: totalPublished, error: err2 },
    { count: totalFailed, error: err3 },
    { count: connectedAccounts, error: err4 },
    upcomingRes,
    velocityRes,
    logsRes,
  ] = await Promise.all([
    supabase.from('scheduled_posts').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('status', 'scheduled').gte('schedule_at', todayStr).lt('schedule_at', tomorrowStr),
    supabase.from('scheduled_posts').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('status', 'published'),
    supabase.from('scheduled_posts').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('status', 'failed'),
    supabase.from('social_accounts').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('status', 'active'),
    supabase.from('scheduled_posts').select('id, title, platforms, schedule_at, status').eq('user_id', userId).eq('status', 'scheduled').gte('schedule_at', todayStr).order('schedule_at', { ascending: true }).limit(5),
    supabase.from('scheduled_posts').select('id, title, platforms, schedule_at, status').eq('user_id', userId).in('status', ['scheduled', 'published']).gte('schedule_at', weekAgoStr).lte('schedule_at', tomorrowStr),
    supabase.from('post_logs').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(20),
  ])

  if (err1 || err2 || err3 || err4) {
    return serverError('Failed to load dashboard data')
  }

  const dayCounts: Record<string, number> = {}
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekAgo)
    d.setDate(d.getDate() + i)
    dayCounts[d.toISOString().split('T')[0]] = 0
  }
  for (const post of (velocityRes.data || []) as Array<{ schedule_at: string | null }>) {
    if (post.schedule_at) {
      const dateKey = post.schedule_at.split('T')[0]
      if (dateKey in dayCounts) dayCounts[dateKey]++
    }
  }
  const maxCount = Math.max(...Object.values(dayCounts), 1)
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const velocity = Object.entries(dayCounts).map(([date, count]) => ({
    label: days[new Date(date).getDay()],
    count,
    max: maxCount,
  }))

  const formatTime = (dateStr: string): string => {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'just now'
    if (mins < 60) return `${mins}m ago`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    return `${days}d ago`
  }

  const activity = ((logsRes.data || []) as Array<Record<string, unknown>>).map((log) => ({
    id: log.id as string,
    action: (log.workflow_name as string)
      + (log.error_message ? ` — ${log.error_message as string}` : ''),
    time: formatTime(log.created_at as string),
    status: log.status === 'success' ? 'success' : log.status === 'error' ? 'error' : 'retry',
  }))

  return NextResponse.json({
    stats: {
      scheduledToday: scheduledToday ?? 0,
      totalPublished: totalPublished ?? 0,
      totalFailed: totalFailed ?? 0,
      connectedAccounts: connectedAccounts ?? 0,
      publishingVelocity: [],
    },
    upcoming: (upcomingRes.data || []),
    velocity,
    activity,
  })
}

async function handlePosts(supabase: ReturnType<typeof createServerClient>, userId: string, body: Record<string, unknown>) {
  const filter = body.filter as string || 'all'
  const dateFilter = body.dateFilter as string | undefined
  const page = (body.page as number) || 0
  const pageSize = 20
  const from = page * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from('scheduled_posts')
    .select('*', { count: 'exact' })
    .eq('user_id', userId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .range(from, to)

  if (filter !== 'all') query = query.eq('status', filter as string)
  if (dateFilter) {
    const dateFrom = `${dateFilter}T00:00:00.000Z`
    const dateTo = `${dateFilter}T23:59:59.999Z`
    query = query.gte('schedule_at', dateFrom).lte('schedule_at', dateTo)
  }

  const { data, error: err, count } = await query
  if (err) return serverError(err.message)

  return NextResponse.json({ posts: data || [], total: count ?? 0, page, totalPages: Math.ceil((count ?? 0) / pageSize) })
}

async function handleAccounts(supabase: ReturnType<typeof createServerClient>, userId: string) {
  const { data, error: err } = await supabase
    .from('social_accounts')
    .select('id, user_id, platform, page_id, page_name, ig_user_id, ig_username, token_expires_at, status, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (err) return serverError(err.message)
  return NextResponse.json({ accounts: data || [] })
}

async function handleMedia(supabase: ReturnType<typeof createServerClient>, userId: string) {
  const { data, error: err } = await supabase
    .from('media_assets')
    .select('id, user_id, file_url, file_type, file_size, storage_path, width, height, duration, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (err) return serverError(err.message)
  return NextResponse.json({ media: data || [] })
}

async function handleCalendar(supabase: ReturnType<typeof createServerClient>, userId: string, body: Record<string, unknown>) {
  const year = body.year as number
  const month = body.month as number
  const from = new Date(year, month, 1).toISOString()
  const to = new Date(year, month + 1, 0, 23, 59, 59).toISOString()

  const { data, error: err } = await supabase
    .from('scheduled_posts')
    .select('id, title, status, platforms, schedule_at, published_at')
    .eq('user_id', userId)
    .in('status', ['scheduled', 'published'])
    .gte('schedule_at', from)
    .lte('schedule_at', to)

  if (err) return serverError(err.message)

  const postsByDate: Record<string, unknown[]> = {}
  for (const post of (data || []) as Record<string, unknown>[]) {
    const date = post.schedule_at ? (post.schedule_at as string).split('T')[0] : 'unknown'
    if (!postsByDate[date]) postsByDate[date] = []
    postsByDate[date].push(post)
  }

  return NextResponse.json({ posts: data || [], postsByDate })
}

async function handleSettings(supabase: ReturnType<typeof createServerClient>, userId: string) {
  const { data, error: err } = await supabase
    .from('profiles')
    .select('id, display_name, timezone, created_at, updated_at')
    .eq('id', userId)
    .maybeSingle()

  if (err) return serverError(err.message)
  return NextResponse.json({ profile: data })
}

async function handleUpdateProfile(supabase: ReturnType<typeof createServerClient>, userId: string, body: Record<string, unknown>) {
  const updates = body.updates as Record<string, unknown>
  if (!updates || typeof updates !== 'object') return badRequest('updates is required')

  const { error: err } = await supabase
    .from('profiles')
    .upsert({ id: userId, ...updates, updated_at: new Date().toISOString() })

  if (err) return serverError(err.message)
  return NextResponse.json({ success: true })
}

async function handleLogs(supabase: ReturnType<typeof createServerClient>, userId: string) {
  const { data, error: err } = await supabase
    .from('post_logs')
    .select('id, post_id, workflow_name, status, error_message, response_payload, attempt_number, created_at, user_id')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(100)

  if (err) return serverError(err.message)
  return NextResponse.json({ logs: data || [] })
}

async function handleDeleteMedia(supabase: ReturnType<typeof createServerClient>, userId: string, body: Record<string, unknown>) {
  const id = body.id as string
  if (!id) return badRequest('id is required')

  const { data: media, error: err1 } = await supabase
    .from('media_assets')
    .select('storage_path')
    .eq('id', id)
    .eq('user_id', userId)
    .maybeSingle()

  if (err1) return serverError(err1.message)
  if (!media) return badRequest('Media not found')

  const { count, error: err2 } = await supabase
    .from('post_media')
    .select('*', { count: 'exact', head: true })
    .eq('media_id', id)

  if (err2) return serverError(err2.message)
  if (count && count > 0) return badRequest('Cannot delete media currently attached to a post')

  if (media.storage_path) {
    const { error: err3 } = await supabase.storage.from('media').remove([media.storage_path])
    if (err3) console.error('Failed to delete storage file:', err3)
  }

  const { error: err4 } = await supabase.from('media_assets').delete().eq('id', id).eq('user_id', userId)
  if (err4) return serverError(err4.message)

  return NextResponse.json({ success: true })
}

async function handleDeleteAccount(supabase: ReturnType<typeof createServerClient>, userId: string, body: Record<string, unknown>) {
  const id = body.id as string
  if (!id) return badRequest('id is required')

  const { error: err } = await supabase
    .from('social_accounts')
    .update({ status: 'disconnected', token_expires_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', userId)

  if (err) return serverError(err.message)
  return NextResponse.json({ success: true })
}
