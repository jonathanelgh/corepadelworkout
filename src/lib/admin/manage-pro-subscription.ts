import { createServiceClient } from "@/utils/supabase/service";
import { PRO_PLAN_SLUG } from "@/lib/stripe/config";

export const ADMIN_PRO_GRANT_MONTHS = [1, 3, 6, 12] as const;
export type AdminProGrantMonths = (typeof ADMIN_PRO_GRANT_MONTHS)[number];

type ProSubRow = {
  id: string;
  status: string;
  current_period_end: string;
  stripe_subscription_id: string | null;
  subscription_plans: { grants_all_programs: boolean } | { grants_all_programs: boolean }[];
};

function addMonths(date: Date, months: number): Date {
  const out = new Date(date);
  out.setMonth(out.getMonth() + months);
  return out;
}

function isActiveProRow(row: ProSubRow, now: Date): boolean {
  const planRow = Array.isArray(row.subscription_plans)
    ? row.subscription_plans[0]
    : row.subscription_plans;
  if (!planRow?.grants_all_programs) return false;
  if (row.status !== "active" && row.status !== "trialing") return false;
  return new Date(row.current_period_end).getTime() > now.getTime();
}

async function loadProPlanId() {
  const supabase = createServiceClient();
  const { data: plan, error } = await supabase
    .from("subscription_plans")
    .select("id")
    .eq("slug", PRO_PLAN_SLUG)
    .eq("active", true)
    .maybeSingle();

  if (error || !plan) {
    return { error: "Pro plan is not configured." as const, planId: null };
  }
  return { error: null, planId: plan.id as string };
}

export async function grantProSubscriptionToUser(input: {
  userId: string;
  months: AdminProGrantMonths;
}): Promise<{ ok: true; currentPeriodEnd: string } | { ok: false; error: string }> {
  const userId = input.userId.trim();
  if (!userId || !/^[0-9a-f-]{36}$/i.test(userId)) {
    return { ok: false, error: "Invalid user id." };
  }
  if (!ADMIN_PRO_GRANT_MONTHS.includes(input.months)) {
    return { ok: false, error: "Invalid grant duration." };
  }

  const planResult = await loadProPlanId();
  if (planResult.error || !planResult.planId) {
    return { ok: false, error: planResult.error ?? "Pro plan is not configured." };
  }

  const supabase = createServiceClient();
  const now = new Date();
  const grantEnd = addMonths(now, input.months);

  const { data: existingRows, error: loadErr } = await supabase
    .from("customer_subscriptions")
    .select(
      "id, status, current_period_end, stripe_subscription_id, subscription_plans!inner ( grants_all_programs )"
    )
    .eq("user_id", userId);

  if (loadErr) return { ok: false, error: loadErr.message };

  const activePro = ((existingRows ?? []) as ProSubRow[]).find((row) =>
    isActiveProRow(row, now)
  );

  if (activePro) {
    const currentEnd = new Date(activePro.current_period_end);
    const extendedEnd = currentEnd.getTime() > grantEnd.getTime() ? currentEnd : grantEnd;
    const { error: extendErr } = await supabase
      .from("customer_subscriptions")
      .update({
        current_period_end: extendedEnd.toISOString(),
        status: "active",
        cancel_at_period_end: false,
      })
      .eq("id", activePro.id);
    if (extendErr) return { ok: false, error: extendErr.message };
    return { ok: true, currentPeriodEnd: extendedEnd.toISOString() };
  }

  const { error: insertErr } = await supabase.from("customer_subscriptions").insert({
    user_id: userId,
    plan_id: planResult.planId,
    status: "active",
    current_period_start: now.toISOString(),
    current_period_end: grantEnd.toISOString(),
    cancel_at_period_end: false,
  });
  if (insertErr) return { ok: false, error: insertErr.message };

  return { ok: true, currentPeriodEnd: grantEnd.toISOString() };
}

export async function revokeManualProSubscriptionFromUser(
  userId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const id = userId.trim();
  if (!id || !/^[0-9a-f-]{36}$/i.test(id)) {
    return { ok: false, error: "Invalid user id." };
  }

  const supabase = createServiceClient();
  const now = new Date();

  const { data: rows, error: loadErr } = await supabase
    .from("customer_subscriptions")
    .select(
      "id, status, current_period_end, stripe_subscription_id, subscription_plans!inner ( grants_all_programs )"
    )
    .eq("user_id", id);

  if (loadErr) return { ok: false, error: loadErr.message };

  const activePro = ((rows ?? []) as ProSubRow[]).find((row) => isActiveProRow(row, now));
  if (!activePro) {
    return { ok: false, error: "User has no active Pro subscription to revoke." };
  }

  if (activePro.stripe_subscription_id?.trim()) {
    return {
      ok: false,
      error: "This Pro subscription is managed by Stripe. Cancel it in Stripe or the billing portal.",
    };
  }

  const { error: updateErr } = await supabase
    .from("customer_subscriptions")
    .update({
      status: "canceled",
      current_period_end: now.toISOString(),
      cancel_at_period_end: false,
    })
    .eq("id", activePro.id);

  if (updateErr) return { ok: false, error: updateErr.message };
  return { ok: true };
}
