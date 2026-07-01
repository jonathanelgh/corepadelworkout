import type { SupabaseClient } from "@supabase/supabase-js";
import { getIsAdminUser } from "@/utils/supabase/is-admin";

export type MemberSubscriptionStatus = {
  hasActivePro: boolean;
  planName: string | null;
  status: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  hasStripeCustomer: boolean;
};

type SubRow = {
  status: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  stripe_customer_id: string | null;
  subscription_plans: { name: string; grants_all_programs: boolean } | { name: string; grants_all_programs: boolean }[] | null;
};

function planMeta(sub: SubRow): { name: string; grantsAll: boolean } | null {
  const p = sub.subscription_plans;
  if (p == null) return null;
  const row = Array.isArray(p) ? p[0] : p;
  if (!row) return null;
  return { name: row.name, grantsAll: Boolean(row.grants_all_programs) };
}

const ADMIN_PRO_STATUS: MemberSubscriptionStatus = {
  hasActivePro: true,
  planName: "Admin",
  status: "active",
  currentPeriodEnd: null,
  cancelAtPeriodEnd: false,
  hasStripeCustomer: false,
};

export async function loadMemberSubscriptionStatus(
  supabase: SupabaseClient,
  userId: string
): Promise<MemberSubscriptionStatus> {
  if (await getIsAdminUser(supabase, userId)) {
    return ADMIN_PRO_STATUS;
  }

  const { data, error } = await supabase
    .from("customer_subscriptions")
    .select(
      "status, current_period_end, cancel_at_period_end, stripe_customer_id, subscription_plans!inner ( name, grants_all_programs )"
    )
    .eq("user_id", userId)
    .order("current_period_end", { ascending: false });

  if (error || !data?.length) {
    return {
      hasActivePro: false,
      planName: null,
      status: null,
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
      hasStripeCustomer: false,
    };
  }

  const now = Date.now();
  const rows = data as SubRow[];
  const active = rows.find((row) => {
    const meta = planMeta(row);
    if (!meta?.grantsAll) return false;
    if (row.status !== "active" && row.status !== "trialing") return false;
    const end = new Date(row.current_period_end).getTime();
    return Number.isFinite(end) && end > now;
  });

  const latest = active ?? rows[0]!;
  const meta = planMeta(latest);

  return {
    hasActivePro: Boolean(active),
    planName: meta?.name ?? null,
    status: latest.status,
    currentPeriodEnd: latest.current_period_end,
    cancelAtPeriodEnd: latest.cancel_at_period_end,
    hasStripeCustomer: Boolean(latest.stripe_customer_id?.trim()),
  };
}
