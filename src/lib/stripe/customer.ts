import type { SupabaseClient } from "@supabase/supabase-js";
import { getStripe } from "@/lib/stripe/server";
import { createServiceClient } from "@/utils/supabase/service";

export async function getOrCreateStripeCustomer(
  supabase: SupabaseClient,
  userId: string,
  email: string | null | undefined
): Promise<string> {
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("stripe_customer_id, email")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  const existing = (profile as { stripe_customer_id?: string | null } | null)?.stripe_customer_id?.trim();
  if (existing) return existing;

  const stripe = getStripe();
  const customer = await stripe.customers.create({
    email: email?.trim() || (profile as { email?: string | null } | null)?.email?.trim() || undefined,
    metadata: { user_id: userId },
  });

  const service = createServiceClient();
  const { error: updateErr } = await service
    .from("profiles")
    .update({ stripe_customer_id: customer.id })
    .eq("id", userId);

  if (updateErr) {
    throw new Error(updateErr.message);
  }

  return customer.id;
}
