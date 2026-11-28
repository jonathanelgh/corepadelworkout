function escapeHtmlText(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function escapeHtmlAttr(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

export function buildAffiliateWelcomeEmail(input: {
  name: string;
  email: string;
  password?: string | null;
  loginUrl: string;
  referralLink: string;
}): { html: string; text: string } {
  const name = escapeHtmlText(input.name.trim() || "there");
  const plainName = input.name.trim() || "there";
  const email = escapeHtmlText(input.email);
  const password = input.password?.trim() ? escapeHtmlText(input.password.trim()) : null;
  const loginHref = escapeHtmlAttr(input.loginUrl);
  const loginVisible = escapeHtmlText(input.loginUrl);
  const referralVisible = escapeHtmlText(input.referralLink);
  const intro = password
    ? "Your affiliate account is ready. Sign in with the temporary password below. The first time you sign in, you will choose your own password."
    : "Welcome to the Core Padel affiliate program. Sign in with the email and password you already use. After you sign in, you land on your affiliate dashboard.";

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Your Core Padel affiliate account</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;color:#18181b;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f4f4f5;">
    <tr>
      <td align="center" style="padding:40px 16px 48px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;margin:0 auto;background-color:#ffffff;border-radius:16px;border:1px solid #e4e4e7;">
          <tr>
            <td style="padding:32px 28px 8px;">
              <p style="margin:0;font-size:11px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:#65a30d;">Core Padel Workout</p>
              <p style="margin:10px 0 0;font-size:26px;font-weight:600;line-height:1.25;color:#09090b;">Welcome, ${name}</p>
              <p style="margin:12px 0 0;font-size:15px;line-height:1.55;color:#52525b;">${intro}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 28px 28px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#fafafa;border-radius:12px;border:1px solid #e4e4e7;">
                <tr>
                  <td style="padding:18px 20px;font-size:14px;line-height:1.6;color:#3f3f46;">
                    <p style="margin:0 0 8px;"><strong style="color:#09090b;">Where to sign in</strong><br />Use the button below. It opens the Core Padel login page and takes you to your affiliate dashboard.</p>
                    <p style="margin:0${password ? " 0 8px" : ""};"><strong style="color:#09090b;">Email</strong><br />${email}</p>
                    ${password ? `<p style="margin:0;"><strong style="color:#09090b;">Temporary password</strong><br />${password}</p>` : ""}
                  </td>
                </tr>
              </table>
              <table role="presentation" cellspacing="0" cellpadding="0" style="margin:24px 0 12px;">
                <tr>
                  <td style="border-radius:14px;background-color:#09090b;">
                    <a href="${loginHref}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:14px;">Sign in</a>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 16px;font-size:13px;line-height:1.55;color:#71717a;">Button not working? Paste this link into your browser:<br /><span style="color:#52525b;word-break:break-all;">${loginVisible}</span></p>
              <p style="margin:0;font-size:14px;line-height:1.55;color:#52525b;">Your referral link:<br /><span style="color:#09090b;word-break:break-all;">${referralVisible}</span></p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = [
    `Welcome, ${plainName}`,
    "",
    password
      ? "Your affiliate account is ready. Sign in with the temporary password below. The first time you sign in, you will choose your own password."
      : "Welcome to the Core Padel affiliate program. Sign in with the email and password you already use. After you sign in, you land on your affiliate dashboard.",
    "",
    `Sign in: ${input.loginUrl}`,
    `Email: ${input.email}`,
    ...(input.password?.trim() ? [`Temporary password: ${input.password.trim()}`] : []),
    "",
    `Your referral link: ${input.referralLink}`,
  ].join("\n");

  return { html, text };
}
