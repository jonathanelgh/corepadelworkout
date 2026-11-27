import { cache } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  AffiliateCommission,
  AffiliateDayStat,
  AffiliatePayout,
  AffiliateProfile,
} from "@/lib/affiliates/types";

const DAY_COUNT = 30;

function dayKey(iso: string): string {
  return iso.slice(0, 10);
}

function lastDays(count: number): string[] {
  const days: string[] = [];
  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  for (let i = count - 1; i >= 0; i -= 1) {
    const day = new Date(start);
    day.setUTCDate(start.getUTCDate() - i);
    days.push(day.toISOString().slice(0, 10));
  }
  return days;
}

export type AffiliateDashboard = {
  profile: AffiliateProfile;
  link: string;
  clicks: number;
  clicks30: number;
  signups: number;
  subscribers: number;
  salesCount: number;
  salesCents: number;
  commissionCents: number;
  paidCents: number;
  balanceCents: number;
  currency: string;
  days: AffiliateDayStat[];
  sales: AffiliateCommission[];
  payouts: AffiliatePayout[];
};

function mapProfile(row: Record<string, unknown>): AffiliateProfile {
  return {
    id: String(row.id),
    user_id: String(row.user_id),
    code: String(row.code),
    display_name: String(row.display_name),
    email: String(row.email),
    phone: (row.phone as string | null) ?? null,
    instagram: (row.instagram as string | null) ?? null,
    youtube: (row.youtube as string | null) ?? null,
    facebook: (row.facebook as string | null) ?? null,
    tiktok: (row.tiktok as string | null) ?? null,
    website: (row.website as string | null) ?? null,
    notes: (row.notes as string | null) ?? null,
    status: row.status === "paused" ? "paused" : "active",
    commission_percent: Number(row.commission_percent),
    commission_months: Number(row.commission_months),
    created_at: String(row.created_at),
  };
}

export async function loadAffiliateDashboard(
  supabase: SupabaseClient,
  userId: string
): Promise<AffiliateDashboard | null> {
  const { data: profileRow, error } = await supabase
    .from("affiliates")
    .select(
      "id, user_id, code, display_name, email, phone, instagram, youtube, facebook, tiktok, website, notes, status, commission_percent, commission_months, created_at"
    )
    .eq("user_id", userId)
    .maybeSingle();
  if (error || !profileRow) return null;
  const profile = mapProfile(profileRow);
  const since = lastDays(DAY_COUNT)[0];

  const [clicksAll, clicksRecent, attributions, commissions, recentSales, payouts] =
    await Promise.all([
      supabase
        .from("affiliate_clicks")
        .select("id", { count: "exact", head: true })
        .eq("affiliate_id", profile.id),
      supabase
        .from("affiliate_clicks")
        .select("created_at")
        .eq("affiliate_id", profile.id)
        .gte("created_at", `${since}T00:00:00.000Z`),
      supabase
        .from("affiliate_attributions")
        .select("user_id, subscription_started_at")
        .eq("affiliate_id", profile.id),
      supabase
        .from("affiliate_commissions")
        .select("currency, sale_amount_cents, commission_cents, earned_at, payout_id")
        .eq("affiliate_id", profile.id),
      supabase
        .from("affiliate_commissions")
        .select(
          "id, currency, sale_amount_cents, commission_percent, commission_cents, earned_at, payout_id, stripe_invoice_id"
        )
        .eq("affiliate_id", profile.id)
        .order("earned_at", { ascending: false })
        .limit(100),
      supabase
        .from("affiliate_payouts")
        .select("id, amount_cents, currency, status, period_label, notes, paid_at, created_at, report_id")
        .eq("affiliate_id", profile.id)
        .order("created_at", { ascending: false }),
    ]);

  const sales = (commissions.data ?? []) as Array<{
    currency: string;
    sale_amount_cents: number;
    commission_cents: number;
    earned_at: string;
    payout_id: string | null;
  }>;
  const currency = sales[0]?.currency ?? payouts.data?.[0]?.currency ?? "eur";
  const sameCurrency = sales.filter((row) => row.currency === currency);
  const salesCents = sameCurrency.reduce((sum, row) => sum + row.sale_amount_cents, 0);
  const commissionCents = sameCurrency.reduce((sum, row) => sum + row.commission_cents, 0);
  const payoutRows = (payouts.data ?? []) as Array<AffiliatePayout & { report_id: string | null }>;
  const reportIds = [...new Set(payoutRows.map((row) => row.report_id).filter((id): id is string => Boolean(id)))];
  const { data: reports } = reportIds.length
    ? await supabase.from("affiliate_payout_reports").select("id, status").in("id", reportIds)
    : { data: [] };
  const lockedReports = new Set((reports ?? []).filter((row) => row.status === "locked").map((row) => row.id));
  const paidRows = payoutRows.filter((row) => !row.report_id || lockedReports.has(row.report_id));
  const paidCents = paidRows
    .filter((row) => row.status === "paid" && row.currency === currency)
    .reduce((sum, row) => sum + row.amount_cents, 0);

  const days = lastDays(DAY_COUNT).map((date) => ({
    date,
    clicks: 0,
    commissionCents: 0,
    salesCents: 0,
  }));
  const byDate = new Map(days.map((day) => [day.date, day]));
  for (const click of clicksRecent.data ?? []) {
    const bucket = byDate.get(dayKey(click.created_at));
    if (bucket) bucket.clicks += 1;
  }
  for (const sale of sameCurrency) {
    const bucket = byDate.get(dayKey(sale.earned_at));
    if (!bucket) continue;
    bucket.commissionCents += sale.commission_cents;
    bucket.salesCents += sale.sale_amount_cents;
  }

  const attributed = attributions.data ?? [];
  const { affiliateLink } = await import("@/lib/affiliates/links");

  return {
    profile,
    link: affiliateLink(profile.code),
    clicks: clicksAll.count ?? 0,
    clicks30: (clicksRecent.data ?? []).length,
    signups: attributed.filter((row) => row.user_id).length,
    subscribers: attributed.filter((row) => row.subscription_started_at).length,
    salesCount: sameCurrency.length,
    salesCents,
    commissionCents,
    paidCents,
    balanceCents: Math.max(0, commissionCents - paidCents),
    currency,
    days,
    sales: (recentSales.data ?? []) as AffiliateCommission[],
    payouts: paidRows,
  };
}

export const loadRequestAffiliateDashboard = cache(async () => {
  const { createClient, getRequestUser } = await import("@/utils/supabase/server");
  const supabase = await createClient();
  const user = await getRequestUser();
  if (!user) return null;
  return loadAffiliateDashboard(supabase, user.id);
});
