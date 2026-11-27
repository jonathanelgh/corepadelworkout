export type AffiliateStatus = "active" | "paused";

export type AffiliateProfile = {
  id: string;
  user_id: string;
  code: string;
  display_name: string;
  email: string;
  phone: string | null;
  instagram: string | null;
  youtube: string | null;
  facebook: string | null;
  tiktok: string | null;
  website: string | null;
  notes: string | null;
  status: AffiliateStatus;
  commission_percent: number;
  commission_months: number;
  created_at: string;
};

export type AffiliateCommission = {
  id: string;
  currency: string;
  sale_amount_cents: number;
  commission_percent: number;
  commission_cents: number;
  earned_at: string;
  payout_id: string | null;
  stripe_invoice_id: string;
};

export type AffiliatePayout = {
  id: string;
  amount_cents: number;
  currency: string;
  status: "pending" | "paid";
  period_label: string | null;
  notes: string | null;
  paid_at: string | null;
  created_at: string;
};

export type AffiliateDayStat = {
  date: string;
  clicks: number;
  commissionCents: number;
  salesCents: number;
};

export function formatMoney(cents: number, currency = "eur"): string {
  return new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(cents / 100);
}

export function formatPercent(value: number): string {
  const rounded = Math.round(value * 100) / 100;
  return `${rounded}%`;
}

export function formatWhen(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}
