import { createServiceClient } from "@/utils/supabase/service";

/** Stripe trial before the first Pro charge. */
export const PRO_TRIAL_DAYS = 7;

/**
 * A trial is only for someone who has never had a Stripe subscription.
 * Complimentary Pro grants do not use up the trial.
 */
export async function userEligibleForProTrial(userId: string): Promise<boolean> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("customer_subscriptions")
    .select("stripe_subscription_id")
    .eq("user_id", userId);

  if (error) return false;
  return !(data ?? []).some((row) => Boolean(row.stripe_subscription_id?.trim()));
}
