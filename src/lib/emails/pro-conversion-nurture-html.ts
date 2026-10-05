import { PRO_MONTHLY_PRICE_EUR } from "@/lib/billing/format-subscription-price";

function escapeHtmlAttr(url: string): string {
  return url.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function escapeHtmlText(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export type ProConversionStep = 1 | 2 | 3 | 4;

export type ProConversionEmailInput = {
  step: ProConversionStep;
  firstName: string | null;
  upgradeUrl: string;
  programsUrl: string;
  memberUrl: string;
  unsubscribeUrl: string;
  /** Optional locked / peeked program title for CTA personalization. */
  programTitle?: string | null;
};

const SUBJECTS: Record<ProConversionStep, string> = {
  1: "Your Core Padel account is ready — unlock full training",
  2: "Train with a plan built for padel",
  3: "Everything in one place for your padel training",
  4: "Still thinking it over?",
};

const PREVIEWS: Record<ProConversionStep, string> = {
  1: "All programs, video library, and AI Coach with Pro",
  2: "Structure beats random gym work when you want better movement on court",
  3: "Programs, exercise videos, and AI Coach — cancel anytime",
  4: "Your account stays free — Pro is here when you are ready",
};

const CTAS: Record<ProConversionStep, string> = {
  1: "Unlock Pro",
  2: "Continue with Pro",
  3: "Start Pro",
  4: "Upgrade to Pro",
};

export function proConversionSubject(step: ProConversionStep): string {
  return SUBJECTS[step];
}

export function proConversionPreview(step: ProConversionStep): string {
  return PREVIEWS[step];
}

function greetingLine(firstName: string | null): { html: string; text: string } {
  const name = firstName?.trim() || null;
  if (name) {
    return { html: `Hi ${escapeHtmlText(name)},`, text: `Hi ${name},` };
  }
  return { html: "Hi,", text: "Hi," };
}

function shell(input: {
  preview: string;
  title: string;
  bodyHtml: string;
  ctaLabel: string;
  ctaHref: string;
  secondaryHtml: string;
  unsubscribeUrl: string;
}): { html: string; textBody: string } {
  const preview = escapeHtmlText(input.preview);
  const title = escapeHtmlText(input.title);
  const ctaHref = escapeHtmlAttr(input.ctaHref);
  const ctaLabel = escapeHtmlText(input.ctaLabel);
  const unsub = escapeHtmlAttr(input.unsubscribeUrl);
  const ctaVisible = escapeHtmlText(input.ctaHref);

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="color-scheme" content="light only" />
  <meta name="supported-color-schemes" content="light" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;color:#18181b;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${preview}</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f4f4f5;">
    <tr>
      <td align="center" style="padding:40px 16px 48px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;margin:0 auto;background-color:#ffffff;border-radius:16px;border:1px solid #e4e4e7;">
          <tr>
            <td style="padding:32px 28px 28px;border-bottom:1px solid #e4e4e7;">
              <p style="margin:0;font-size:11px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:#65a30d;">Core Padel Workout</p>
              <p style="margin:10px 0 0;font-size:26px;font-weight:600;line-height:1.25;color:#09090b;">${title}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:28px;">
              ${input.bodyHtml}
              <table role="presentation" cellspacing="0" cellpadding="0" style="margin:0 0 12px;">
                <tr>
                  <td style="border-radius:14px;background-color:#ccff00;">
                    <a href="${ctaHref}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:16px 32px;font-size:16px;font-weight:700;color:#09090b;text-decoration:none;border-radius:14px;">${ctaLabel}</a>
                  </td>
                </tr>
              </table>
              ${input.secondaryHtml}
              <p style="margin:20px 0 0;font-size:12px;line-height:1.5;color:#71717a;">Button not working? Paste this link into your browser:<br /><span style="color:#52525b;word-break:break-all;">${ctaVisible}</span></p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 28px 28px;">
              <p style="margin:0;padding-top:24px;border-top:1px solid #e4e4e7;font-size:11px;line-height:1.5;color:#a1a1aa;">
                You are receiving this because you created a Core Padel account.
                <a href="${unsub}" target="_blank" rel="noopener noreferrer" style="color:#71717a;text-decoration:underline;">Unsubscribe from these emails</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return { html, textBody: "" };
}

function secondaryLink(label: string, href: string): string {
  return `<p style="margin:0 0 0;font-size:13px;line-height:1.55;color:#71717a;">
    <a href="${escapeHtmlAttr(href)}" target="_blank" rel="noopener noreferrer" style="color:#3f6212;font-weight:600;text-decoration:underline;">${escapeHtmlText(label)}</a>
  </p>`;
}

export function buildProConversionEmail(input: ProConversionEmailInput): {
  subject: string;
  html: string;
  text: string;
} {
  const greet = greetingLine(input.firstName);
  const subject = SUBJECTS[input.step];
  const preview = PREVIEWS[input.step];
  const ctaLabel =
    input.step === 2 && input.programTitle?.trim()
      ? `Continue ${input.programTitle.trim()} with Pro`
      : CTAS[input.step];

  const priceLabel = `€${PRO_MONTHLY_PRICE_EUR.toFixed(2)}`;

  let title = "";
  let bodyHtml = "";
  let textLines: string[] = [];
  let secondaryHtml = "";
  let secondaryText = "";

  if (input.step === 1) {
    title = "Unlock full training with Pro";
    bodyHtml = `
      <p style="margin:0 0 16px;font-size:15px;line-height:1.55;color:#52525b;">${greet.html}</p>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.55;color:#52525b;">Welcome to Core Padel. You are in — next step is choosing how you train.</p>
      <p style="margin:0 0 10px;font-size:15px;line-height:1.55;color:#52525b;">With <strong style="color:#09090b;">Pro</strong> you get:</p>
      <p style="margin:0 0 8px;font-size:14px;line-height:1.55;color:#3f3f46;">• Every program (gym, home, and on court)</p>
      <p style="margin:0 0 8px;font-size:14px;line-height:1.55;color:#3f3f46;">• Full exercise library with video demos</p>
      <p style="margin:0 0 16px;font-size:14px;line-height:1.55;color:#3f3f46;">• AI Coach and all member features</p>
      <p style="margin:0 0 24px;font-size:15px;line-height:1.55;color:#52525b;">Pick a program and train with a clear plan instead of random sessions.</p>
    `;
    secondaryHtml = secondaryLink("Browse programs", input.programsUrl);
    textLines = [
      greet.text,
      "",
      "Welcome to Core Padel. You are in — next step is choosing how you train.",
      "",
      "With Pro you get:",
      "- Every program (gym, home, and on court)",
      "- Full exercise library with video demos",
      "- AI Coach and all member features",
      "",
      "Pick a program and train with a clear plan instead of random sessions.",
    ];
    secondaryText = `Browse programs: ${input.programsUrl}`;
  } else if (input.step === 2) {
    title = "A plan built for padel";
    bodyHtml = `
      <p style="margin:0 0 16px;font-size:15px;line-height:1.55;color:#52525b;">${greet.html}</p>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.55;color:#52525b;">Most players do not need more random exercises. They need a plan that matches padel — power, stability, and staying healthy through the season.</p>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.55;color:#52525b;">Pro unlocks structured programs you can follow day by day, with video guidance so every set is done right.</p>
      <p style="margin:0 0 24px;font-size:15px;line-height:1.55;color:#52525b;">If you already peeked at a program and hit a lock, that is the upgrade — one click and you can continue from where you left off.</p>
    `;
    secondaryHtml = secondaryLink("See programs", input.programsUrl);
    textLines = [
      greet.text,
      "",
      "Most players do not need more random exercises. They need a plan that matches padel — power, stability, and staying healthy through the season.",
      "",
      "Pro unlocks structured programs you can follow day by day, with video guidance so every set is done right.",
      "",
      "If you already peeked at a program and hit a lock, that is the upgrade — one click and you can continue from where you left off.",
    ];
    secondaryText = `See programs: ${input.programsUrl}`;
  } else if (input.step === 3) {
    title = "Your full padel training toolkit";
    bodyHtml = `
      <p style="margin:0 0 16px;font-size:15px;line-height:1.55;color:#52525b;">${greet.html}</p>
      <p style="margin:0 0 12px;font-size:15px;line-height:1.55;color:#52525b;">Pro is the full Core Padel toolkit:</p>
      <p style="margin:0 0 8px;font-size:14px;line-height:1.55;color:#3f3f46;"><strong style="color:#09090b;">1. Programs</strong> — follow a path instead of guessing what to do today</p>
      <p style="margin:0 0 8px;font-size:14px;line-height:1.55;color:#3f3f46;"><strong style="color:#09090b;">2. Exercise library</strong> — video demos you can trust</p>
      <p style="margin:0 0 16px;font-size:14px;line-height:1.55;color:#3f3f46;"><strong style="color:#09090b;">3. AI Coach</strong> — help when you want a program shaped to you</p>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.55;color:#52525b;">Built for players who want to move better, hit harder, and stay injury-free.</p>
      <p style="margin:0 0 24px;font-size:15px;line-height:1.55;color:#52525b;">Pro is <strong style="color:#09090b;">${escapeHtmlText(priceLabel)}/month</strong>. Cancel anytime from your account.</p>
    `;
    secondaryHtml = secondaryLink("Open your dashboard", input.memberUrl);
    textLines = [
      greet.text,
      "",
      "Pro is the full Core Padel toolkit:",
      "1. Programs — follow a path instead of guessing what to do today",
      "2. Exercise library — video demos you can trust",
      "3. AI Coach — help when you want a program shaped to you",
      "",
      "Built for players who want to move better, hit harder, and stay injury-free.",
      "",
      `Pro is ${priceLabel}/month. Cancel anytime from your account.`,
    ];
    secondaryText = `Open your dashboard: ${input.memberUrl}`;
  } else {
    title = "Ready when you are";
    bodyHtml = `
      <p style="margin:0 0 16px;font-size:15px;line-height:1.55;color:#52525b;">${greet.html}</p>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.55;color:#52525b;">No pressure. Your free account stays yours.</p>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.55;color:#52525b;">Whenever you want the full library of programs and features, Pro is one step away. Same training system our members use to stay consistent through the week.</p>
      <p style="margin:0 0 24px;font-size:15px;line-height:1.55;color:#52525b;">We will leave it here for now — you can upgrade anytime from your dashboard.</p>
    `;
    secondaryHtml = secondaryLink("Go to your dashboard", input.memberUrl);
    textLines = [
      greet.text,
      "",
      "No pressure. Your free account stays yours.",
      "",
      "Whenever you want the full library of programs and features, Pro is one step away. Same training system our members use to stay consistent through the week.",
      "",
      "We will leave it here for now — you can upgrade anytime from your dashboard.",
    ];
    secondaryText = `Go to your dashboard: ${input.memberUrl}`;
  }

  const { html } = shell({
    preview,
    title,
    bodyHtml,
    ctaLabel,
    ctaHref: input.upgradeUrl,
    secondaryHtml,
    unsubscribeUrl: input.unsubscribeUrl,
  });

  const text = [
    ...textLines,
    "",
    `${ctaLabel}: ${input.upgradeUrl}`,
    secondaryText,
    "",
    `Unsubscribe from these emails: ${input.unsubscribeUrl}`,
  ].join("\n");

  return { subject, html, text };
}
