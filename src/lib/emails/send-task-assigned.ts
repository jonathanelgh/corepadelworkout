import { Resend } from "resend";
import { buildTaskAssignedEmail } from "./task-assigned-html";

export async function sendTaskAssignedEmail(params: {
  to: string;
  taskTitle: string;
  boardTitle: string;
  boardUrl: string;
  assignedByName: string;
  dueDate: string | null;
  taskDescription: string | null;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    console.warn("[task-assigned] RESEND_API_KEY not set; email skipped.");
    return { ok: false, error: "RESEND_API_KEY not configured" };
  }

  const from =
    process.env.RESEND_FROM?.trim() || "Core Padel Workout <hello@corepadel.app>";
  const { html, text } = buildTaskAssignedEmail(params);

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from,
    to: [params.to],
    subject: `Assigned: ${params.taskTitle}`,
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
