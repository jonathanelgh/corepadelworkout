import { NextResponse } from "next/server";
import { getStoredPromoCode } from "@/lib/billing/promo-cookie-server";
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

    const customerId = await getOrCreateStripeCustomer(supabase, user.id, user.email);
    const stripe = getStripe();
    const priceId = getStripeProPriceId();
    const siteUrl = getSiteUrl();

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
      success_url: `${siteUrl}/member?tab=profile&billing=success`,
      cancel_url: `${siteUrl}/member/upgrade?canceled=1`,
      metadata: {
        user_id: user.id,
        plan_slug: PRO_PLAN_SLUG,
        ...(storedPromoCode ? { promo_code: storedPromoCode } : {}),
      },
      subscription_data: {
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
