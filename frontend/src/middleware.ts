import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const consoleRoutes = [
  '/dashboard',
  '/composer',
  '/calendar',
  '/posts',
  '/media',
  '/accounts',
  '/logs',
  '/settings',
]

const authRoutes = ['/auth/login', '/auth/register', '/auth/callback']

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl
  const isApiRoute = pathname.startsWith('/api/')
  const isConsoleRoute = consoleRoutes.some((route) => pathname === route || pathname.startsWith(route + '/'))
  const isAuthRoute = authRoutes.some((route) => pathname === route || pathname.startsWith(route + '/'))

  // API routes that handle their own auth pass through
  if (pathname.startsWith('/api/n8n/') || pathname.startsWith('/api/query') || pathname === '/api/health') {
    return supabaseResponse
  }

  // Other API routes require auth
  if (isApiRoute && !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Page routes
  if (!user) {
    if (isConsoleRoute) {
      const url = request.nextUrl.clone()
      url.pathname = '/'
      return NextResponse.redirect(url)
    }
    return supabaseResponse
  }

  if (user && (pathname === '/' || isAuthRoute)) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon\\.ico|monitoring).*)'],
}
