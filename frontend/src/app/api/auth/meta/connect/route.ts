import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import crypto from 'crypto'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const FRONTEND_URL = process.env.FRONTEND_URL || process.env.NEXT_PUBLIC_FRONTEND_URL || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID || ''

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const platform = searchParams.get('platform')

  if (platform !== 'facebook' && platform !== 'instagram') {
    return NextResponse.json({ error: 'Invalid platform' }, { status: 400 })
  }

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: () => {},
    },
  })

  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  const state = crypto.randomBytes(32).toString('hex')
  const codeVerifier = crypto.randomBytes(32).toString('hex')
  const codeChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64')
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString()

  const { error: dbError } = await supabase
    .from('oauth_state')
    .insert({
      user_id: user.id,
      platform,
      state,
      code_verifier: codeVerifier,
      expires_at: expiresAt,
    })

  if (dbError) {
    return NextResponse.json({ error: 'Database error: ' + dbError.message }, { status: 500 })
  }

  const base = 'https://www.facebook.com/v21.0/dialog/oauth'
  const params = new URLSearchParams({
    client_id: FACEBOOK_APP_ID,
    redirect_uri: `${FRONTEND_URL}/api/auth/meta/callback`,
    state,
    response_type: 'code',
    code_challenge_method: 'S256',
    code_challenge: codeChallenge,
    scope: 'pages_show_list,pages_manage_posts,pages_read_engagement,instagram_basic,instagram_content_publish',
  })

  return NextResponse.redirect(`${base}?${params.toString()}`)
}
