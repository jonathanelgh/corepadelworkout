function escapeHtmlText(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function escapeHtmlAttr(url: string): string {
  return url.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

export function buildTaskMovedEmail(params: {
  taskTitle: string;
  boardTitle: string;
  boardUrl: string;
  movedByName: string;
  fromColumnName: string;
  toColumnName: string;
}): { html: string; text: string } {
  const taskTitle = escapeHtmlText(params.taskTitle);
  const boardTitle = escapeHtmlText(params.boardTitle);
  const movedBy = escapeHtmlText(params.movedByName);
  const fromColumn = escapeHtmlText(params.fromColumnName);
  const toColumn = escapeHtmlText(params.toColumnName);
  const boardUrl = escapeHtmlAttr(params.boardUrl);
  const boardUrlText = escapeHtmlText(params.boardUrl);

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="color-scheme" content="dark" />
  <title>Task moved</title>
</head>
<body style="margin:0;padding:0;background-color:#0a0a0a;color:#e5e5e5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#0a0a0a;">
    <tr>
      <td align="center" style="padding:40px 16px 48px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;margin:0 auto;">
          <tr>
            <td style="padding:0 0 28px;border-bottom:1px solid rgba(255,255,255,0.12);">
              <p style="margin:0;font-size:11px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:#ccff00;">Core Padel Workout</p>
              <p style="margin:10px 0 0;font-size:22px;font-weight:600;line-height:1.25;color:#ffffff;">Task moved</p>
              <p style="margin:12px 0 0;font-size:15px;line-height:1.55;color:#a3a3a3;"><strong style="color:#ffffff;">${movedBy}</strong> moved a task on <strong style="color:#ffffff;">${boardTitle}</strong>.</p>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 0 0;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:rgba(255,255,255,0.04);border-radius:12px;border:1px solid rgba(255,255,255,0.08);margin:0 0 24px;">
                <tr>
                  <td style="padding:18px 20px;">
                    <p style="margin:0 0 8px;font-size:12px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;color:#ccff00;">Task</p>
                    <p style="margin:0 0 16px;font-size:18px;font-weight:600;line-height:1.3;color:#ffffff;">${taskTitle}</p>
                    <p style="margin:0;font-size:14px;line-height:1.55;color:#d4d4d4;"><strong style="color:#ffffff;">${fromColumn}</strong> <span style="color:#737373;">→</span> <strong style="color:#ccff00;">${toColumn}</strong></p>
                  </td>
                </tr>
              </table>
              <table role="presentation" cellspacing="0" cellpadding="0" style="margin:0 0 24px;">
                <tr>
                  <td style="border-radius:14px;background-color:#ccff00;">
                    <a href="${boardUrl}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:700;color:#0a0a0a;text-decoration:none;border-radius:14px;">Open board</a>
                  </td>
                </tr>
              </table>
              <p style="margin:0;font-size:12px;line-height:1.5;color:#737373;">Button not working? Paste this link into your browser:<br /><span style="color:#a3a3a3;word-break:break-all;">${boardUrlText}</span></p>
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
    "Core Padel Workout — Task moved",
    "",
    `${params.movedByName} moved "${params.taskTitle}" on board "${params.boardTitle}".`,
    `${params.fromColumnName} → ${params.toColumnName}`,
    "",
    `Open board: ${params.boardUrl}`,
  ].join("\n");

  return { html, text };
}
