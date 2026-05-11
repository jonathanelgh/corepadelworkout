/**
 * Inline HTML for email clients (table layout, inline styles).
 * Matches Core Padel Workout marketing: black, #ccff00 accent, clean type.
 */

function escapeHtmlAttr(url: string): string {
  return url.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function escapeHtmlText(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function buildPreLaunchWelcomeEmail(ebookUrl: string): { html: string; text: string } {
  const safeHref = escapeHtmlAttr(ebookUrl);
  const visibleUrl = escapeHtmlText(ebookUrl);

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="color-scheme" content="dark" />
  <title>Welcome to Core Padel Workout</title>
</head>
<body style="margin:0;padding:0;background-color:#0a0a0a;color:#e5e5e5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#0a0a0a;">
    <tr>
      <td align="center" style="padding:40px 16px 48px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;margin:0 auto;">
          <tr>
            <td style="padding:0 0 28px;border-bottom:1px solid rgba(255,255,255,0.12);">
              <p style="margin:0;font-size:11px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:#ccff00;">Core Padel Workout</p>
              <p style="margin:10px 0 0;font-size:22px;font-weight:600;line-height:1.25;color:#ffffff;">You are on the list</p>
              <p style="margin:12px 0 0;font-size:15px;line-height:1.55;color:#a3a3a3;">Thank you for joining before launch. Here is your free e-book, plus a reminder of what you unlocked.</p>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 0 0;">
              <p style="margin:0 0 16px;font-size:13px;font-weight:600;color:#ffffff;">Your gift: training e-book (PDF)</p>
              <table role="presentation" cellspacing="0" cellpadding="0" style="margin:0 0 24px;">
                <tr>
                  <td style="border-radius:14px;background-color:#ccff00;">
                    <a href="${safeHref}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:700;color:#0a0a0a;text-decoration:none;border-radius:14px;">Download your e-book</a>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 20px;font-size:12px;line-height:1.5;color:#737373;">Button not working? Paste this link into your browser:<br /><span style="color:#a3a3a3;word-break:break-all;">${visibleUrl}</span></p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:rgba(255,255,255,0.04);border-radius:12px;border:1px solid rgba(255,255,255,0.08);">
                <tr>
                  <td style="padding:18px 20px;">
                    <p style="margin:0 0 10px;font-size:12px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;color:#ccff00;">At launch you get</p>
                    <p style="margin:0;font-size:14px;line-height:1.55;color:#d4d4d4;">We will email you the moment we go live. As part of the early list, you receive <strong style="color:#ffffff;">6 months of Pro subscription free</strong> when you activate your account.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 0 0;border-top:1px solid rgba(255,255,255,0.08);">
              <p style="margin:0;font-size:11px;line-height:1.5;color:#525252;">You are receiving this because you signed up on corepadel.app. If you did not request this, you can ignore this email.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = [
    "Core Padel Workout: You are on the list",
    "",
    "Thank you for joining before launch.",
    "",
    "Download your free e-book (PDF):",
    ebookUrl,
    "",
    "At launch we will email you when we go live. Early list members get 6 months of Pro subscription free when they activate their account.",
    "",
    "You received this because you signed up on corepadel.app.",
  ].join("\n");

  return { html, text };
}
