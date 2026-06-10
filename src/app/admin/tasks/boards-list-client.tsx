"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { KanbanSquare, Plus, Trash2 } from "lucide-react";
import { deleteTaskBoard } from "./actions";
import { CreateBoardModal } from "./create-board-modal";
import type { TaskBoardListItem } from "./types";

export function BoardsListClient({
  boards,
  loadError,
}: {
  boards: TaskBoardListItem[];
  loadError?: string | null;
}) {
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete(boardId: string, boardTitle: string) {
    if (!confirm(`Delete board "${boardTitle}" and all its tasks?`)) return;
    const res = await deleteTaskBoard(boardId);
    if ("error" in res) {
      setError(res.error);
      return;
    }
    router.refresh();
  }

  function handleCreated(boardId: string) {
    router.push(`/admin/tasks/${boardId}`);
    router.refresh();
  }

  return (
    <>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="flex h-14 shrink-0 items-center justify-between gap-4 border-b border-gray-200 bg-white px-6 lg:px-8">
          <h1 className="text-lg font-semibold text-gray-900">Task boards</h1>
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-black px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800"
          >
            <Plus className="h-4 w-4" />
            New board
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-auto p-6 lg:p-8">
          <div className="mx-auto max-w-5xl space-y-6">
            <p className="text-sm text-gray-500">
              Kanban boards for your team — create columns, tasks, assign members, and drag cards between lists.
            </p>

            {(loadError || error) && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                {loadError ?? error}
              </div>
            )}

            {boards.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center">
                <KanbanSquare className="mx-auto h-10 w-10 text-gray-300" />
                <p className="mt-4 font-medium text-gray-900">No boards yet</p>
                <p className="mt-1 text-sm text-gray-500">Create a board to start tracking tasks with your team.</p>
                <button
                  type="button"
                  onClick={() => setCreateOpen(true)}
                  className="mt-6 inline-flex items-center gap-2 rounded-lg bg-black px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800"
                >
                  <Plus className="h-4 w-4" />
                  New board
                </button>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {boards.map((board) => {
                  const updated = new Date(board.updatedAt).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  });
                  return (
                    <div
                      key={board.id}
                      className="group relative rounded-xl border border-gray-200 bg-white p-5 transition-shadow hover:shadow-md"
                    >
                      <Link href={`/admin/tasks/${board.id}`} className="block">
                        <div className="flex items-start gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100">
                            <KanbanSquare className="h-5 w-5 text-gray-700" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="truncate font-semibold text-gray-900">{board.title}</h3>
                            {board.description && (
                              <p className="mt-1 line-clamp-2 text-sm text-gray-500">{board.description}</p>
                            )}
                            <p className="mt-3 text-xs text-gray-400">
                              {board.cardCount} task{board.cardCount === 1 ? "" : "s"} · Updated {updated}
                            </p>
                          </div>
                        </div>
                      </Link>
                      <button
                        type="button"
                        onClick={() => void handleDelete(board.id, board.title)}
                        className="absolute right-3 top-3 rounded-lg p-2 text-gray-400 opacity-0 transition-opacity hover:bg-red-50 hover:text-red-600 group-hover:opacity-100"
                        title="Delete board"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      <CreateBoardModal open={createOpen} onClose={() => setCreateOpen(false)} onCreated={handleCreated} />
    </>
  );
}
