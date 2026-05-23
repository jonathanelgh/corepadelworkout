export function buildBulkImportCompleteEmail(params: {
  total: number;
  completed: number;
  failed: number;
  exercisesUrl: string;
}): { html: string; text: string } {
  const { total, completed, failed, exercisesUrl } = params;
  const allOk = failed === 0;

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><title>Bulk exercise import</title></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:520px;background:#111;border-radius:16px;border:1px solid #222;">
        <tr><td style="padding:28px 28px 8px;">
          <p style="margin:0;font-size:11px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:#ccff00;">Core Padel Workout</p>
          <h1 style="margin:12px 0 0;font-size:22px;font-weight:600;color:#fff;">Your bulk import is ${allOk ? "ready" : "finished"}</h1>
        </td></tr>
        <tr><td style="padding:8px 28px 20px;">
          <p style="margin:0;font-size:15px;line-height:1.6;color:#ccc;">
            We processed <strong style="color:#fff;">${total}</strong> video${total === 1 ? "" : "s"}.
            <strong style="color:#ccff00;">${completed}</strong> exercise${completed === 1 ? "" : "s"} created${failed > 0 ? `, <strong style="color:#f87171;">${failed}</strong> failed` : ""}.
          </p>
        </td></tr>
        <tr><td style="padding:0 28px 28px;">
          <a href="${exercisesUrl}" style="display:inline-block;background:#ccff00;color:#000;font-size:14px;font-weight:700;text-decoration:none;padding:14px 24px;border-radius:12px;">View exercises</a>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const text = `Core Padel Workout — bulk import complete

Processed ${total} video(s): ${completed} created${failed > 0 ? `, ${failed} failed` : ""}.

View exercises: ${exercisesUrl}`;

  return { html, text };
}
