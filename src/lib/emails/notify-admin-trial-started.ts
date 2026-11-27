import { Resend } from "resend";
import type Stripe from "stripe";
import { getPublicSiteUrl } from "@/lib/stripe/config";
import { getStripe } from "@/lib/stripe/server";
import { createServiceClient } from "@/utils/supabase/service";
import { buildTrialStartedAdminEmail } from "./trial-started-admin-html";

const TRIAL_ADMIN_EMAIL = "jonathan.elgh@gmail.com";

function subscriptionIdFromSession(session: Stripe.Checkout.Session): string | null {
  const sub = session.subscription;
  if (typeof sub === "string") return sub;
  if (sub && typeof sub === "object" && "id" in sub) return sub.id;
  return null;
}

/**
 * Email the admin when a Stripe checkout starts a Pro trial.
 * Paid checkouts without a trial are ignored. Never throws.
 */
export async function notifyAdminTrialStarted(
  session: Stripe.Checkout.Session
): Promise<void> {
  try {
    const subscriptionId = subscriptionIdFromSession(session);
    if (!subscriptionId) return;

    const subscription = await getStripe().subscriptions.retrieve(subscriptionId);
    if (subscription.status !== "trialing" || typeof subscription.trial_end !== "number") {
      return;
    }

    const userId = session.metadata?.user_id?.trim() || null;
    const memberEmail =
      session.customer_details?.email?.trim() ||
      session.customer_email?.trim() ||
      "unknown";
    let memberName = session.customer_details?.name?.trim() || "";

    if (userId) {
      const supabase = createServiceClient();
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, email")
        .eq("id", userId)
        .maybeSingle();
      const profileName = (profile?.full_name as string | null)?.trim();
      if (profileName) memberName = profileName;
    }

    if (!memberName) memberName = memberEmail === "unknown" ? "A new member" : memberEmail;

    const trialEndsAt = new Date(subscription.trial_end * 1000).toLocaleString("en-GB", {
      dateStyle: "medium",
      timeStyle: "short",
    });

    const apiKey = process.env.RESEND_API_KEY?.trim();
    if (!apiKey) {
      console.warn("[trial-started] RESEND_API_KEY is not set; admin email skipped.");
      return;
    }

    const from =
      process.env.RESEND_FROM?.trim() || "Core Padel Workout <hello@corepadel.app>";
    const { html, text } = buildTrialStartedAdminEmail({
      memberName,
      memberEmail,
      trialEndsAt,
      adminUrl: `${getPublicSiteUrl()}/admin/users`,
    });

    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send(
      {
        from,
        to: [TRIAL_ADMIN_EMAIL],
        subject: `New Pro trial: ${memberName}`,
        html,
        text,
      },
      { idempotencyKey: `trial-started-${session.id}` }
    );

    if (error) {
      console.error("[trial-started] send failed:", error, session.id);
    }
  } catch (e) {
    console.error("[trial-started] unexpected error:", e);
  }
}
