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

export async function proxy(request: NextRequest) {
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
  const isConsoleRoute = consoleRoutes.some((route) => pathname === route || pathname.startsWith(route + '/'))
  const isAuthRoute = authRoutes.some((route) => pathname === route || pathname.startsWith(route + '/'))
  const isLandingPage = pathname === '/'

  if (!user) {
    if (isConsoleRoute) {
      const url = request.nextUrl.clone()
      url.pathname = '/'
      return NextResponse.redirect(url)
    }
    return supabaseResponse
  }

  if (user && (isLandingPage || isAuthRoute)) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!api/|_next/static|_next/image|favicon\\.ico).*)'],
}
