export const PRO_MONTHLY_PRICE_EUR = 19.99;

export const PRO_MONTHLY_PRICE_LABEL = "€19.99 /month";

type SubscriptionPlanPrice = {
  price_amount: number | null;
  currency: string | null;
  interval: string | null;
};

export function formatSubscriptionPrice(plan: SubscriptionPlanPrice | null): string | null {
  if (!plan?.price_amount || !Number.isFinite(Number(plan.price_amount))) return null;
  const amount = Number(plan.price_amount);
  const currency = (plan.currency ?? "eur").toUpperCase();
  const symbol = currency === "EUR" ? "€" : currency === "USD" ? "$" : `${currency} `;
  const interval = plan.interval === "year" ? "year" : "month";
  const decimals = amount % 1 === 0 ? 0 : 2;
  return `${symbol}${amount.toFixed(decimals)} /${interval}`;
}

export function proMonthlyPriceLabel(
  plan: SubscriptionPlanPrice | null
): string {
  return formatSubscriptionPrice(plan) ?? PRO_MONTHLY_PRICE_LABEL;
}
