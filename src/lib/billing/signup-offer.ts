import type { SupabaseClient } from "@supabase/supabase-js";
import {
  ADMIN_PRO_GRANT_MONTHS,
  grantProSubscriptionToUser,
  type AdminProGrantMonths,
} from "@/lib/admin/manage-pro-subscription";
import { getPublicSiteUrl } from "@/lib/stripe/config";
import { createServiceClient } from "@/utils/supabase/service";

export const SIGNUP_OFFER_PARAM = "offer";
export const SIGNUP_OFFER_CODE_PARAM = "code";
export const FREE_PRO_OFFER = "free-pro";

const OFFER_CODE_PATTERN = /^[A-Z0-9-]{2,40}$/;

export type SignupOfferRow = {
  id: string;
  code: string;
  name: string;
  months: AdminProGrantMonths;
  active: boolean;
  max_redemptions: number | null;
  expires_at: string | null;
  created_at: string;
  redemption_count: number;
};

export function normalizeSignupOfferCode(raw: string | null | undefined): string | null {
  const trimmed = raw?.trim();
  if (!trimmed) return null;
  const code = trimmed.toUpperCase();
  if (!OFFER_CODE_PATTERN.test(code)) return null;
  return code;
}

export function buildSignupOfferUrl(code: string, siteUrl?: string): string {
  const base = (siteUrl ?? getPublicSiteUrl()).replace(/\/$/, "");
  const normalized = normalizeSignupOfferCode(code);
  if (!normalized) throw new Error("Invalid signup offer code.");
  const params = new URLSearchParams({
    [SIGNUP_OFFER_PARAM]: FREE_PRO_OFFER,
    [SIGNUP_OFFER_CODE_PARAM]: normalized,
  });
  return `${base}/signup?${params.toString()}`;
}

export function parseSignupOfferFromSearchParams(
  get: (key: string) => string | null
): string | null {
  if (get(SIGNUP_OFFER_PARAM) !== FREE_PRO_OFFER) return null;
  return normalizeSignupOfferCode(get(SIGNUP_OFFER_CODE_PARAM));
}

type OfferLookup = {
  id: string;
  code: string;
  name: string;
  months: number;
  active: boolean;
  max_redemptions: number | null;
  expires_at: string | null;
};

async function loadOfferByCode(code: string): Promise<OfferLookup | null> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("signup_offers")
    .select("id, code, name, months, active, max_redemptions, expires_at")
    .eq("code", code)
    .maybeSingle();

  if (error || !data) return null;
  return data as OfferLookup;
}

async function countRedemptions(offerId: string): Promise<number> {
  const supabase = createServiceClient();
  const { count, error } = await supabase
    .from("signup_offer_redemptions")
    .select("id", { count: "exact", head: true })
    .eq("offer_id", offerId);

  if (error) throw new Error(error.message);
  return count ?? 0;
}

export async function validateSignupOfferCode(
  codeRaw: string
): Promise<
  | { ok: true; offerId: string; code: string; name: string; months: AdminProGrantMonths }
  | { ok: false; error: string }
> {
  const code = normalizeSignupOfferCode(codeRaw);
  if (!code) return { ok: false, error: "This signup offer link is invalid." };

  const offer = await loadOfferByCode(code);
  if (!offer || !offer.active) {
    return { ok: false, error: "This signup offer is not valid." };
  }

  if (!ADMIN_PRO_GRANT_MONTHS.includes(offer.months as AdminProGrantMonths)) {
    return { ok: false, error: "This signup offer is misconfigured." };
  }

  if (offer.expires_at && new Date(offer.expires_at).getTime() <= Date.now()) {
    return { ok: false, error: "This signup offer has expired." };
  }

  if (offer.max_redemptions != null) {
    const used = await countRedemptions(offer.id);
    if (used >= offer.max_redemptions) {
      return { ok: false, error: "This signup offer has reached its redemption limit." };
    }
  }

  return {
    ok: true,
    offerId: offer.id,
    code: offer.code,
    name: offer.name,
    months: offer.months as AdminProGrantMonths,
  };
}

/** Grant free Pro for a validated signup offer (no Stripe). One redemption per user. */
export async function redeemSignupOfferPro(input: {
  userId: string;
  code: string;
}): Promise<{ ok: true; months: AdminProGrantMonths } | { ok: false; error: string }> {
  const validation = await validateSignupOfferCode(input.code);
  if (!validation.ok) return validation;

  const supabase = createServiceClient();

  const { data: existing } = await supabase
    .from("signup_offer_redemptions")
    .select("id")
    .eq("offer_id", validation.offerId)
    .eq("user_id", input.userId)
    .maybeSingle();

  if (existing) {
    return { ok: true, months: validation.months };
  }

  // Re-check cap under concurrency before insert.
  const offer = await loadOfferByCode(validation.code);
  if (offer?.max_redemptions != null) {
    const used = await countRedemptions(offer.id);
    if (used >= offer.max_redemptions) {
      return { ok: false, error: "This signup offer has reached its redemption limit." };
    }
  }

  const grant = await grantProSubscriptionToUser({
    userId: input.userId,
    months: validation.months,
  });
  if (!grant.ok) return grant;

  const { error: redeemErr } = await supabase.from("signup_offer_redemptions").insert({
    offer_id: validation.offerId,
    user_id: input.userId,
  });

  if (redeemErr) {
    // Unique violation = already redeemed (race); treat as success.
    if (redeemErr.code === "23505") {
      return { ok: true, months: validation.months };
    }
    return { ok: false, error: redeemErr.message };
  }

  return { ok: true, months: validation.months };
}

export async function loadSignupOffers(
  supabase: SupabaseClient
): Promise<SignupOfferRow[]> {
  const { data: offers, error } = await supabase
    .from("signup_offers")
    .select("id, code, name, months, active, max_redemptions, expires_at, created_at")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  const rows = (offers ?? []) as Omit<SignupOfferRow, "redemption_count">[];
  if (rows.length === 0) return [];

  const ids = rows.map((r) => r.id);
  const { data: redemptions, error: redeemErr } = await supabase
    .from("signup_offer_redemptions")
    .select("offer_id")
    .in("offer_id", ids);

  if (redeemErr) throw new Error(redeemErr.message);

  const counts = new Map<string, number>();
  for (const row of redemptions ?? []) {
    const offerId = (row as { offer_id: string }).offer_id;
    counts.set(offerId, (counts.get(offerId) ?? 0) + 1);
  }

  return rows.map((row) => ({
    ...row,
    months: row.months as AdminProGrantMonths,
    redemption_count: counts.get(row.id) ?? 0,
  }));
}
