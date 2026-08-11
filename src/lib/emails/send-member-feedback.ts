import { Resend } from "resend";
import { buildMemberFeedbackEmail } from "./member-feedback-html";

export async function sendMemberFeedbackEmail(params: {
  to: string;
  memberName: string;
  memberEmail: string;
  categoryLabel: string;
  message: string;
  submittedAt: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    console.warn("[member-feedback] RESEND_API_KEY not set; email skipped.");
    return { ok: false, error: "RESEND_API_KEY not configured" };
  }

  const from =
    process.env.RESEND_FROM?.trim() || "Core Padel Workout <hello@corepadel.app>";
  const { html, text } = buildMemberFeedbackEmail(params);

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from,
    to: [params.to],
    subject: `Feedback: ${params.categoryLabel} — ${params.memberName}`,
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
