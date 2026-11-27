export const AFFILIATE_QUERY_PARAM = "aff";
export const AFFILIATE_COOKIE = "cpw_aff";
export const AFFILIATE_VISITOR_COOKIE = "cpw_aff_vid";
export const AFFILIATE_EXPIRES_COOKIE = "cpw_aff_exp";

/** How long a first visit can still become a signup or subscription. */
export const ATTRIBUTION_WINDOW_DAYS = 30;

export const AFFILIATE_CODE_PATTERN = /^[A-Z0-9]{6,12}$/;

export function normalizeAffiliateCode(raw: string | null | undefined): string | null {
  const code = raw?.trim().toUpperCase() ?? "";
  if (!AFFILIATE_CODE_PATTERN.test(code)) return null;
  return code;
}

export function affiliateCookieOptions(maxAgeSeconds: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: Math.max(60, maxAgeSeconds),
  };
}

export function addMonths(date: Date, months: number): Date {
  const next = new Date(date.getTime());
  const day = next.getUTCDate();
  next.setUTCMonth(next.getUTCMonth() + months);
  if (next.getUTCDate() < day) next.setUTCDate(0);
  return next;
}
