import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { attachPromoCookieFromRequest } from '@/lib/billing/promo-cookie'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

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
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  const {
    data: { user },
  } = await supabase.auth.getUser()

  function withSessionCookies(res: NextResponse) {
    supabaseResponse.cookies.getAll().forEach(({ name, value }) => {
      res.cookies.set(name, value)
    })
    return attachPromoCookieFromRequest(request, res)
  }

  const path = request.nextUrl.pathname
  const isAdminRoute = path.startsWith("/admin")
  const isLoginRoute = path === "/login"
  const isSignupRoute = path === "/signup"
  const code = request.nextUrl.searchParams.get("code")

  // Supabase may fall back to Site URL (/) when redirect URLs are not allowlisted.
  if (code && path === "/") {
    const url = request.nextUrl.clone()
    url.pathname = "/auth/recovery"
    return withSessionCookies(NextResponse.redirect(url))
  }

  if (isAdminRoute && !user) {
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    url.searchParams.set("next", `${path}${request.nextUrl.search}`)
    return withSessionCookies(NextResponse.redirect(url))
  }

  if (isAdminRoute && user) {
    const { data: adminRow } = await supabase
      .from("admin_users")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle()

    if (!adminRow) {
      const url = request.nextUrl.clone()
      url.pathname = "/member"
      return withSessionCookies(NextResponse.redirect(url))
    }
  }

  if (user && (isLoginRoute || isSignupRoute)) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("onboarding_completed_at")
      .eq("id", user.id)
      .maybeSingle()

    const next = request.nextUrl.searchParams.get("next")
    const safeNext =
      next && next.startsWith("/") && !next.startsWith("//") ? next : null

    const target = profile?.onboarding_completed_at
      ? safeNext ?? "/member"
      : "/onboarding"

    return withSessionCookies(NextResponse.redirect(new URL(target, request.url)))
  }

  return attachPromoCookieFromRequest(request, supabaseResponse)
}