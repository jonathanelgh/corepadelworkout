"use server";

import { revalidatePath } from "next/cache";
import {
  createAffiliateDiscount,
  normalizeDiscountCode,
  setAffiliateDiscountActive,
} from "@/lib/affiliates/discounts";
import { createClient } from "@/utils/supabase/server";

async function requireAffiliate(): Promise<{ id: string; commissionPercent: number } | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("affiliates")
    .select("id, commission_percent")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!data) return null;
  return { id: data.id, commissionPercent: Number(data.commission_percent) };
}

export async function createDiscountAction(
  _prev: { error?: string; created?: boolean },
  formData: FormData
): Promise<{ error?: string; created?: boolean }> {
  const affiliate = await requireAffiliate();
  if (!affiliate) return { error: "Sign in with your affiliate account." };

  const rawCode = String(formData.get("code") ?? "").trim();
  const code = rawCode ? normalizeDiscountCode(rawCode) : null;
  if (rawCode && !code) return { error: "Use 4 to 20 letters or numbers, with no spaces." };

  const percent = Number(formData.get("percent"));
  const expiry = String(formData.get("expires_on") ?? "").trim();
  const expiresAt = expiry ? `${expiry}T23:59:59.000Z` : null;

  const result = await createAffiliateDiscount({
    affiliateId: affiliate.id,
    commissionPercent: affiliate.commissionPercent,
    code,
    percent,
    expiresAt,
  });
  if (result.error) return result;
  revalidatePath("/affiliate/discounts");
  return { created: true };
}

export async function setDiscountActiveAction(
  _prev: { error?: string },
  formData: FormData
): Promise<{ error?: string }> {
  const affiliate = await requireAffiliate();
  if (!affiliate) return { error: "Sign in with your affiliate account." };
  const discountId = String(formData.get("id") ?? "");
  const active = String(formData.get("active") ?? "") === "true";
  if (!discountId) return { error: "Missing discount." };
  const result = await setAffiliateDiscountActive({
    affiliateId: affiliate.id,
    discountId,
    active,
  });
  if (!result.error) revalidatePath("/affiliate/discounts");
  return result;
}
