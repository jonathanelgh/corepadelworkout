import type Stripe from "stripe";

export async function resolveStripePromotionCodeId(
  stripe: Stripe,
  code: string
): Promise<string | null> {
  const normalized = code.trim().toUpperCase();
  if (!normalized) return null;

  const list = await stripe.promotionCodes.list({
    code: normalized,
    active: true,
    limit: 1,
  });

  return list.data[0]?.id ?? null;
}
