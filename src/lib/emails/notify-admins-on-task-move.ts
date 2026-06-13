import type { SupabaseClient } from "@supabase/supabase-js";
import { sendTaskMovedEmail } from "./send-task-moved";

function siteBase(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || "https://corepadel.app").replace(/\/$/, "");
}

export async function notifyAdminsOnTaskMove(params: {
  supabase: SupabaseClient;
  cardId: string;
  boardId: string;
  taskTitle: string;
  fromColumnId: string;
  toColumnId: string;
  movedByUserId: string;
}): Promise<void> {
  const [adminRes, boardRes, columnsRes, moverRes] = await Promise.all([
    params.supabase.from("admin_users").select("user_id"),
    params.supabase.from("task_boards").select("title").eq("id", params.boardId).maybeSingle(),
    params.supabase
      .from("task_board_columns")
      .select("id, name")
      .in("id", [params.fromColumnId, params.toColumnId]),
    params.supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", params.movedByUserId)
      .maybeSingle(),
  ]);

  const adminIds = (adminRes.data ?? []).map((r) => r.user_id as string);
  if (adminIds.length === 0) return;

  const { data: profiles } = await params.supabase
    .from("profiles")
    .select("id, full_name, email")
    .in("id", adminIds);

  const columnNameById = new Map<string, string>();
  for (const col of columnsRes.data ?? []) {
    columnNameById.set(col.id as string, (col.name as string).trim() || "Column");
  }

  const fromColumnName = columnNameById.get(params.fromColumnId) ?? "Previous column";
  const toColumnName = columnNameById.get(params.toColumnId) ?? "New column";
  const boardTitle = (boardRes.data?.title as string | undefined)?.trim() || "Task board";
  const movedByName =
    (moverRes.data?.full_name as string | null)?.trim() ||
    (moverRes.data?.email as string | null)?.trim() ||
    "A teammate";
  const boardUrl = `${siteBase()}/admin/tasks/${params.boardId}`;

  for (const row of profiles ?? []) {
    const email = (row.email as string | null)?.trim();
    if (!email) continue;

    const result = await sendTaskMovedEmail({
      to: email,
      taskTitle: params.taskTitle,
      boardTitle,
      boardUrl,
      movedByName,
      fromColumnName,
      toColumnName,
    });

    if (!result.ok) {
      console.warn(
        `[task-moved] Failed to email ${email} for card ${params.cardId}:`,
        result.error
      );
    }
  }
}
