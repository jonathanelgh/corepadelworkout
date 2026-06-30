import type Stripe from "stripe";
import { PRO_PLAN_SLUG } from "@/lib/stripe/config";
import { createServiceClient } from "@/utils/supabase/service";

type PlanRow = { id: string; slug: string };

function mapStripeStatus(status: Stripe.Subscription.Status): string {
  const allowed = new Set(["active", "canceled", "past_due", "trialing", "incomplete", "unpaid"]);
  return allowed.has(status) ? status : "canceled";
}

function periodBounds(sub: Stripe.Subscription): {
  start: string;
  end: string;
} {
  const legacy = sub as Stripe.Subscription & {
    current_period_start?: number;
    current_period_end?: number;
  };
  const item = sub.items.data[0] as
    | { current_period_start?: number; current_period_end?: number }
    | undefined;
  const start = item?.current_period_start ?? legacy.current_period_start;
  const end = item?.current_period_end ?? legacy.current_period_end;
  if (start == null || end == null) {
    const now = Math.floor(Date.now() / 1000);
    return {
      start: new Date(now * 1000).toISOString(),
      end: new Date((now + 30 * 24 * 60 * 60) * 1000).toISOString(),
    };
  }
  return {
    start: new Date(start * 1000).toISOString(),
    end: new Date(end * 1000).toISOString(),
  };
}

async function resolvePlanId(planSlug: string): Promise<string> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("subscription_plans")
    .select("id, slug")
    .eq("slug", planSlug)
    .eq("active", true)
    .maybeSingle();

  if (error || !data) {
    throw new Error(`Subscription plan not found: ${planSlug}`);
  }
  return (data as PlanRow).id;
}

export async function syncStripeSubscription(sub: Stripe.Subscription): Promise<void> {
  const userId = sub.metadata.user_id?.trim();
  if (!userId) {
    console.warn("[stripe] subscription missing metadata.user_id", sub.id);
    return;
  }

  const planSlug = sub.metadata.plan_slug?.trim() || PRO_PLAN_SLUG;
  const planId = await resolvePlanId(planSlug);
  const { start, end } = periodBounds(sub);
  const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer?.id ?? null;

  const supabase = createServiceClient();

  if (customerId) {
    await supabase.from("profiles").update({ stripe_customer_id: customerId }).eq("id", userId);
  }

  const row = {
    user_id: userId,
    plan_id: planId,
    status: mapStripeStatus(sub.status),
    current_period_start: start,
    current_period_end: end,
    cancel_at_period_end: sub.cancel_at_period_end,
    stripe_customer_id: customerId,
    stripe_subscription_id: sub.id,
  };

  const { data: existing } = await supabase
    .from("customer_subscriptions")
    .select("id")
    .eq("stripe_subscription_id", sub.id)
    .maybeSingle();

  if (existing?.id) {
    const { error } = await supabase.from("customer_subscriptions").update(row).eq("id", existing.id);
    if (error) throw new Error(error.message);
    return;
  }

  const { error } = await supabase.from("customer_subscriptions").insert(row);
  if (error) throw new Error(error.message);
}

export async function syncStripeSubscriptionFromCheckoutSession(
  session: Stripe.Checkout.Session
): Promise<void> {
  const subscriptionId =
    typeof session.subscription === "string" ? session.subscription : session.subscription?.id;
  if (!subscriptionId) return;

  const { getStripe } = await import("@/lib/stripe/server");
  const sub = await getStripe().subscriptions.retrieve(subscriptionId);
  await syncStripeSubscription(sub);
}
