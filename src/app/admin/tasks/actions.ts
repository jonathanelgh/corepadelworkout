"use server";

import { createClient } from "@/utils/supabase/server";
import { getIsAdmin } from "@/utils/supabase/is-admin";
import { revalidatePath } from "next/cache";
import { notifyNewTaskAssignees } from "@/lib/emails/notify-task-assignees";
import type { AssigneeOption, TaskBoardDetail, TaskBoardListItem } from "./types";

const TASKS_PATH = "/admin/tasks";
const DEFAULT_COLUMNS = ["Backlog", "To do", "In progress", "Completed"];

type ActionResult = { ok: true } | { error: string };

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "You must be signed in.", supabase: null as null, user: null as null };
  }
  if (!(await getIsAdmin(supabase))) {
    return { error: "Not authorized.", supabase: null as null, user: null as null };
  }
  return { error: null, supabase, user };
}

function revalidateBoard(boardId?: string) {
  revalidatePath(TASKS_PATH);
  if (boardId) revalidatePath(`${TASKS_PATH}/${boardId}`);
}

export async function listAssigneeOptions(): Promise<AssigneeOption[] | { error: string }> {
  const auth = await requireAdmin();
  if (auth.error || !auth.supabase) return { error: auth.error ?? "Unauthorized" };

  const { data: adminRows, error: adminErr } = await auth.supabase
    .from("admin_users")
    .select("user_id");

  if (adminErr) return { error: adminErr.message };

  const adminIds = (adminRows ?? []).map((r) => r.user_id as string);
  if (adminIds.length === 0) return [];

  const { data: profiles, error: profileErr } = await auth.supabase
    .from("profiles")
    .select("id, full_name, email")
    .in("id", adminIds);

  if (profileErr) return { error: profileErr.message };

  const profileById = new Map(
    (profiles ?? []).map((p) => [
      p.id as string,
      {
        name: (p.full_name as string | null)?.trim() || null,
        email: (p.email as string | null)?.trim() || null,
      },
    ])
  );

  return adminIds
    .map((id) => {
      const p = profileById.get(id);
      const label = p?.name || p?.email || "Admin";
      return { id, label, email: p?.email ?? null };
    })
    .sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: "base" }));
}

export async function listTaskBoards(): Promise<TaskBoardListItem[] | { error: string }> {
  const auth = await requireAdmin();
  if (auth.error || !auth.supabase) return { error: auth.error ?? "Unauthorized" };

  const { data: boards, error } = await auth.supabase
    .from("task_boards")
    .select("id, title, description, updated_at")
    .order("updated_at", { ascending: false });

  if (error) return { error: error.message };
  if (!boards?.length) return [];

  const boardIds = boards.map((b) => b.id as string);
  const { data: cardCounts } = await auth.supabase.from("task_cards").select("board_id").in("board_id", boardIds);

  const countByBoard = new Map<string, number>();
  for (const row of cardCounts ?? []) {
    const bid = row.board_id as string;
    countByBoard.set(bid, (countByBoard.get(bid) ?? 0) + 1);
  }

  return boards.map((b) => ({
    id: b.id as string,
    title: b.title as string,
    description: (b.description as string | null) ?? null,
    updatedAt: b.updated_at as string,
    cardCount: countByBoard.get(b.id as string) ?? 0,
  }));
}

export async function getTaskBoard(boardId: string): Promise<TaskBoardDetail | { error: string }> {
  const auth = await requireAdmin();
  if (auth.error || !auth.supabase) return { error: auth.error ?? "Unauthorized" };

  const { data: board, error: bErr } = await auth.supabase
    .from("task_boards")
    .select("id, title, description")
    .eq("id", boardId)
    .maybeSingle();

  if (bErr) return { error: bErr.message };
  if (!board) return { error: "Board not found." };

  const [colsRes, cardsRes, assignRes] = await Promise.all([
    auth.supabase
      .from("task_board_columns")
      .select("id, name, sort_order")
      .eq("board_id", boardId)
      .order("sort_order", { ascending: true }),
    auth.supabase
      .from("task_cards")
      .select("id, column_id, title, description, due_date, sort_order, completed")
      .eq("board_id", boardId)
      .order("sort_order", { ascending: true }),
    auth.supabase.from("task_card_assignees").select("card_id, user_id"),
  ]);

  if (colsRes.error) return { error: colsRes.error.message };
  if (cardsRes.error) return { error: cardsRes.error.message };
  if (assignRes.error) return { error: assignRes.error.message };

  const assigneesByCard = new Map<string, string[]>();
  for (const row of assignRes.data ?? []) {
    const cid = row.card_id as string;
    const list = assigneesByCard.get(cid) ?? [];
    list.push(row.user_id as string);
    assigneesByCard.set(cid, list);
  }

  const cardsByColumn = new Map<string, TaskBoardDetail["columns"][0]["cards"]>();
  for (const c of cardsRes.data ?? []) {
    const colId = c.column_id as string;
    const list = cardsByColumn.get(colId) ?? [];
    list.push({
      id: c.id as string,
      columnId: colId,
      title: c.title as string,
      description: (c.description as string | null) ?? "",
      dueDate: (c.due_date as string | null) ?? null,
      sortOrder: c.sort_order as number,
      completed: Boolean(c.completed),
      assigneeIds: assigneesByCard.get(c.id as string) ?? [],
    });
    cardsByColumn.set(colId, list);
  }

  const columns = (colsRes.data ?? []).map((col) => ({
    id: col.id as string,
    name: col.name as string,
    sortOrder: col.sort_order as number,
    cards: cardsByColumn.get(col.id as string) ?? [],
  }));

  return {
    id: board.id as string,
    title: board.title as string,
    description: (board.description as string | null) ?? null,
    columns,
  };
}

export async function createTaskBoard(title: string, description?: string): Promise<{ ok: true; boardId: string } | { error: string }> {
  const auth = await requireAdmin();
  if (auth.error || !auth.supabase || !auth.user) return { error: auth.error ?? "Unauthorized" };

  const t = title.trim();
  if (!t) return { error: "Board title is required." };

  const { data: board, error } = await auth.supabase
    .from("task_boards")
    .insert({
      title: t,
      description: description?.trim() || null,
      created_by: auth.user.id,
    })
    .select("id")
    .single();

  if (error || !board) return { error: error?.message ?? "Could not create board." };

  const boardId = board.id as string;
  const columnRows = DEFAULT_COLUMNS.map((name, i) => ({
    board_id: boardId,
    name,
    sort_order: i,
  }));

  const { error: colErr } = await auth.supabase.from("task_board_columns").insert(columnRows);
  if (colErr) {
    await auth.supabase.from("task_boards").delete().eq("id", boardId);
    return { error: colErr.message };
  }

  revalidateBoard(boardId);
  return { ok: true, boardId };
}

export async function deleteTaskBoard(boardId: string): Promise<ActionResult> {
  const auth = await requireAdmin();
  if (auth.error || !auth.supabase) return { error: auth.error ?? "Unauthorized" };

  const { error } = await auth.supabase.from("task_boards").delete().eq("id", boardId);
  if (error) return { error: error.message };

  revalidateBoard();
  return { ok: true };
}

export async function createTaskColumn(boardId: string, name: string): Promise<ActionResult> {
  const auth = await requireAdmin();
  if (auth.error || !auth.supabase) return { error: auth.error ?? "Unauthorized" };

  const label = name.trim();
  if (!label) return { error: "Column name is required." };

  const { data: maxRow } = await auth.supabase
    .from("task_board_columns")
    .select("sort_order")
    .eq("board_id", boardId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextOrder = maxRow ? (maxRow.sort_order as number) + 1 : 0;

  const { error } = await auth.supabase.from("task_board_columns").insert({
    board_id: boardId,
    name: label,
    sort_order: nextOrder,
  });

  if (error) return { error: error.message };
  revalidateBoard(boardId);
  return { ok: true };
}

export async function deleteTaskColumn(columnId: string, boardId: string): Promise<ActionResult> {
  const auth = await requireAdmin();
  if (auth.error || !auth.supabase) return { error: auth.error ?? "Unauthorized" };

  const { error } = await auth.supabase.from("task_board_columns").delete().eq("id", columnId);
  if (error) return { error: error.message };

  revalidateBoard(boardId);
  return { ok: true };
}

export async function createTaskCard(boardId: string, columnId: string, title: string): Promise<ActionResult> {
  const auth = await requireAdmin();
  if (auth.error || !auth.supabase || !auth.user) return { error: auth.error ?? "Unauthorized" };

  const t = title.trim();
  if (!t) return { error: "Task title is required." };

  const { data: maxRow } = await auth.supabase
    .from("task_cards")
    .select("sort_order")
    .eq("column_id", columnId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextOrder = maxRow ? (maxRow.sort_order as number) + 1 : 0;

  const { error } = await auth.supabase.from("task_cards").insert({
    board_id: boardId,
    column_id: columnId,
    title: t,
    sort_order: nextOrder,
    created_by: auth.user.id,
  });

  if (error) return { error: error.message };
  revalidateBoard(boardId);
  return { ok: true };
}

export async function setTaskCardCompleted(
  cardId: string,
  boardId: string,
  completed: boolean
): Promise<ActionResult> {
  const auth = await requireAdmin();
  if (auth.error || !auth.supabase) return { error: auth.error ?? "Unauthorized" };

  const { error } = await auth.supabase
    .from("task_cards")
    .update({ completed })
    .eq("id", cardId);

  if (error) return { error: error.message };
  revalidateBoard(boardId);
  return { ok: true };
}

export async function updateTaskCard(input: {
  cardId: string;
  boardId: string;
  title: string;
  description: string;
  dueDate: string | null;
  completed: boolean;
  assigneeIds: string[];
}): Promise<ActionResult> {
  const auth = await requireAdmin();
  if (auth.error || !auth.supabase) return { error: auth.error ?? "Unauthorized" };

  const title = input.title.trim();
  if (!title) return { error: "Task title is required." };

  const due_date =
    input.dueDate && input.dueDate.trim() !== "" ? input.dueDate.trim() : null;

  const { data: previousAssignees } = await auth.supabase
    .from("task_card_assignees")
    .select("user_id")
    .eq("card_id", input.cardId);
  const previousAssigneeIds = new Set(
    (previousAssignees ?? []).map((r) => r.user_id as string)
  );

  const { error } = await auth.supabase
    .from("task_cards")
    .update({
      title,
      description: input.description.trim() || null,
      due_date,
      completed: input.completed,
    })
    .eq("id", input.cardId);

  if (error) return { error: error.message };

  const { error: delErr } = await auth.supabase
    .from("task_card_assignees")
    .delete()
    .eq("card_id", input.cardId);
  if (delErr) return { error: delErr.message };

  const uniqueAssignees = [...new Set(input.assigneeIds.filter(Boolean))];
  if (uniqueAssignees.length > 0) {
    const { error: insErr } = await auth.supabase.from("task_card_assignees").insert(
      uniqueAssignees.map((user_id) => ({
        card_id: input.cardId,
        user_id,
      }))
    );
    if (insErr) return { error: insErr.message };
  }

  try {
    await notifyNewTaskAssignees({
      supabase: auth.supabase,
      cardId: input.cardId,
      boardId: input.boardId,
      taskTitle: title,
      taskDescription: input.description.trim() || null,
      dueDate: due_date,
      previousAssigneeIds,
      nextAssigneeIds: uniqueAssignees,
      assignedByUserId: auth.user!.id,
    });
  } catch (e) {
    console.warn("[task-assigned] Notification error:", e);
  }

  revalidateBoard(input.boardId);
  return { ok: true };
}

export async function deleteTaskCard(cardId: string, boardId: string): Promise<ActionResult> {
  const auth = await requireAdmin();
  if (auth.error || !auth.supabase) return { error: auth.error ?? "Unauthorized" };

  const { error } = await auth.supabase.from("task_cards").delete().eq("id", cardId);
  if (error) return { error: error.message };

  revalidateBoard(boardId);
  return { ok: true };
}

export async function moveTaskCard(
  cardId: string,
  boardId: string,
  columnId: string,
  sortOrder: number
): Promise<ActionResult> {
  const auth = await requireAdmin();
  if (auth.error || !auth.supabase) return { error: auth.error ?? "Unauthorized" };

  const { error } = await auth.supabase
    .from("task_cards")
    .update({ column_id: columnId, sort_order: sortOrder })
    .eq("id", cardId);

  if (error) return { error: error.message };
  revalidateBoard(boardId);
  return { ok: true };
}
