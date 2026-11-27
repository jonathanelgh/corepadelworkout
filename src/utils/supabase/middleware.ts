import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { attachPromoCookieFromRequest } from '@/lib/billing/promo-cookie'
import { getHasActivePro } from '@/lib/member/has-active-pro'
import { isCourtWarmupFunnelPath } from '@/lib/programs/court-warmup-funnel'

type SigningKeys = { keys: { kid?: string }[] }
let signingKeys: { keys: SigningKeys["keys"]; fetchedAt: number } | null = null

async function getSigningKeys(): Promise<SigningKeys> {
  if (signingKeys && Date.now() - signingKeys.fetchedAt < 10 * 60 * 1000) {
    return { keys: signingKeys.keys }
  }
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/.well-known/jwks.json`
  )
  if (!response.ok) return { keys: [] }
  const body = (await response.json()) as SigningKeys
  const keys = Array.isArray(body.keys) ? body.keys : []
  signingKeys = { keys, fetchedAt: Date.now() }
  return { keys }
}

export async function updateSession(request: NextRequest) {
  const signing = await getSigningKeys()
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

  // Verify the session locally when the project uses an asymmetric signing key.
  // getUser() asks the Auth server on every click.
  const { data: claimsData } = await supabase.auth.getClaims(undefined, {
    jwks: signing.keys.length > 0 ? signing : undefined,
  })
  const userId = typeof claimsData?.claims.sub === "string" ? claimsData.claims.sub : null

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

  if (isAdminRoute && !userId) {
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    url.searchParams.set("next", `${path}${request.nextUrl.search}`)
    return withSessionCookies(NextResponse.redirect(url))
  }

  if (isAdminRoute && userId) {
    const { data: adminRow } = await supabase
      .from("admin_users")
      .select("user_id")
      .eq("user_id", userId)
      .maybeSingle()

    if (!adminRow) {
      const url = request.nextUrl.clone()
      url.pathname = "/member"
      return withSessionCookies(NextResponse.redirect(url))
    }
  }

  if (userId && (isLoginRoute || isSignupRoute)) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("onboarding_completed_at")
      .eq("id", userId)
      .maybeSingle()

    const next = request.nextUrl.searchParams.get("next")
    const safeNext =
      next && next.startsWith("/") && !next.startsWith("//") ? next : null

    const onboarded = Boolean(profile?.onboarding_completed_at)
    const hasPro = onboarded ? await getHasActivePro(supabase, userId) : false
    const target = !onboarded
      ? "/onboarding"
      : !hasPro
        ? "/subscribe"
        : safeNext && isCourtWarmupFunnelPath(safeNext)
          ? safeNext
          : safeNext ?? "/member"

    return withSessionCookies(NextResponse.redirect(new URL(target, request.url)))
  }

  return attachPromoCookieFromRequest(request, supabaseResponse)
}
