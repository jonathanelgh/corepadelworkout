import type { SupabaseClient } from "@supabase/supabase-js";
import { sendTaskAssignedEmail } from "./send-task-assigned";

function siteBase(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || "https://corepadel.app").replace(/\/$/, "");
}

function formatDueDate(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso.includes("T") ? iso : `${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export async function notifyNewTaskAssignees(params: {
  supabase: SupabaseClient;
  cardId: string;
  boardId: string;
  taskTitle: string;
  taskDescription: string | null;
  dueDate: string | null;
  previousAssigneeIds: Set<string>;
  nextAssigneeIds: string[];
  assignedByUserId: string;
}): Promise<void> {
  const newlyAssigned = params.nextAssigneeIds.filter(
    (id) => !params.previousAssigneeIds.has(id) && id !== params.assignedByUserId
  );
  if (newlyAssigned.length === 0) return;

  const [boardRes, assignerRes, profilesRes] = await Promise.all([
    params.supabase.from("task_boards").select("title").eq("id", params.boardId).maybeSingle(),
    params.supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", params.assignedByUserId)
      .maybeSingle(),
    params.supabase
      .from("profiles")
      .select("id, full_name, email")
      .in("id", newlyAssigned),
  ]);

  const boardTitle = (boardRes.data?.title as string | undefined)?.trim() || "Task board";
  const assignerRow = assignerRes.data;
  const assignedByName =
    (assignerRow?.full_name as string | null)?.trim() ||
    (assignerRow?.email as string | null)?.trim() ||
    "A teammate";

  const boardUrl = `${siteBase()}/admin/tasks/${params.boardId}`;
  const dueLabel = formatDueDate(params.dueDate);

  for (const row of profilesRes.data ?? []) {
    const email = (row.email as string | null)?.trim();
    if (!email) continue;

    const result = await sendTaskAssignedEmail({
      to: email,
      taskTitle: params.taskTitle,
      boardTitle,
      boardUrl,
      assignedByName,
      dueDate: dueLabel,
      taskDescription: params.taskDescription,
    });

    if (!result.ok) {
      console.warn(
        `[task-assigned] Failed to email ${email} for card ${params.cardId}:`,
        result.error
      );
    }
  }
}
