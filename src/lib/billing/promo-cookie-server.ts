import { cookies } from "next/headers";
import { normalizePromoCode, PROMO_COOKIE_NAME } from "@/lib/billing/promo-cookie";

export async function getStoredPromoCode(): Promise<string | null> {
  const cookieStore = await cookies();
  return normalizePromoCode(cookieStore.get(PROMO_COOKIE_NAME)?.value);
}
