import { Resend } from "resend";
import { buildEarlyAccessSignupUrl } from "@/lib/pre-launch/early-access";
import { buildLaunchLiveEmail } from "./launch-live-email-html";
import { getSiteUrl } from "@/lib/stripe/config";

export async function sendLaunchLiveEmail(input: {
  to: string;
  signupToken: string;
  test?: boolean;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    return { ok: false, error: "RESEND_API_KEY is not configured." };
  }

  const from =
    process.env.RESEND_FROM?.trim() || "Core Padel Workout <hello@corepadel.app>";
  const signupUrl = buildEarlyAccessSignupUrl(input.signupToken, getSiteUrl());
  const { html, text } = buildLaunchLiveEmail(signupUrl);

  const subject = input.test
    ? "[TEST] Core Padel Workout is live — claim your 6 months of Pro"
    : "Core Padel Workout is live — claim your 6 months of Pro";

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from,
    to: [input.to.trim()],
    subject,
    html,
    text,
  });

  if (error) {
    const msg =
      typeof error === "object" && error !== null && "message" in error
        ? String((error as { message: unknown }).message)
        : String(error);
    return { ok: false, error: msg };
  }

  return { ok: true };
}
