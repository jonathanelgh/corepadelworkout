import type Stripe from "stripe";
import { addMonths } from "@/lib/affiliates/constants";
import { claimAffiliateDiscountOnSubscription, commissionAfterDiscount, discountPercentForUser } from "@/lib/affiliates/discounts";
import { getStripe } from "@/lib/stripe/server";
import { createServiceClient } from "@/utils/supabase/service";

type AttributionRow = {
  id: string;
  affiliate_id: string;
  user_id: string | null;
  expires_at: string;
  commission_percent: number;
  commission_months: number;
  subscription_started_at: string | null;
  stripe_subscription_id: string | null;
  commission_ends_at: string | null;
};

function subscriptionIdFromInvoice(invoice: Stripe.Invoice): string | null {
  const legacy = invoice as Stripe.Invoice & {
    subscription?: string | { id: string } | null;
  };
  if (typeof legacy.subscription === "string") return legacy.subscription;
  if (legacy.subscription && typeof legacy.subscription === "object") return legacy.subscription.id;

  const parent = invoice.parent?.subscription_details?.subscription;
  if (typeof parent === "string") return parent;
  if (parent && typeof parent === "object" && "id" in parent) return parent.id;
  return null;
}

function subscriptionStartedAt(sub: Stripe.Subscription): Date {
  const legacy = sub as Stripe.Subscription & { start_date?: number };
  const unix = legacy.start_date ?? sub.trial_start ?? sub.created;
  return new Date(unix * 1000);
}

async function loadAttribution(userId: string): Promise<AttributionRow | null> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("affiliate_attributions")
    .select(
      "id, affiliate_id, user_id, expires_at, commission_percent, commission_months, subscription_started_at, stripe_subscription_id, commission_ends_at"
    )
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  return {
    ...data,
    commission_percent: Number(data.commission_percent),
    commission_months: Number(data.commission_months),
  };
}

/** Remember the referred subscription when it starts inside the 30-day window. */
export async function lockAffiliateSubscription(
  userId: string,
  subscription: Stripe.Subscription
): Promise<void> {
  const attribution = await loadAttribution(userId);
  if (!attribution || attribution.subscription_started_at) return;

  const startedAt = subscriptionStartedAt(subscription);
  if (startedAt.getTime() > new Date(attribution.expires_at).getTime()) return;

  const endsAt = addMonths(startedAt, attribution.commission_months);
  const supabase = createServiceClient();
  const { error } = await supabase
    .from("affiliate_attributions")
    .update({
      subscription_started_at: startedAt.toISOString(),
      stripe_subscription_id: subscription.id,
      commission_ends_at: endsAt.toISOString(),
    })
    .eq("id", attribution.id)
    .is("subscription_started_at", null);
  if (error) throw new Error(error.message);
}

export async function recordAffiliateCommission(invoice: Stripe.Invoice): Promise<void> {
  if (!invoice.amount_paid || invoice.amount_paid <= 0) return;
  const subscriptionId = subscriptionIdFromInvoice(invoice);
  if (!subscriptionId) return;

  const subscription = await getStripe().subscriptions.retrieve(subscriptionId, {
    expand: ["discounts"],
  });
  const userId = subscription.metadata.user_id?.trim();
  if (!userId) return;

  await claimAffiliateDiscountOnSubscription(userId, subscription);
  await lockAffiliateSubscription(userId, subscription);
  const attribution = await loadAttribution(userId);
  if (!attribution?.subscription_started_at || !attribution.commission_ends_at) return;
  if (
    attribution.stripe_subscription_id &&
    attribution.stripe_subscription_id !== subscriptionId
  ) {
    return;
  }

  const earnedUnix = invoice.status_transitions?.paid_at ?? invoice.created;
  const earnedAt = new Date(earnedUnix * 1000);
  if (earnedAt.getTime() > new Date(attribution.commission_ends_at).getTime()) return;

  const discountPercent = await discountPercentForUser(userId, attribution.affiliate_id);
  const priced = commissionAfterDiscount(
    invoice.amount_paid,
    attribution.commission_percent,
    discountPercent
  );
  const percent = priced.percent;
  const commissionCents = priced.cents;
  const supabase = createServiceClient();
  const { error } = await supabase.from("affiliate_commissions").insert({
    affiliate_id: attribution.affiliate_id,
    attribution_id: attribution.id,
    user_id: userId,
    stripe_invoice_id: invoice.id,
    stripe_subscription_id: subscriptionId,
    currency: invoice.currency || "eur",
    sale_amount_cents: invoice.amount_paid,
    commission_percent: percent,
    commission_cents: commissionCents,
    earned_at: earnedAt.toISOString(),
  });
  if (error && !error.message.toLowerCase().includes("duplicate")) {
    throw new Error(error.message);
  }
}
