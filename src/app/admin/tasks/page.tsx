import { createClient } from "@/utils/supabase/server";
import { getIsAdmin } from "@/utils/supabase/is-admin";
import { redirect } from "next/navigation";
import { listTaskBoards } from "./actions";
import { BoardsListClient } from "./boards-list-client";

export const dynamic = "force-dynamic";

export default async function AdminTasksPage() {
  const supabase = await createClient();
  if (!(await getIsAdmin(supabase))) {
    redirect("/login?next=/admin/tasks");
  }

  const boards = await listTaskBoards();
  const loadError = "error" in boards ? boards.error : null;
  const rows = "error" in boards ? [] : boards;

  return <BoardsListClient boards={rows} loadError={loadError} />;
}
