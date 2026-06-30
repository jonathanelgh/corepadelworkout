import type { SupabaseClient } from "@supabase/supabase-js";
import { createServiceClient } from "@/utils/supabase/service";
import { getSiteUrl, PRO_PLAN_SLUG } from "@/lib/stripe/config";

export const EARLY_ACCESS_OFFER = "early-access";
export const EARLY_ACCESS_TOKEN_PARAM = "token";
export const EARLY_ACCESS_PRO_MONTHS = 6;

export type PreLaunchSignupRow = {
  id: string;
  email: string;
  signup_token: string;
  created_at: string;
  launch_email_sent_at: string | null;
  pro_redeemed_at: string | null;
  redeemed_user_id: string | null;
};

export function buildEarlyAccessSignupUrl(signupToken: string, siteUrl?: string): string {
  const base = (siteUrl ?? getSiteUrl()).replace(/\/$/, "");
  const params = new URLSearchParams({
    offer: EARLY_ACCESS_OFFER,
    [EARLY_ACCESS_TOKEN_PARAM]: signupToken,
  });
  return `${base}/signup?${params.toString()}`;
}

export async function validateEarlyAccessForEmail(
  token: string,
  email: string
): Promise<{ ok: true; signupId: string } | { ok: false; error: string }> {
  const trimmedToken = token.trim();
  const normalizedEmail = email.trim().toLowerCase();
  if (!trimmedToken) return { ok: false, error: "This signup link is invalid." };
  if (!normalizedEmail) return { ok: false, error: "Enter your email address." };

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("pre_launch_signups")
    .select("id, email, pro_redeemed_at")
    .eq("signup_token", trimmedToken)
    .maybeSingle();

  if (error || !data) {
    return { ok: false, error: "This early-access link is not valid." };
  }

  if (data.email.trim().toLowerCase() !== normalizedEmail) {
    return {
      ok: false,
      error: "Use the same email address you joined the waitlist with to claim 6 months of Pro.",
    };
  }

  if (data.pro_redeemed_at) {
    return { ok: false, error: "This early-access offer has already been redeemed." };
  }

  return { ok: true, signupId: data.id };
}

function addMonths(date: Date, months: number): Date {
  const out = new Date(date);
  out.setMonth(out.getMonth() + months);
  return out;
}

/** Grant 6 months of Pro (no Stripe) for a validated pre-launch signup. */
export async function redeemEarlyAccessPro(input: {
  userId: string;
  email: string;
  token: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const validation = await validateEarlyAccessForEmail(input.token, input.email);
  if (!validation.ok) return validation;

  const supabase = createServiceClient();

  const { data: plan, error: planErr } = await supabase
    .from("subscription_plans")
    .select("id")
    .eq("slug", PRO_PLAN_SLUG)
    .eq("active", true)
    .maybeSingle();

  if (planErr || !plan) {
    return { ok: false, error: "Pro plan is not configured." };
  }

  const now = new Date();
  const periodEnd = addMonths(now, EARLY_ACCESS_PRO_MONTHS);

  const { data: existingRows } = await supabase
    .from("customer_subscriptions")
    .select("id, status, current_period_end, subscription_plans!inner ( grants_all_programs )")
    .eq("user_id", input.userId);

  type SubRow = {
    id: string;
    status: string;
    current_period_end: string;
    subscription_plans: { grants_all_programs: boolean } | { grants_all_programs: boolean }[];
  };

  const activePro = (existingRows as SubRow[] | null)?.find((row) => {
    const planRow = Array.isArray(row.subscription_plans)
      ? row.subscription_plans[0]
      : row.subscription_plans;
    if (!planRow?.grants_all_programs) return false;
    if (row.status !== "active" && row.status !== "trialing") return false;
    return new Date(row.current_period_end).getTime() > now.getTime();
  });

  if (activePro) {
    const currentEnd = new Date(activePro.current_period_end);
    const extendedEnd =
      currentEnd.getTime() > periodEnd.getTime() ? currentEnd : periodEnd;
    const { error: extendErr } = await supabase
      .from("customer_subscriptions")
      .update({
        current_period_end: extendedEnd.toISOString(),
        status: "active",
        cancel_at_period_end: false,
      })
      .eq("id", activePro.id);
    if (extendErr) return { ok: false, error: extendErr.message };
  } else {
    const { error: insertErr } = await supabase.from("customer_subscriptions").insert({
      user_id: input.userId,
      plan_id: plan.id,
      status: "active",
      current_period_start: now.toISOString(),
      current_period_end: periodEnd.toISOString(),
      cancel_at_period_end: false,
    });
    if (insertErr) return { ok: false, error: insertErr.message };
  }

  const { error: markErr } = await supabase
    .from("pre_launch_signups")
    .update({
      pro_redeemed_at: now.toISOString(),
      redeemed_user_id: input.userId,
    })
    .eq("id", validation.signupId);

  if (markErr) return { ok: false, error: markErr.message };

  return { ok: true };
}

export async function loadPreLaunchSignups(
  supabase: SupabaseClient
): Promise<PreLaunchSignupRow[]> {
  const select =
    "id, email, signup_token, created_at, launch_email_sent_at, pro_redeemed_at, redeemed_user_id";
  const pageSize = 500;
  const all: PreLaunchSignupRow[] = [];
  let from = 0;

  while (true) {
    const { data, error } = await supabase
      .from("pre_launch_signups")
      .select(select)
      .order("created_at", { ascending: false })
      .range(from, from + pageSize - 1);

    if (error) throw new Error(error.message);

    const batch = (data ?? []) as PreLaunchSignupRow[];
    all.push(...batch);
    if (batch.length < pageSize) break;
    from += pageSize;
  }

  return all;
}
