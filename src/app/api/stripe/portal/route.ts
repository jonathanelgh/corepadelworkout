import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { getSiteUrl } from "@/lib/stripe/config";
import { getOrCreateStripeCustomer } from "@/lib/stripe/customer";
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
    const siteUrl = getSiteUrl();

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${siteUrl}/member?tab=profile`,
    });

    return NextResponse.json({ url: session.url });
  } catch (e) {
    console.error("[stripe/portal]", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Could not open billing portal." },
      { status: 500 }
    );
  }
}
