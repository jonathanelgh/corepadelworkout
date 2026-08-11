function escapeHtmlText(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function buildMemberFeedbackEmail(params: {
  memberName: string;
  memberEmail: string;
  categoryLabel: string;
  message: string;
  submittedAt: string;
}): { html: string; text: string } {
  const memberName = escapeHtmlText(params.memberName);
  const memberEmail = escapeHtmlText(params.memberEmail);
  const categoryLabel = escapeHtmlText(params.categoryLabel);
  const message = escapeHtmlText(params.message).replace(/\n/g, "<br />");
  const submittedAt = escapeHtmlText(params.submittedAt);

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="color-scheme" content="dark" />
  <title>Member feedback</title>
</head>
<body style="margin:0;padding:0;background-color:#0a0a0a;color:#e5e5e5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#0a0a0a;">
    <tr>
      <td align="center" style="padding:40px 16px 48px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;margin:0 auto;">
          <tr>
            <td style="padding:0 0 28px;border-bottom:1px solid rgba(255,255,255,0.12);">
              <p style="margin:0;font-size:11px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:#ccff00;">Core Padel Workout</p>
              <p style="margin:10px 0 0;font-size:22px;font-weight:600;line-height:1.25;color:#ffffff;">New member feedback</p>
              <p style="margin:12px 0 0;font-size:15px;line-height:1.55;color:#a3a3a3;">Someone left feedback from the member dashboard.</p>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 0 0;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:rgba(255,255,255,0.04);border-radius:12px;border:1px solid rgba(255,255,255,0.08);margin:0 0 24px;">
                <tr>
                  <td style="padding:18px 20px;">
                    <p style="margin:0 0 8px;font-size:12px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;color:#ccff00;">From</p>
                    <p style="margin:0 0 4px;font-size:16px;font-weight:600;color:#ffffff;">${memberName}</p>
                    <p style="margin:0 0 16px;font-size:14px;color:#a3a3a3;">${memberEmail}</p>
                    <p style="margin:0 0 8px;font-size:12px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;color:#ccff00;">Category</p>
                    <p style="margin:0 0 16px;font-size:14px;color:#d4d4d4;">${categoryLabel}</p>
                    <p style="margin:0 0 8px;font-size:12px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;color:#ccff00;">Message</p>
                    <p style="margin:0;font-size:15px;line-height:1.6;color:#ffffff;">${message}</p>
                  </td>
                </tr>
              </table>
              <p style="margin:0;font-size:12px;line-height:1.5;color:#737373;">Submitted ${submittedAt}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 0 0;border-top:1px solid rgba(255,255,255,0.08);">
              <p style="margin:0;font-size:11px;line-height:1.5;color:#525252;">You are receiving this because you are an admin on Core Padel Workout.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = [
    "Core Padel Workout — New member feedback",
    "",
    `From: ${params.memberName} <${params.memberEmail}>`,
    `Category: ${params.categoryLabel}`,
    `Submitted: ${params.submittedAt}`,
    "",
    params.message,
    "",
    "—",
    "You are receiving this because you are an admin on Core Padel Workout.",
  ].join("\n");

  return { html, text };
}
