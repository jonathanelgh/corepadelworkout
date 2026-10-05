function escapeHtmlAttr(url: string): string {
  return url.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function escapeHtmlText(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function buildProWelcomeEmail(input: {
  firstName: string | null;
  memberUrl: string;
  programsUrl: string;
}): { html: string; text: string } {
  const name = input.firstName?.trim() || null;
  const greeting = name ? `Thank you, ${escapeHtmlText(name)}` : "Thank you";
  const greetingText = name ? `Thank you, ${name}` : "Thank you";
  const memberHref = escapeHtmlAttr(input.memberUrl);
  const programsHref = escapeHtmlAttr(input.programsUrl);
  const memberVisible = escapeHtmlText(input.memberUrl);

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="color-scheme" content="light only" />
  <meta name="supported-color-schemes" content="light" />
  <title>Welcome to Core Padel Pro</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;color:#18181b;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f4f4f5;">
    <tr>
      <td align="center" style="padding:40px 16px 48px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;margin:0 auto;background-color:#ffffff;border-radius:16px;border:1px solid #e4e4e7;">
          <tr>
            <td style="padding:32px 28px 28px;border-bottom:1px solid #e4e4e7;">
              <p style="margin:0;font-size:11px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:#65a30d;">Core Padel Workout</p>
              <p style="margin:10px 0 0;font-size:26px;font-weight:600;line-height:1.25;color:#09090b;">${greeting} — welcome to Pro</p>
              <p style="margin:12px 0 0;font-size:15px;line-height:1.55;color:#52525b;">We are glad to have you with us. Your Pro membership is now active, and you have access to <strong style="color:#09090b;">all programs and features</strong> in Core Padel.</p>
            </td>
          </tr>
          <tr>
            <td style="padding:28px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#fafafa;border-radius:12px;border:1px solid #e4e4e7;margin:0 0 24px;">
                <tr>
                  <td style="padding:18px 20px;">
                    <p style="margin:0 0 10px;font-size:12px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;color:#65a30d;">You now have access to</p>
                    <p style="margin:0 0 8px;font-size:14px;line-height:1.55;color:#3f3f46;">• Every training program — gym, home, and on court</p>
                    <p style="margin:0 0 8px;font-size:14px;line-height:1.55;color:#3f3f46;">• The full exercise library with video demos</p>
                    <p style="margin:0;font-size:14px;line-height:1.55;color:#3f3f46;">• AI Coach and all Pro member features</p>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 24px;font-size:15px;line-height:1.55;color:#52525b;">Whenever you are ready, jump in and start training. We built Core Padel to help you move better, hit harder, and stay injury-free.</p>
              <table role="presentation" cellspacing="0" cellpadding="0" style="margin:0 0 12px;">
                <tr>
                  <td style="border-radius:14px;background-color:#ccff00;">
                    <a href="${memberHref}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:16px 32px;font-size:16px;font-weight:700;color:#09090b;text-decoration:none;border-radius:14px;">Go to your dashboard</a>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 20px;font-size:13px;line-height:1.55;color:#71717a;">
                Prefer to browse first?
                <a href="${programsHref}" target="_blank" rel="noopener noreferrer" style="color:#3f6212;font-weight:600;text-decoration:underline;">Explore all programs</a>
              </p>
              <p style="margin:0;font-size:12px;line-height:1.5;color:#71717a;">Button not working? Paste this link into your browser:<br /><span style="color:#52525b;word-break:break-all;">${memberVisible}</span></p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 28px 28px;">
              <p style="margin:0;padding-top:24px;border-top:1px solid #e4e4e7;font-size:11px;line-height:1.5;color:#a1a1aa;">You are receiving this because you subscribed to Core Padel Pro. Manage billing anytime from your member profile.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = [
    `${greetingText} — welcome to Pro`,
    "",
    "We are glad to have you with us. Your Pro membership is now active, and you have access to all programs and features in Core Padel.",
    "",
    "You now have access to:",
    "- Every training program — gym, home, and on court",
    "- The full exercise library with video demos",
    "- AI Coach and all Pro member features",
    "",
    "Whenever you are ready, jump in and start training.",
    "",
    `Go to your dashboard: ${input.memberUrl}`,
    `Explore all programs: ${input.programsUrl}`,
    "",
    "Manage billing anytime from your member profile.",
  ].join("\n");

  return { html, text };
}
