import type { SupabaseClient } from "@supabase/supabase-js";
import { sendTaskCommentEmail } from "./send-task-comment";

function siteBase(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || "https://corepadel.app").replace(/\/$/, "");
}

export async function notifyTaskCreatorOnComment(params: {
  supabase: SupabaseClient;
  cardId: string;
  boardId: string;
  taskTitle: string;
  commentBody: string;
  commenterUserId: string;
}): Promise<void> {
  const { data: card } = await params.supabase
    .from("task_cards")
    .select("created_by")
    .eq("id", params.cardId)
    .maybeSingle();

  const creatorId = (card?.created_by as string | null) ?? null;
  if (!creatorId || creatorId === params.commenterUserId) return;

  const [boardRes, creatorRes, commenterRes] = await Promise.all([
    params.supabase.from("task_boards").select("title").eq("id", params.boardId).maybeSingle(),
    params.supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", creatorId)
      .maybeSingle(),
    params.supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", params.commenterUserId)
      .maybeSingle(),
  ]);

  const creatorEmail = (creatorRes.data?.email as string | null)?.trim();
  if (!creatorEmail) return;

  const boardTitle = (boardRes.data?.title as string | undefined)?.trim() || "Task board";
  const commenterName =
    (commenterRes.data?.full_name as string | null)?.trim() ||
    (commenterRes.data?.email as string | null)?.trim() ||
    "A teammate";

  const boardUrl = `${siteBase()}/admin/tasks/${params.boardId}`;

  const result = await sendTaskCommentEmail({
    to: creatorEmail,
    taskTitle: params.taskTitle,
    boardTitle,
    boardUrl,
    commenterName,
    commentBody: params.commentBody,
  });

  if (!result.ok) {
    console.warn(
      `[task-comment] Failed to email ${creatorEmail} for card ${params.cardId}:`,
      result.error
    );
  }
}
