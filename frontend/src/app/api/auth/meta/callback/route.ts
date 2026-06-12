import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const FRONTEND_URL = process.env.FRONTEND_URL || process.env.NEXT_PUBLIC_FRONTEND_URL || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID || ''
const FACEBOOK_APP_SECRET = process.env.FACEBOOK_APP_SECRET || ''

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const errorParam = searchParams.get('error')

  if (errorParam) {
    return NextResponse.redirect(`${FRONTEND_URL}/accounts?error=${errorParam}`)
  }
  if (!code || !state) {
    return NextResponse.redirect(`${FRONTEND_URL}/accounts?error=missing_params`)
  }

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: () => {},
    },
  })

  // 1. Verify state
  const { data: stateData, error: stateError } = await supabase
    .from('oauth_state')
    .select('id, user_id, code_verifier, platform')
    .eq('state', state)
    .eq('used', false)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle()

  if (stateError || !stateData) {
    return NextResponse.redirect(`${FRONTEND_URL}/accounts?error=invalid_state`)
  }

  await supabase.from('oauth_state').update({ used: true }).eq('id', stateData.id)

  // 2. Exchange code for short-lived token
  const shortTokenRes = await fetch('https://graph.facebook.com/v21.0/oauth/access_token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: FACEBOOK_APP_ID,
      client_secret: FACEBOOK_APP_SECRET,
      redirect_uri: `${FRONTEND_URL}/api/auth/meta/callback`,
      code,
      code_verifier: stateData.code_verifier,
    }),
  })

  if (!shortTokenRes.ok) {
    return NextResponse.redirect(`${FRONTEND_URL}/accounts?error=token_exchange_failed`)
  }
  const shortTokenData = await shortTokenRes.json()

  // 3. Exchange short-lived token for long-lived token
  const longTokenRes = await fetch(`https://graph.facebook.com/v21.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${FACEBOOK_APP_ID}&client_secret=${FACEBOOK_APP_SECRET}&fb_exchange_token=${shortTokenData.access_token}`)
  
  if (!longTokenRes.ok) {
    return NextResponse.redirect(`${FRONTEND_URL}/accounts?error=long_lived_token_failed`)
  }
  const longTokenData = await longTokenRes.json()
  const longToken = longTokenData.access_token

  // 4. Fetch pages
  const pagesRes = await fetch('https://graph.facebook.com/v21.0/me/accounts?fields=id,name,access_token,instagram_business_account', {
    headers: { Authorization: `Bearer ${longToken}` },
  })
  
  if (!pagesRes.ok) {
    return NextResponse.redirect(`${FRONTEND_URL}/accounts?error=fetch_pages_failed`)
  }
  
  const pagesData = await pagesRes.json()
  const pages = pagesData.data || []

  // 5. Store in database
  for (const page of pages) {
    if (!page.access_token) continue

    await supabase.rpc('upsert_social_account', {
      p_user_id: stateData.user_id,
      p_platform: stateData.platform,
      p_page_id: page.id,
      p_page_name: page.name,
      p_ig_user_id: page.instagram_business_account?.id || null,
      p_access_token: page.access_token,
      p_expires_at: null,
      p_status: 'active'
    })
  }

  return NextResponse.redirect(`${FRONTEND_URL}/accounts?success=connected`)
}
