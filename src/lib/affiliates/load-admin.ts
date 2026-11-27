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

export type AffiliateSubscriptionRow = {
  id: string;
  affiliateId: string;
  affiliateName: string;
  playerName: string;
  email: string;
  startedAt: string;
  status: string;
  periodEnd: string | null;
  commissionEndsAt: string | null;
  commissionCents: number;
  currency: string;
};

const STATUS_LABEL: Record<string, string> = {
  active: "Active",
  trialing: "Trialing",
  canceled: "Canceled",
  past_due: "Past due",
  incomplete: "Incomplete",
  unpaid: "Unpaid",
};

export async function loadAffiliateSubscriptions(): Promise<AffiliateSubscriptionRow[]> {
  const supabase = createServiceClient();
  const { data: attributions, error } = await supabase
    .from("affiliate_attributions")
    .select(
      "id, affiliate_id, user_id, subscription_started_at, stripe_subscription_id, commission_ends_at"
    )
    .not("subscription_started_at", "is", null)
    .order("subscription_started_at", { ascending: false })
    .limit(500);
  if (error) throw new Error(error.message);
  const rows = attributions ?? [];
  if (rows.length === 0) return [];

  const affiliateIds = [...new Set(rows.map((row) => row.affiliate_id))];
  const userIds = rows.map((row) => row.user_id).filter((value): value is string => Boolean(value));
  const subscriptionIds = rows
    .map((row) => row.stripe_subscription_id)
    .filter((value): value is string => Boolean(value));

  const [affiliates, profiles, subscriptions, commissions] = await Promise.all([
    supabase.from("affiliates").select("id, display_name").in("id", affiliateIds),
    userIds.length
      ? supabase.from("profiles").select("id, full_name, email").in("id", userIds)
      : Promise.resolve({ data: [], error: null }),
    subscriptionIds.length
      ? supabase
          .from("customer_subscriptions")
          .select("stripe_subscription_id, status, current_period_end")
          .in("stripe_subscription_id", subscriptionIds)
      : Promise.resolve({ data: [], error: null }),
    userIds.length
      ? supabase
          .from("affiliate_commissions")
          .select("user_id, commission_cents, currency")
          .in("user_id", userIds)
      : Promise.resolve({ data: [], error: null }),
  ]);
  for (const result of [affiliates, profiles, subscriptions, commissions]) {
    if (result.error) throw new Error(result.error.message);
  }

  const affiliateById = new Map((affiliates.data ?? []).map((row) => [row.id, row.display_name]));
  const profileById = new Map((profiles.data ?? []).map((row) => [row.id, row]));
  const subscriptionById = new Map(
    (subscriptions.data ?? []).map((row) => [row.stripe_subscription_id, row])
  );

  return rows.map((row) => {
    const profile = row.user_id ? profileById.get(row.user_id) : undefined;
    const subscription = row.stripe_subscription_id
      ? subscriptionById.get(row.stripe_subscription_id)
      : undefined;
    const earned = (commissions.data ?? []).filter((item) => item.user_id === row.user_id);
    const currency = earned[0]?.currency ?? "eur";
    return {
      id: row.id,
      affiliateId: row.affiliate_id,
      affiliateName: affiliateById.get(row.affiliate_id) ?? "Affiliate",
      playerName: profile?.full_name?.trim() || "Player",
      email: profile?.email || "-",
      startedAt: row.subscription_started_at as string,
      status: STATUS_LABEL[subscription?.status ?? ""] ?? "Started",
      periodEnd: subscription?.current_period_end ?? null,
      commissionEndsAt: row.commission_ends_at,
      commissionCents: earned
        .filter((item) => item.currency === currency)
        .reduce((sum, item) => sum + item.commission_cents, 0),
      currency,
    };
  });
}
