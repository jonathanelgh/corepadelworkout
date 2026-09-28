"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { getIsAdmin } from "@/utils/supabase/is-admin";
import { createServiceClient } from "@/utils/supabase/service";
import { ADMIN_PRO_GRANT_MONTHS, type AdminProGrantMonths } from "@/lib/admin/manage-pro-subscription";
import {
  buildSignupOfferUrl,
  loadSignupOffers,
  normalizeSignupOfferCode,
  type SignupOfferRow,
} from "@/lib/billing/signup-offer";

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in.", supabase: null as null };
  if (!(await getIsAdmin(supabase))) return { error: "Not authorized.", supabase: null as null };
  return { error: null, supabase };
}

export async function loadOffersForAdmin(): Promise<
  { ok: true; rows: SignupOfferRow[] } | { error: string }
> {
  const auth = await requireAdmin();
  if (auth.error || !auth.supabase) return { error: auth.error ?? "Unauthorized" };

  try {
    const rows = await loadSignupOffers(createServiceClient());
    return { ok: true, rows };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Could not load offers." };
  }
}

export async function createSignupOffer(input: {
  code: string;
  name: string;
  months: number;
  maxRedemptions?: number | null;
  expiresAt?: string | null;
}): Promise<{ ok: true; row: SignupOfferRow; url: string } | { error: string }> {
  const auth = await requireAdmin();
  if (auth.error) return { error: auth.error };

  const code = normalizeSignupOfferCode(input.code);
  if (!code) return { error: "Code must be 2–40 characters: A–Z, 0–9, or hyphen." };

  const name = input.name.trim();
  if (name.length < 2 || name.length > 80) {
    return { error: "Name must be 2–80 characters." };
  }

  if (!ADMIN_PRO_GRANT_MONTHS.includes(input.months as AdminProGrantMonths)) {
    return { error: "Months must be 1, 3, 6, or 12." };
  }

  let maxRedemptions: number | null = null;
  if (input.maxRedemptions != null && input.maxRedemptions !== undefined) {
    const n = Number(input.maxRedemptions);
    if (!Number.isInteger(n) || n < 1) {
      return { error: "Max redemptions must be a positive integer, or empty for unlimited." };
    }
    maxRedemptions = n;
  }

  let expiresAt: string | null = null;
  if (input.expiresAt?.trim()) {
    const d = new Date(input.expiresAt);
    if (Number.isNaN(d.getTime())) return { error: "Invalid expiry date." };
    expiresAt = d.toISOString();
  }

  const service = createServiceClient();
  const { data, error } = await service
    .from("signup_offers")
    .insert({
      code,
      name,
      months: input.months,
      active: true,
      max_redemptions: maxRedemptions,
      expires_at: expiresAt,
    })
    .select("id, code, name, months, active, max_redemptions, expires_at, created_at")
    .single();

  if (error) {
    if (error.code === "23505") return { error: "That code already exists." };
    return { error: error.message };
  }

  revalidatePath("/admin/offers");
  const row: SignupOfferRow = {
    ...(data as Omit<SignupOfferRow, "redemption_count">),
    months: data.months as AdminProGrantMonths,
    redemption_count: 0,
  };
  return { ok: true, row, url: buildSignupOfferUrl(row.code) };
}

export async function setSignupOfferActive(
  offerId: string,
  active: boolean
): Promise<{ ok: true } | { error: string }> {
  const auth = await requireAdmin();
  if (auth.error) return { error: auth.error };

  const id = offerId.trim();
  if (!id) return { error: "Missing offer id." };

  const service = createServiceClient();
  const { error } = await service.from("signup_offers").update({ active }).eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/admin/offers");
  return { ok: true };
}
