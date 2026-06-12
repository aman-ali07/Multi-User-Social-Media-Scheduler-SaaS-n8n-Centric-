import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

const N8N_BASE = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL?.replace(/\/$/, '')
const N8N_PROXY_SECRET = process.env.N8N_PROXY_SECRET || ''
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const FRONTEND_URL = process.env.FRONTEND_URL || process.env.NEXT_PUBLIC_FRONTEND_URL || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
const MAX_BODY_SIZE = 10 * 1024 * 1024

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': FRONTEND_URL,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400',
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() })
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const contentLength = parseInt(request.headers.get('content-length') || '0', 10)
  if (contentLength > MAX_BODY_SIZE) {
    return NextResponse.json({ error: 'Request too large' }, { status: 413, headers: corsHeaders() })
  }

  // Strict Content-Type validation to prevent CSRF via cross-origin text/plain forms
  const contentType = request.headers.get('content-type') || ''
  if (!contentType.includes('application/json')) {
    return NextResponse.json({ error: 'Unsupported Media Type' }, { status: 415, headers: corsHeaders() })
  }

  // Allowlist: only permit the two browser-facing webhooks.
  const ALLOWED_PATHS = new Set(['oauth-connect', 'post'])
  const { path } = await params
  const webhookPath = path.join('/')
  if (!ALLOWED_PATHS.has(webhookPath)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404, headers: corsHeaders() })
  }
  const url = `${N8N_BASE}/webhook/${webhookPath}`

  try {
    const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: () => {},
      },
    })

    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders() })
    }

    const body = await request.json()

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-verified-user-id': user.id,
        'x-proxy-secret': N8N_PROXY_SECRET,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(25000),
    })

    const data = await res.json()
    return NextResponse.json(data, { status: res.status, headers: corsHeaders() })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Request failed'
    return NextResponse.json({ error: message }, { status: 500, headers: corsHeaders() })
  }
}
