import { cookies } from "next/headers";
import type { SupabaseClient } from "@supabase/supabase-js";
import { readAffiliateCookie } from "@/lib/affiliates/cookies";
import { ATTRIBUTION_WINDOW_DAYS } from "@/lib/affiliates/constants";
import { createServiceClient } from "@/utils/supabase/service";

type ActiveAffiliate = {
  id: string;
  commission_percent: number;
  commission_months: number;
};

export async function findActiveAffiliateByCode(
  code: string
): Promise<ActiveAffiliate | null> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("affiliates")
    .select("id, commission_percent, commission_months, status")
    .eq("code", code)
    .maybeSingle();
  if (error || !data || data.status !== "active") return null;
  return {
    id: data.id,
    commission_percent: Number(data.commission_percent),
    commission_months: Number(data.commission_months),
  };
}

export async function recordAffiliateVisit(input: {
  code: string;
  visitorId: string;
  expiresAt: Date;
  landingPath: string;
  referrer: string | null;
}): Promise<void> {
  const affiliate = await findActiveAffiliateByCode(input.code);
  if (!affiliate) return;

  const supabase = createServiceClient();
  const { error: clickError } = await supabase.from("affiliate_clicks").insert({
    affiliate_id: affiliate.id,
    visitor_id: input.visitorId,
    landing_path: input.landingPath.slice(0, 500),
    referrer: input.referrer?.slice(0, 500) ?? null,
  });
  if (clickError) throw new Error(clickError.message);

  const { error: attributionError } = await supabase.from("affiliate_attributions").upsert(
    {
      affiliate_id: affiliate.id,
      visitor_id: input.visitorId,
      first_touch_at: new Date().toISOString(),
      expires_at: input.expiresAt.toISOString(),
      commission_percent: affiliate.commission_percent,
      commission_months: affiliate.commission_months,
    },
    { onConflict: "visitor_id", ignoreDuplicates: true }
  );
  if (attributionError) throw new Error(attributionError.message);
}

/** Tie the signed-in user to the affiliate cookie, without replacing an existing referral. */
export async function attachAffiliateToUser(userId: string): Promise<void> {
  const cookieStore = await cookies();
  const cookie = readAffiliateCookie(cookieStore);
  if (!cookie) return;

  const supabase = createServiceClient();
  const { data: existingUser } = await supabase
    .from("affiliate_attributions")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();
  if (existingUser) return;

  const { data: byVisitor } = await supabase
    .from("affiliate_attributions")
    .select("id, user_id, expires_at, affiliate_id")
    .eq("visitor_id", cookie.visitorId)
    .maybeSingle();

  if (byVisitor) {
    if (byVisitor.user_id && byVisitor.user_id !== userId) return;
    if (new Date(byVisitor.expires_at).getTime() <= Date.now()) return;
    const { error } = await supabase
      .from("affiliate_attributions")
      .update({ user_id: userId })
      .eq("id", byVisitor.id)
      .is("user_id", null);
    if (error) throw new Error(error.message);
    return;
  }

  const affiliate = await findActiveAffiliateByCode(cookie.code);
  if (!affiliate) return;
  const { error } = await supabase.from("affiliate_attributions").insert({
    affiliate_id: affiliate.id,
    visitor_id: cookie.visitorId,
    user_id: userId,
    first_touch_at: new Date().toISOString(),
    expires_at: cookie.expiresAt.toISOString(),
    commission_percent: affiliate.commission_percent,
    commission_months: affiliate.commission_months,
  });
  if (error && !error.message.toLowerCase().includes("duplicate")) {
    throw new Error(error.message);
  }
}

export async function userHasAffiliateAccount(
  supabase: SupabaseClient,
  userId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from("affiliates")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) return false;
  return Boolean(data);
}

export const ATTRIBUTION_WINDOW_LABEL = `${ATTRIBUTION_WINDOW_DAYS} days`;
