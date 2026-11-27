import { affiliateLink } from "@/lib/affiliates/links";
import type { AffiliateProfile } from "@/lib/affiliates/types";
import { createServiceClient } from "@/utils/supabase/service";

export type AdminAffiliateRow = AffiliateProfile & {
  link: string;
  clicks: number;
  signups: number;
  subscribers: number;
  commissionCents: number;
  balanceCents: number;
  currency: string;
};

export async function loadAdminAffiliates(): Promise<AdminAffiliateRow[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("affiliates")
    .select(
      "id, user_id, code, display_name, email, phone, instagram, youtube, facebook, tiktok, website, notes, status, commission_percent, commission_months, created_at"
    )
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  const affiliates = data ?? [];
  if (affiliates.length === 0) return [];

  const ids = affiliates.map((row) => row.id);
  const [clicks, attributions, commissions, payouts] = await Promise.all([
    supabase.from("affiliate_clicks").select("affiliate_id").in("affiliate_id", ids),
    supabase
      .from("affiliate_attributions")
      .select("affiliate_id, user_id, subscription_started_at")
      .in("affiliate_id", ids),
    supabase
      .from("affiliate_commissions")
      .select("affiliate_id, commission_cents, currency, payout_id")
      .in("affiliate_id", ids),
    supabase.from("affiliate_payouts").select("affiliate_id, amount_cents, currency, status").in("affiliate_id", ids),
  ]);

  return affiliates.map((row) => {
    const commissionRows = (commissions.data ?? []).filter((item) => item.affiliate_id === row.id);
    const currency = commissionRows[0]?.currency ?? "eur";
    const commissionCents = commissionRows
      .filter((item) => item.currency === currency)
      .reduce((sum, item) => sum + item.commission_cents, 0);
    const paidCents = (payouts.data ?? [])
      .filter((item) => item.affiliate_id === row.id && item.status === "paid" && item.currency === currency)
      .reduce((sum, item) => sum + item.amount_cents, 0);
    const attributed = (attributions.data ?? []).filter((item) => item.affiliate_id === row.id);
    return {
      id: row.id,
      user_id: row.user_id,
      code: row.code,
      display_name: row.display_name,
      email: row.email,
      phone: row.phone,
      instagram: row.instagram,
      youtube: row.youtube,
      facebook: row.facebook,
      tiktok: row.tiktok,
      website: row.website,
      notes: row.notes,
      status: row.status === "paused" ? "paused" : "active",
      commission_percent: Number(row.commission_percent),
      commission_months: Number(row.commission_months),
      created_at: row.created_at,
      link: affiliateLink(row.code),
      clicks: (clicks.data ?? []).filter((item) => item.affiliate_id === row.id).length,
      signups: attributed.filter((item) => item.user_id).length,
      subscribers: attributed.filter((item) => item.subscription_started_at).length,
      commissionCents,
      balanceCents: Math.max(0, commissionCents - paidCents),
      currency,
    };
  });
}

export type AdminAffiliateDetail = {
  profile: AffiliateProfile;
  link: string;
  clicks: number;
  signups: number;
  subscribers: number;
  commissionCents: number;
  balanceCents: number;
  currency: string;
  referrals: Array<{
    id: string;
    name: string;
    email: string;
    firstTouchAt: string;
    expiresAt: string;
    subscribedAt: string | null;
    commissionEndsAt: string | null;
    commissionCents: number;
  }>;
  payouts: Array<{
    id: string;
    amount_cents: number;
    currency: string;
    paid_at: string | null;
    period_label: string | null;
    notes: string | null;
  }>;
};

export async function loadAdminAffiliate(id: string): Promise<AdminAffiliateDetail | null> {
  const supabase = createServiceClient();
  const { data: row, error } = await supabase
    .from("affiliates")
    .select(
      "id, user_id, code, display_name, email, phone, instagram, youtube, facebook, tiktok, website, notes, status, commission_percent, commission_months, created_at"
    )
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!row) return null;

  const [clicks, attributions, commissions, payouts] = await Promise.all([
    supabase
      .from("affiliate_clicks")
      .select("id", { count: "exact", head: true })
      .eq("affiliate_id", id),
    supabase
      .from("affiliate_attributions")
      .select(
        "id, user_id, first_touch_at, expires_at, subscription_started_at, commission_ends_at"
      )
      .eq("affiliate_id", id)
      .order("first_touch_at", { ascending: false })
      .limit(200),
    supabase
      .from("affiliate_commissions")
      .select("user_id, commission_cents, currency, payout_id")
      .eq("affiliate_id", id),
    supabase
      .from("affiliate_payouts")
      .select("id, amount_cents, currency, paid_at, period_label, notes")
      .eq("affiliate_id", id)
      .order("created_at", { ascending: false }),
  ]);

  const userIds = (attributions.data ?? [])
    .map((item) => item.user_id)
    .filter((value): value is string => Boolean(value));
  const { data: profiles } = userIds.length
    ? await supabase.from("profiles").select("id, full_name, email").in("id", userIds)
    : { data: [] };
  const profileById = new Map((profiles ?? []).map((profile) => [profile.id, profile]));
  const commissionRows = commissions.data ?? [];
  const currency = commissionRows[0]?.currency ?? "eur";
  const commissionCents = commissionRows
    .filter((item) => item.currency === currency)
    .reduce((sum, item) => sum + item.commission_cents, 0);
  const paidCents = (payouts.data ?? [])
    .filter((item) => item.currency === currency)
    .reduce((sum, item) => sum + item.amount_cents, 0);

  return {
    profile: {
      id: row.id,
      user_id: row.user_id,
      code: row.code,
      display_name: row.display_name,
      email: row.email,
      phone: row.phone,
      instagram: row.instagram,
      youtube: row.youtube,
      facebook: row.facebook,
      tiktok: row.tiktok,
      website: row.website,
      notes: row.notes,
      status: row.status === "paused" ? "paused" : "active",
      commission_percent: Number(row.commission_percent),
      commission_months: Number(row.commission_months),
      created_at: row.created_at,
    },
    link: affiliateLink(row.code),
    clicks: clicks.count ?? 0,
    signups: (attributions.data ?? []).filter((item) => item.user_id).length,
    subscribers: (attributions.data ?? []).filter((item) => item.subscription_started_at).length,
    commissionCents,
    balanceCents: Math.max(0, commissionCents - paidCents),
    currency,
    referrals: (attributions.data ?? [])
      .filter((item) => item.user_id)
      .map((item) => {
        const profile = item.user_id ? profileById.get(item.user_id) : undefined;
        const earned = commissionRows
          .filter((sale) => sale.user_id === item.user_id && sale.currency === currency)
          .reduce((sum, sale) => sum + sale.commission_cents, 0);
        return {
          id: item.id,
          name: profile?.full_name?.trim() || "Player",
          email: profile?.email || "-",
          firstTouchAt: item.first_touch_at,
          expiresAt: item.expires_at,
          subscribedAt: item.subscription_started_at,
          commissionEndsAt: item.commission_ends_at,
          commissionCents: earned,
        };
      }),
    payouts: payouts.data ?? [],
  };
}
