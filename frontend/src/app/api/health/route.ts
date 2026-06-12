import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const checks: Record<string, string> = {}
  let healthy = true

  // Check required env vars
  const required = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'NEXT_PUBLIC_N8N_WEBHOOK_URL',
    'NEXT_PUBLIC_SITE_URL',
  ]

  for (const key of required) {
    checks[key] = process.env[key] ? 'present' : 'missing'
    if (!process.env[key]) healthy = false
  }

  return NextResponse.json({
    status: healthy ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    checks,
  })
}
