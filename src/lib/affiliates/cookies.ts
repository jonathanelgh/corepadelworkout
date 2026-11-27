import type { NextRequest } from "next/server";
import {
  AFFILIATE_COOKIE,
  AFFILIATE_EXPIRES_COOKIE,
  AFFILIATE_VISITOR_COOKIE,
  normalizeAffiliateCode,
} from "@/lib/affiliates/constants";

export type AffiliateCookie = {
  code: string;
  visitorId: string;
  expiresAt: Date;
};

type CookieSource = {
  get(name: string): { value: string } | undefined;
};

const VISITOR_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function readAffiliateCookie(source: CookieSource): AffiliateCookie | null {
  const code = normalizeAffiliateCode(source.get(AFFILIATE_COOKIE)?.value);
  const visitorId = source.get(AFFILIATE_VISITOR_COOKIE)?.value?.trim() ?? "";
  const expiresRaw = Number(source.get(AFFILIATE_EXPIRES_COOKIE)?.value);
  if (!code || !VISITOR_ID.test(visitorId) || !Number.isFinite(expiresRaw)) return null;
  const expiresAt = new Date(expiresRaw);
  if (Number.isNaN(expiresAt.getTime()) || expiresAt.getTime() <= Date.now()) return null;
  return { code, visitorId, expiresAt };
}

export function readAffiliateCookieFromRequest(request: NextRequest): AffiliateCookie | null {
  return readAffiliateCookie(request.cookies);
}

export function safeInternalPath(raw: string | null | undefined): string {
  const value = raw?.trim() ?? "";
  if (!value.startsWith("/") || value.startsWith("//") || value.startsWith("/a/")) return "/";
  if (value.includes("\\") || value.includes("\n")) return "/";
  return value;
}
