import { NextResponse } from "next/server";
import { getStoredPromoCode } from "@/lib/billing/promo-cookie-server";
import { PRO_TRIAL_DAYS, userEligibleForProTrial } from "@/lib/billing/pro-trial";
import { getHasActivePro } from "@/lib/member/has-active-pro";
import { createClient } from "@/utils/supabase/server";
import { getSiteUrl, getStripeProPriceId, PRO_PLAN_SLUG } from "@/lib/stripe/config";
import { getOrCreateStripeCustomer } from "@/lib/stripe/customer";
import { resolveStripePromotionCodeId } from "@/lib/stripe/promotion-code";
import { getStripe } from "@/lib/stripe/server";

export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Sign in required." }, { status: 401 });
    }

    if (await getHasActivePro(supabase, user.id)) {
      return NextResponse.json({ error: "You already have Pro access." }, { status: 400 });
    }

    const customerId = await getOrCreateStripeCustomer(supabase, user.id, user.email);
    const stripe = getStripe();
    const priceId = getStripeProPriceId();
    const siteUrl = getSiteUrl();
    const trialDays = (await userEligibleForProTrial(user.id)) ? PRO_TRIAL_DAYS : null;

    const storedPromoCode = await getStoredPromoCode();
    const promotionCodeId = storedPromoCode
      ? await resolveStripePromotionCodeId(stripe, storedPromoCode)
      : null;

    if (storedPromoCode && !promotionCodeId) {
      console.warn("[stripe/checkout] unknown or inactive promo code:", storedPromoCode);
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      allow_promotion_codes: !promotionCodeId,
      ...(promotionCodeId ? { discounts: [{ promotion_code: promotionCodeId }] } : {}),
      success_url: `${siteUrl}/subscribe/complete?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/subscribe?canceled=1`,
      payment_method_collection: "always",
      metadata: {
        user_id: user.id,
        plan_slug: PRO_PLAN_SLUG,
        ...(storedPromoCode ? { promo_code: storedPromoCode } : {}),
      },
      subscription_data: {
        ...(trialDays ? { trial_period_days: trialDays } : {}),
        metadata: {
          user_id: user.id,
          plan_slug: PRO_PLAN_SLUG,
          ...(storedPromoCode ? { promo_code: storedPromoCode } : {}),
        },
      },
    });

    if (!session.url) {
      return NextResponse.json({ error: "Could not start checkout." }, { status: 500 });
    }

    return NextResponse.json({ url: session.url });
  } catch (e) {
    console.error("[stripe/checkout]", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Checkout failed." },
      { status: 500 }
    );
  }
}
