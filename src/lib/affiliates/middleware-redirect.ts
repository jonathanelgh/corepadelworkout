import { NextResponse, type NextRequest } from "next/server";
import { AFFILIATE_QUERY_PARAM, normalizeAffiliateCode } from "@/lib/affiliates/constants";
import { readAffiliateCookieFromRequest, safeInternalPath } from "@/lib/affiliates/cookies";

/** Send `?aff=CODE` to the tracking route without replacing an open referral. */
export function redirectForAffiliateParam(request: NextRequest): NextResponse | null {
  if (request.nextUrl.pathname.startsWith("/a/")) return null;
  const code = normalizeAffiliateCode(request.nextUrl.searchParams.get(AFFILIATE_QUERY_PARAM));
  if (!code) return null;

  const existing = readAffiliateCookieFromRequest(request);
  if (existing && existing.code !== code) {
    const stay = request.nextUrl.clone();
    stay.searchParams.delete(AFFILIATE_QUERY_PARAM);
    return NextResponse.redirect(stay);
  }

  const params = request.nextUrl.searchParams;
  const rest = new URLSearchParams(params);
  rest.delete(AFFILIATE_QUERY_PARAM);
  const nextPath = safeInternalPath(
    `${request.nextUrl.pathname}${rest.size > 0 ? `?${rest.toString()}` : ""}`
  );
  const destination = request.nextUrl.clone();
  destination.pathname = `/a/${code}`;
  destination.search = "";
  if (nextPath !== "/") destination.searchParams.set("next", nextPath);
  return NextResponse.redirect(destination);
}
