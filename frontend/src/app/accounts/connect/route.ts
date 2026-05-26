import { NextRequest, NextResponse } from 'next/server'

const N8N_BASE = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL?.replace(/\/$/, '')

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

  try {
    const res = await fetch(`${N8N_BASE}/webhook/oauth-callback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, state }),
    })

    if (!res.ok) {
      return NextResponse.redirect(new URL('/accounts?error=callback_failed', request.url))
    }

    return NextResponse.redirect(new URL('/accounts?success=connected', request.url))
  } catch {
    return NextResponse.redirect(new URL('/accounts?error=callback_failed', request.url))
  }
}
