import { Resend } from "resend";
import { getPublicSiteUrl } from "@/lib/stripe/config";
import { buildAffiliateWelcomeEmail } from "./affiliate-welcome-email-html";

export async function sendAffiliateWelcomeEmail(input: {
  to: string;
  name: string;
  password?: string | null;
  referralLink: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    console.warn("[affiliate-welcome] RESEND_API_KEY is not set; welcome email skipped.");
    return { ok: false, error: "RESEND_API_KEY not configured" };
  }

  const from = process.env.RESEND_FROM?.trim() || "Core Padel Workout <hello@corepadel.app>";
  const siteUrl = getPublicSiteUrl();
  const { html, text } = buildAffiliateWelcomeEmail({
    name: input.name,
    email: input.to,
    password: input.password,
    loginUrl: `${siteUrl}/login?next=${encodeURIComponent("/affiliate")}`,
    referralLink: input.referralLink,
  });

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from,
    to: [input.to.trim()],
    subject: "Your Core Padel affiliate account",
    html,
    text,
  });

  if (error) {
    const message =
      typeof error === "object" && error !== null && "message" in error
        ? String((error as { message: unknown }).message)
        : String(error);
    return { ok: false, error: message };
  }

  return { ok: true };
}
