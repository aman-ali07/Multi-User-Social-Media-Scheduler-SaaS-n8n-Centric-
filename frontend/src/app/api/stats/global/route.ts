import { NextResponse } from 'next/server'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function GET() {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_global_stats`, {
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
      },
    })

    if (!res.ok) {
      return NextResponse.json([
        { label: 'Posts Published', value: 0, suffix: '+' },
        { label: 'Accounts Connected', value: 0, suffix: '+' },
        { label: 'Avg. Uptime', value: 0, suffix: '%' },
        { label: 'Active Users', value: 0, suffix: '+' },
      ])
    }

    const data: {
      postsPublished: number
      accountsConnected: number
      avgUptime: number
      activeUsers: number
    } = await res.json()

    return NextResponse.json([
      { label: 'Posts Published', value: data.postsPublished, suffix: '+' },
      { label: 'Accounts Connected', value: data.accountsConnected, suffix: '+' },
      { label: 'Avg. Uptime', value: data.avgUptime, suffix: '%' },
      { label: 'Active Users', value: data.activeUsers, suffix: '+' },
    ])
  } catch {
    return NextResponse.json([
      { label: 'Posts Published', value: 0, suffix: '+' },
      { label: 'Accounts Connected', value: 0, suffix: '+' },
      { label: 'Avg. Uptime', value: 0, suffix: '%' },
      { label: 'Active Users', value: 0, suffix: '+' },
    ])
  }
}
