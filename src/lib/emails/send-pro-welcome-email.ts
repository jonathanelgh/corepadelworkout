import { Resend } from "resend";
import type Stripe from "stripe";
import { getPublicSiteUrl } from "@/lib/stripe/config";
import { createServiceClient } from "@/utils/supabase/service";
import { buildProWelcomeEmail } from "./pro-welcome-email-html";

function firstNameFromFullName(fullName: string | null | undefined): string | null {
  const trimmed = fullName?.trim();
  if (!trimmed) return null;
  return trimmed.split(/\s+/)[0] ?? null;
}

/**
 * Send a one-time welcome email after successful Pro checkout.
 * Safe to call from the Stripe webhook — never throws.
 */
export async function sendProWelcomeEmailForCheckoutSession(
  session: Stripe.Checkout.Session
): Promise<void> {
  try {
    const userId = session.metadata?.user_id?.trim() || null;
    const email =
      session.customer_details?.email?.trim() ||
      session.customer_email?.trim() ||
      null;

    if (!email) {
      console.warn("[pro-welcome] checkout session missing customer email", session.id);
      return;
    }

    let firstName: string | null = null;
    if (userId) {
      const supabase = createServiceClient();
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", userId)
        .maybeSingle();
      firstName = firstNameFromFullName(profile?.full_name);
    }

    const result = await sendProWelcomeEmail({
      to: email,
      firstName,
      idempotencyKey: `pro-welcome-${session.id}`,
    });
    if (!result.ok) {
      console.error("[pro-welcome] send failed:", result.error, session.id);
    }
  } catch (e) {
    console.error("[pro-welcome] unexpected error:", e);
  }
}

export async function sendProWelcomeEmail(input: {
  to: string;
  firstName?: string | null;
  /** Dedupes Stripe webhook retries for the same checkout session. */
  idempotencyKey?: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    console.warn("[pro-welcome] RESEND_API_KEY is not set; welcome email skipped.");
    return { ok: false, error: "RESEND_API_KEY not configured" };
  }

  const from =
    process.env.RESEND_FROM?.trim() || "Core Padel Workout <hello@corepadel.app>";
  const siteUrl = getPublicSiteUrl();
  const { html, text } = buildProWelcomeEmail({
    firstName: input.firstName ?? null,
    memberUrl: `${siteUrl}/member`,
    programsUrl: `${siteUrl}/programs`,
  });

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from,
    to: [input.to.trim()],
    subject: "Thank you — welcome to Core Padel Pro",
    html,
    text,
  }, input.idempotencyKey ? { idempotencyKey: input.idempotencyKey } : undefined);

  if (error) {
    const msg =
      typeof error === "object" && error !== null && "message" in error
        ? String((error as { message: unknown }).message)
        : String(error);
    return { ok: false, error: msg };
  }

  return { ok: true };
}
