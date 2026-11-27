import type { SupabaseClient } from "@supabase/supabase-js";
import QRCode from "qrcode";
import { proPassStatus, type ProPassRow } from "@/lib/billing/pro-pass-types";
import { buildSignupOfferUrl } from "@/lib/billing/signup-offer";

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export type { ProPassRow, ProPassStatus } from "@/lib/billing/pro-pass-types";
export { PRO_PASS_BATCH_MAX, PRO_PASS_MONTHS, proPassStatus } from "@/lib/billing/pro-pass-types";

type OfferRow = {
  id: string;
  code: string;
  months: number;
  active: boolean;
  expires_at: string | null;
  created_at: string;
};

export function generateProPassCode(): string {
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  let body = "";
  for (const byte of bytes) {
    body += CODE_ALPHABET[byte % CODE_ALPHABET.length];
  }
  return `P12-${body}`;
}

export async function renderProPassQrPng(code: string): Promise<Buffer> {
  const url = buildSignupOfferUrl(code);
  return QRCode.toBuffer(url, {
    type: "png",
    margin: 2,
    width: 1200,
    errorCorrectionLevel: "M",
    color: { dark: "#000000", light: "#ffffff" },
  });
}

export async function loadProPasses(supabase: SupabaseClient): Promise<ProPassRow[]> {
  const { data: offers, error } = await supabase
    .from("signup_offers")
    .select("id, code, months, active, expires_at, created_at, max_redemptions")
    .eq("max_redemptions", 1)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  const rows = (offers ?? []) as OfferRow[];
  if (rows.length === 0) return [];

  const ids = rows.map((row) => row.id);
  const { data: redemptions, error: redeemErr } = await supabase
    .from("signup_offer_redemptions")
    .select("offer_id, user_id, redeemed_at")
    .in("offer_id", ids);

  if (redeemErr) throw new Error(redeemErr.message);

  const redemptionByOffer = new Map<
    string,
    { user_id: string; redeemed_at: string }
  >();
  for (const row of redemptions ?? []) {
    const offerId = row.offer_id as string;
    if (!redemptionByOffer.has(offerId)) {
      redemptionByOffer.set(offerId, {
        user_id: row.user_id as string,
        redeemed_at: row.redeemed_at as string,
      });
    }
  }

  const userIds = [...new Set([...redemptionByOffer.values()].map((row) => row.user_id))];
  const profileById = new Map<string, { full_name: string | null; email: string | null }>();
  if (userIds.length > 0) {
    const { data: profiles, error: profileErr } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .in("id", userIds);
    if (profileErr) throw new Error(profileErr.message);
    for (const profile of profiles ?? []) {
      profileById.set(profile.id as string, {
        full_name: (profile.full_name as string | null) ?? null,
        email: (profile.email as string | null) ?? null,
      });
    }
  }

  return rows.map((row) => {
    const redemption = redemptionByOffer.get(row.id) ?? null;
    const profile = redemption ? profileById.get(redemption.user_id) : null;
    return {
      id: row.id,
      code: row.code,
      months: row.months,
      active: row.active,
      expires_at: row.expires_at,
      created_at: row.created_at,
      status: proPassStatus({
        active: row.active,
        expires_at: row.expires_at,
        redeemed: Boolean(redemption),
      }),
      redeemed_at: redemption?.redeemed_at ?? null,
      redeemed_by_name: profile?.full_name ?? null,
      redeemed_by_email: profile?.email ?? null,
    };
  });
}
