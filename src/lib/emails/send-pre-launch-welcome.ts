import { Resend } from "resend";
import { buildPreLaunchWelcomeEmail } from "./pre-launch-welcome-html";

const DEFAULT_SITE = "https://corepadel.app";

/** Hosted PDF in Supabase Storage (`public_media` bucket); override with NEXT_PUBLIC_PRELAUNCH_EBOOK_URL if needed. */
const DEFAULT_PRELAUNCH_EBOOK_URL =
  "https://ppxjmpsircgmhdylqhlq.supabase.co/storage/v1/object/public/public_media/Master-Your-Padel-Game-The-Ultimate-Physical-Performance-Guide.pdf";

/** Public URL for the e-book PDF (welcome email and /join/welcome). */
export function resolvePreLaunchEbookPublicUrl(): string {
  const site = (process.env.NEXT_PUBLIC_SITE_URL || DEFAULT_SITE).replace(/\/$/, "");
  const raw = process.env.NEXT_PUBLIC_PRELAUNCH_EBOOK_URL?.trim();
  if (!raw) {
    return DEFAULT_PRELAUNCH_EBOOK_URL;
  }
  if (raw.startsWith("http://") || raw.startsWith("https://")) {
    return raw;
  }
  return `${site}${raw.startsWith("/") ? "" : "/"}${raw}`;
}

export async function sendPreLaunchWelcomeEmail(to: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    console.warn("[pre-launch] RESEND_API_KEY is not set; welcome email skipped.");
    return { ok: false, error: "RESEND_API_KEY not configured" };
  }

  const from =
    process.env.RESEND_FROM?.trim() || "Core Padel Workout <hello@corepadel.app>";
  const ebookUrl = resolvePreLaunchEbookPublicUrl();
  const { html, text } = buildPreLaunchWelcomeEmail(ebookUrl);

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from,
    to: [to],
    subject: "You are on the list, here is your e-book",
    html,
    text,
  });

  if (error) {
    console.error("[pre-launch] Resend error:", error);
    const msg =
      typeof error === "object" && error !== null && "message" in error
        ? String((error as { message: unknown }).message)
        : String(error);
    return { ok: false, error: msg };
  }

  return { ok: true };
}
