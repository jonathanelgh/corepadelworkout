export function getSiteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || "https://corepadel.app").replace(/\/$/, "");
}

export function getStripeSecretKey(): string {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is not configured.");
  }
  return key;
}

export function getStripeWebhookSecret(): string {
  const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!secret) {
    throw new Error("STRIPE_WEBHOOK_SECRET is not configured.");
  }
  return secret;
}

export function getStripeProPriceId(): string {
  const fromEnv = process.env.STRIPE_PRO_PRICE_ID?.trim();
  if (fromEnv) return fromEnv;
  throw new Error("STRIPE_PRO_PRICE_ID is not configured.");
}

export const PRO_PLAN_SLUG = "pro-monthly";
