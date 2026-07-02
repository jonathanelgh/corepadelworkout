import type { NextRequest, NextResponse } from "next/server";

export const PROMO_QUERY_PARAM = "promo";
export const PROMO_COOKIE_NAME = "cpw_promo";
const PROMO_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 14; // 14 days
const PROMO_CODE_PATTERN = /^[A-Z0-9-]{2,40}$/;

export function normalizePromoCode(raw: string | null | undefined): string | null {
  const trimmed = raw?.trim();
  if (!trimmed) return null;
  const code = trimmed.toUpperCase();
  if (!PROMO_CODE_PATTERN.test(code)) return null;
  return code;
}

export function getPromoCookieOptions() {
  return {
    maxAge: PROMO_COOKIE_MAX_AGE_SECONDS,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
  };
}

export function attachPromoCookieFromRequest(
  request: NextRequest,
  response: NextResponse
): NextResponse {
  const code = normalizePromoCode(request.nextUrl.searchParams.get(PROMO_QUERY_PARAM));
  if (!code) return response;
  response.cookies.set(PROMO_COOKIE_NAME, code, getPromoCookieOptions());
  return response;
}
