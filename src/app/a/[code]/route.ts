import { NextResponse, type NextRequest } from "next/server";
import {
  AFFILIATE_COOKIE,
  AFFILIATE_EXPIRES_COOKIE,
  AFFILIATE_VISITOR_COOKIE,
  ATTRIBUTION_WINDOW_DAYS,
  affiliateCookieOptions,
  normalizeAffiliateCode,
} from "@/lib/affiliates/constants";
import { readAffiliateCookieFromRequest, safeInternalPath } from "@/lib/affiliates/cookies";
import { findActiveAffiliateByCode, recordAffiliateVisit } from "@/lib/affiliates/tracking";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ code: string }> }
) {
  const { code: rawCode } = await context.params;
  const code = normalizeAffiliateCode(rawCode);
  const next = safeInternalPath(request.nextUrl.searchParams.get("next"));
  const destination = new URL(next, request.url);
  if (!code) return NextResponse.redirect(destination);

  const existing = readAffiliateCookieFromRequest(request);
  if (existing && existing.code !== code) {
    return NextResponse.redirect(destination);
  }

  let affiliate: Awaited<ReturnType<typeof findActiveAffiliateByCode>> = null;
  try {
    affiliate = await findActiveAffiliateByCode(code);
  } catch (error) {
    console.error("[affiliate] lookup failed:", error);
    return NextResponse.redirect(destination);
  }
  if (!affiliate) return NextResponse.redirect(destination);

  const now = Date.now();
  const expiresAt =
    existing?.code === code ? existing.expiresAt : new Date(now + ATTRIBUTION_WINDOW_DAYS * 24 * 60 * 60 * 1000);
  const visitorId = existing?.code === code ? existing.visitorId : crypto.randomUUID();
  const response = NextResponse.redirect(destination);
  const maxAge = Math.floor((expiresAt.getTime() - now) / 1000);
  const options = affiliateCookieOptions(maxAge);
  response.cookies.set(AFFILIATE_COOKIE, code, options);
  response.cookies.set(AFFILIATE_VISITOR_COOKIE, visitorId, options);
  response.cookies.set(AFFILIATE_EXPIRES_COOKIE, String(expiresAt.getTime()), options);

  try {
    await recordAffiliateVisit({
      code,
      visitorId,
      expiresAt,
      landingPath: next,
      referrer: request.headers.get("referer"),
    });
  } catch (error) {
    console.error("[affiliate] visit failed:", error);
  }

  return response;
}
