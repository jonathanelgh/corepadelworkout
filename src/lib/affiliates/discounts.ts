import { randomBytes } from "crypto";
import { ATTRIBUTION_WINDOW_DAYS } from "@/lib/affiliates/constants";
import type Stripe from "stripe";
import { getStoredPromoCode } from "@/lib/billing/promo-cookie-server";
import { getStripe } from "@/lib/stripe/server";
import { createServiceClient } from "@/utils/supabase/service";

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const CODE_PATTERN = /^[A-Z0-9]{4,20}$/;

export type AffiliateDiscount = {
  id: string;
  code: string;
  percent: number;
  expiresAt: string | null;
  active: boolean;
  uses: number;
  createdAt: string;
};

export function normalizeDiscountCode(raw: string | null | undefined): string | null {
  const code = raw?.trim().toUpperCase() ?? "";
  if (!CODE_PATTERN.test(code)) return null;
  return code;
}

export function generateDiscountCode(): string {
  const bytes = randomBytes(8);
  return Array.from(bytes, (byte) => CODE_ALPHABET[byte % CODE_ALPHABET.length]).join("");
}

function isExpired(expiresAt: string | null): boolean {
  return Boolean(expiresAt && new Date(expiresAt).getTime() <= Date.now());
}

export async function loadAffiliateDiscounts(affiliateId: string): Promise<AffiliateDiscount[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("affiliate_discount_codes")
    .select("id, code, percent, expires_at, active, created_at")
    .eq("affiliate_id", affiliateId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  const codes = data ?? [];
  if (codes.length === 0) return [];

  const { data: redemptions, error: redemptionError } = await supabase
    .from("affiliate_discount_redemptions")
    .select("discount_id")
    .in(
      "discount_id",
      codes.map((row) => row.id)
    );
  if (redemptionError) throw new Error(redemptionError.message);
  const uses = new Map<string, number>();
  for (const row of redemptions ?? []) {
    uses.set(row.discount_id, (uses.get(row.discount_id) ?? 0) + 1);
  }

  return codes.map((row) => ({
    id: row.id,
    code: row.code,
    percent: Number(row.percent),
    expiresAt: row.expires_at,
    active: row.active,
    uses: uses.get(row.id) ?? 0,
    createdAt: row.created_at,
  }));
}

async function codeIsTaken(code: string): Promise<boolean> {
  const supabase = createServiceClient();
  const [discounts, offers, affiliates] = await Promise.all([
    supabase.from("affiliate_discount_codes").select("id").eq("code", code).maybeSingle(),
    supabase.from("signup_offers").select("id").eq("code", code).maybeSingle(),
    supabase.from("affiliates").select("id").eq("code", code).maybeSingle(),
  ]);
  if (discounts.error) throw new Error(discounts.error.message);
  if (offers.error) throw new Error(offers.error.message);
  if (affiliates.error) throw new Error(affiliates.error.message);
  return Boolean(discounts.data || offers.data || affiliates.data);
}

export async function createAffiliateDiscount(input: {
  affiliateId: string;
  commissionPercent: number;
  code: string | null;
  percent: number;
  expiresAt: string | null;
}): Promise<{ error?: string }> {
  if (!Number.isFinite(input.percent) || input.percent <= 0 || input.percent > 100) {
    return { error: "Enter a discount between 1 and 100." };
  }
  if (input.percent > input.commissionPercent) {
    return {
      error: `Discount cannot be higher than your ${input.commissionPercent}% commission.`,
    };
  }
  if (input.expiresAt && new Date(input.expiresAt).getTime() <= Date.now()) {
    return { error: "Choose an expiry date in the future." };
  }

  let code = input.code;
  if (!code) {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const next = generateDiscountCode();
      if (!(await codeIsTaken(next))) {
        code = next;
        break;
      }
    }
  }
  if (!code) return { error: "Could not generate a unique code. Try again." };
  if (input.code && (await codeIsTaken(code))) {
    return { error: "That code is already in use. Choose another." };
  }

  const stripe = getStripe();
  const expiresUnix = input.expiresAt ? Math.floor(new Date(input.expiresAt).getTime() / 1000) : undefined;
  const coupon = await stripe.coupons.create({
    percent_off: input.percent,
    duration: "forever",
    name: `Affiliate ${code}`,
    metadata: { affiliate_id: input.affiliateId, code },
    ...(expiresUnix ? { redeem_by: expiresUnix } : {}),
  });
  let promotionId = "";
  try {
    const promotion = await stripe.promotionCodes.create({
      promotion: { type: "coupon", coupon: coupon.id },
      code,
      active: true,
      metadata: { affiliate_id: input.affiliateId, code },
      ...(expiresUnix ? { expires_at: expiresUnix } : {}),
    });
    promotionId = promotion.id;
    const supabase = createServiceClient();
    const { error } = await supabase.from("affiliate_discount_codes").insert({
      affiliate_id: input.affiliateId,
      code,
      percent: input.percent,
      expires_at: input.expiresAt,
      active: true,
      stripe_coupon_id: coupon.id,
      stripe_promotion_code_id: promotion.id,
    });
    if (error) throw new Error(error.message);
  } catch (error) {
    if (promotionId) {
      await stripe.promotionCodes.update(promotionId, { active: false }).catch(() => undefined);
    }
    await stripe.coupons.del(coupon.id).catch(() => undefined);
    const message = error instanceof Error ? error.message : "Could not create the discount.";
    if (message.toLowerCase().includes("duplicate") || message.toLowerCase().includes("already")) {
      return { error: "That code is already in use. Choose another." };
    }
    return { error: message };
  }

  return {};
}

export async function setAffiliateDiscountActive(input: {
  affiliateId: string;
  discountId: string;
  active: boolean;
}): Promise<{ error?: string }> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("affiliate_discount_codes")
    .select("id, active, expires_at, stripe_promotion_code_id")
    .eq("id", input.discountId)
    .eq("affiliate_id", input.affiliateId)
    .maybeSingle();
  if (error || !data) return { error: "Discount not found." };
  if (input.active && isExpired(data.expires_at)) return { error: "This code has expired." };
  if (data.active === input.active) return {};

  if (data.stripe_promotion_code_id) {
    await getStripe().promotionCodes.update(data.stripe_promotion_code_id, { active: input.active });
  }
  const { error: updateError } = await supabase
    .from("affiliate_discount_codes")
    .update({ active: input.active, updated_at: new Date().toISOString() })
    .eq("id", data.id);
  if (updateError) return { error: updateError.message };
  return {};
}

type DiscountRow = {
  id: string;
  affiliate_id: string;
  code: string;
  percent: number;
  expires_at: string | null;
  active: boolean;
  stripe_coupon_id: string | null;
  stripe_promotion_code_id: string | null;
};

async function loadDiscountByCode(code: string): Promise<DiscountRow | null> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("affiliate_discount_codes")
    .select("id, affiliate_id, code, percent, expires_at, active, stripe_coupon_id, stripe_promotion_code_id")
    .eq("code", code)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  return { ...data, percent: Number(data.percent) };
}

function discountCanBeClaimed(discount: DiscountRow): boolean {
  return discount.active && !isExpired(discount.expires_at) && Boolean(discount.stripe_coupon_id);
}

async function applyAffiliateDiscount(
  userId: string,
  discount: DiscountRow,
  requireClaimable: boolean
): Promise<string | null> {
  if (!discount.stripe_coupon_id) return null;
  const supabase = createServiceClient();
  const { data: existingRedemption } = await supabase
    .from("affiliate_discount_redemptions")
    .select("discount_id")
    .eq("user_id", userId)
    .maybeSingle();
  if (existingRedemption) {
    if (existingRedemption.discount_id !== discount.id) return null;
    return discount.stripe_coupon_id;
  }
  if (requireClaimable && !discountCanBeClaimed(discount)) return null;

  const { data: attribution } = await supabase
    .from("affiliate_attributions")
    .select("id, affiliate_id")
    .eq("user_id", userId)
    .maybeSingle();
  if (attribution && attribution.affiliate_id !== discount.affiliate_id) return null;

  if (!attribution) {
    const { data: affiliate, error: affiliateError } = await supabase
      .from("affiliates")
      .select("id, commission_percent, commission_months")
      .eq("id", discount.affiliate_id)
      .maybeSingle();
    if (affiliateError || !affiliate) return null;
    const now = new Date();
    const { error: attributionError } = await supabase.from("affiliate_attributions").insert({
      affiliate_id: affiliate.id,
      visitor_id: crypto.randomUUID(),
      user_id: userId,
      first_touch_at: now.toISOString(),
      expires_at: new Date(now.getTime() + ATTRIBUTION_WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString(),
      commission_percent: Number(affiliate.commission_percent),
      commission_months: Number(affiliate.commission_months),
    });
    if (attributionError) {
      if (!attributionError.message.toLowerCase().includes("duplicate")) {
        throw new Error(attributionError.message);
      }
      const { data: current } = await supabase
        .from("affiliate_attributions")
        .select("affiliate_id")
        .eq("user_id", userId)
        .maybeSingle();
      if (!current || current.affiliate_id !== discount.affiliate_id) return null;
    }
  }

  const { error } = await supabase.from("affiliate_discount_redemptions").insert({
    discount_id: discount.id,
    affiliate_id: discount.affiliate_id,
    user_id: userId,
    percent: discount.percent,
  });
  if (error && !error.message.toLowerCase().includes("duplicate")) throw new Error(error.message);
  return discount.stripe_coupon_id;
}

/** Tie a signup to the affiliate discount in the promo cookie. Returns the Stripe coupon when it should be charged. */
export async function claimAffiliateDiscount(userId: string): Promise<string | null> {
  const code = await getStoredPromoCode();
  if (!code) return null;
  const discount = await loadDiscountByCode(code);
  if (!discount) return null;
  return applyAffiliateDiscount(userId, discount, true);
}

export async function claimAffiliateDiscountOnSubscription(
  userId: string,
  subscription: Stripe.Subscription
): Promise<void> {
  let discounts = subscription.discounts ?? [];
  if (discounts.some((discount) => typeof discount === "string")) {
    const full = await getStripe().subscriptions.retrieve(subscription.id, { expand: ["discounts"] });
    discounts = full.discounts ?? [];
  }
  const couponIds = discounts.map(couponIdFromDiscount).filter((id): id is string => Boolean(id));
  if (couponIds.length === 0) return;

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("affiliate_discount_codes")
    .select("id, affiliate_id, code, percent, expires_at, active, stripe_coupon_id, stripe_promotion_code_id")
    .in("stripe_coupon_id", couponIds);
  if (error) throw new Error(error.message);
  for (const row of data ?? []) {
    await applyAffiliateDiscount(userId, { ...row, percent: Number(row.percent) }, false);
  }
}

function couponIdFromDiscount(discount: Stripe.Discount | string): string | null {
  if (typeof discount === "string") return null;
  const coupon = discount.source?.coupon;
  if (!coupon) return null;
  return typeof coupon === "string" ? coupon : coupon.id;
}

export async function discountPercentForUser(userId: string, affiliateId: string): Promise<number> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("affiliate_discount_redemptions")
    .select("percent")
    .eq("user_id", userId)
    .eq("affiliate_id", affiliateId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? Number(data.percent) : 0;
}

export function commissionAfterDiscount(amountPaidCents: number, affiliatePercent: number, discountPercent: number): {
  percent: number;
  cents: number;
} {
  const discount = Math.min(Math.max(discountPercent, 0), 100);
  const percent = Math.max(0, affiliatePercent - discount);
  if (amountPaidCents <= 0 || percent <= 0) return { percent, cents: 0 };
  const cents =
    discount > 0 && discount < 100
      ? Math.round((amountPaidCents * percent) / (100 - discount))
      : Math.round((amountPaidCents * percent) / 100);
  return { percent, cents };
}
