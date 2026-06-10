import { notFound, redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { getIsAdmin } from "@/utils/supabase/is-admin";
import { getTaskBoard, listAssigneeOptions } from "../actions";
import { BoardClient } from "./board-client";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ boardId: string }> };

export default async function TaskBoardPage({ params }: PageProps) {
  const { boardId } = await params;
  const supabase = await createClient();
  if (!(await getIsAdmin(supabase))) {
    redirect(`/login?next=/admin/tasks/${boardId}`);
  }

  const [board, assignees] = await Promise.all([getTaskBoard(boardId), listAssigneeOptions()]);

  if ("error" in board) {
    if (board.error === "Board not found.") notFound();
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <p className="text-sm text-red-600">{board.error}</p>
      </div>
    );
  }

  const assigneeOptions = "error" in assignees ? [] : assignees;

  return <BoardClient board={board} assigneeOptions={assigneeOptions} />;
}
