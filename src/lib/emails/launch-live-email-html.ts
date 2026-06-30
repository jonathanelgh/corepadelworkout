import { EARLY_ACCESS_PRO_MONTHS } from "@/lib/pre-launch/early-access";

function escapeHtmlAttr(url: string): string {
  return url.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function escapeHtmlText(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function buildLaunchLiveEmail(signupUrl: string): { html: string; text: string } {
  const safeHref = escapeHtmlAttr(signupUrl);
  const visibleUrl = escapeHtmlText(signupUrl);
  const months = EARLY_ACCESS_PRO_MONTHS;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="color-scheme" content="light" />
  <title>Core Padel Workout is live</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;color:#18181b;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f4f4f5;">
    <tr>
      <td align="center" style="padding:40px 16px 48px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;margin:0 auto;background-color:#ffffff;border-radius:16px;border:1px solid #e4e4e7;">
          <tr>
            <td style="padding:32px 28px 28px;border-bottom:1px solid #e4e4e7;">
              <p style="margin:0;font-size:11px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:#65a30d;">Core Padel Workout</p>
              <p style="margin:10px 0 0;font-size:26px;font-weight:600;line-height:1.25;color:#09090b;">We are live — your Pro access is waiting</p>
              <p style="margin:12px 0 0;font-size:15px;line-height:1.55;color:#52525b;">You joined the waitlist before launch. Today you can create your account and unlock <strong style="color:#09090b;">${months} months of Pro free</strong> — every program, the exercise library, and AI Coach.</p>
            </td>
          </tr>
          <tr>
            <td style="padding:28px;">
              <table role="presentation" cellspacing="0" cellpadding="0" style="margin:0 0 24px;">
                <tr>
                  <td style="border-radius:14px;background-color:#ccff00;">
                    <a href="${safeHref}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:16px 32px;font-size:16px;font-weight:700;color:#09090b;text-decoration:none;border-radius:14px;">Create your account &amp; claim Pro</a>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 20px;font-size:12px;line-height:1.5;color:#71717a;">Button not working? Paste this link into your browser:<br /><span style="color:#52525b;word-break:break-all;">${visibleUrl}</span></p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#fafafa;border-radius:12px;border:1px solid #e4e4e7;">
                <tr>
                  <td style="padding:18px 20px;">
                    <p style="margin:0 0 10px;font-size:12px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;color:#65a30d;">Your early-access perk</p>
                    <p style="margin:0;font-size:14px;line-height:1.55;color:#3f3f46;">Sign up with <strong style="color:#09090b;">the same email address</strong> you used on the waitlist. Your personal link activates ${months} months of Pro automatically — no payment required.</p>
                  </td>
                </tr>
              </table>
              <p style="margin:20px 0 0;font-size:13px;line-height:1.55;color:#71717a;">Train at the gym, at home, or on the court with structured padel programs built for strength, speed, and injury resilience.</p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 28px 28px;">
              <p style="margin:0;padding-top:24px;border-top:1px solid #e4e4e7;font-size:11px;line-height:1.5;color:#a1a1aa;">You are receiving this because you joined the Core Padel Workout waitlist. If you did not sign up, you can ignore this email.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = [
    "Core Padel Workout is live",
    "",
    `You joined the waitlist before launch. Create your account to claim ${months} months of Pro free:`,
    signupUrl,
    "",
    "Use the same email address you used on the waitlist. Your personal link activates the offer automatically.",
    "",
    "You received this because you joined the Core Padel Workout waitlist.",
  ].join("\n");

  return { html, text };
}
