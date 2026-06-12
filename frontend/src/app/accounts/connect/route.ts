import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

const N8N_BASE = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL?.replace(/\/$/, '')
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code')
  const state = request.nextUrl.searchParams.get('state')
  const error = request.nextUrl.searchParams.get('error')

  if (error) {
    return NextResponse.redirect(new URL('/accounts?error=oauth_denied', request.url))
  }

  if (!code || !state) {
    return NextResponse.redirect(new URL('/accounts?error=missing_params', request.url))
  }

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: () => {},
    },
  })

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.redirect(new URL('/accounts?error=unauthorized', request.url))
    }

    const res = await fetch(`${N8N_BASE}/webhook/oauth-callback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-verified-user-id': user.id,
      },
      body: JSON.stringify({ code, state }),
      signal: AbortSignal.timeout(30000),
    })

    const body = await res.json()

    if (body.error) {
      const msg = encodeURIComponent(body.error)
      return NextResponse.redirect(new URL(`/accounts?error=${msg}`, request.url))
    }

    return NextResponse.redirect(new URL('/accounts?success=connected', request.url))
  } catch {
    return NextResponse.redirect(new URL('/accounts?error=callback_failed', request.url))
  }
}
