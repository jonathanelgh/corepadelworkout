import Link from "next/link";
import { Tag, Trash2 } from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import { deleteExerciseTag, updateExerciseTag } from "./actions";
import { AddExerciseTagModal } from "./add-tag-modal";

export const dynamic = "force-dynamic";

type Search = Promise<{ error?: string; saved?: string }>;

export default async function AdminExerciseTagsPage({ searchParams }: { searchParams?: Search }) {
  const sp = (await searchParams) ?? {};
  const supabase = await createClient();
  const { data: rows, error } = await supabase
    .from("exercise_tabs")
    .select("id, title, created_at")
    .order("title", { ascending: true });

  const list = rows ?? [];

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="flex min-h-14 shrink-0 items-center justify-between gap-4 border-b border-gray-200 bg-white px-8 py-3">
        <div className="flex min-w-0 items-start gap-3">
          <Tag className="mt-0.5 h-5 w-5 shrink-0 text-gray-600" />
          <div className="min-w-0">
            <h1 className="text-lg font-semibold text-gray-900">Exercise tags</h1>
            <p className="text-xs text-gray-500">
              Labels you attach to exercises (stored as <code className="text-gray-700">exercise_tabs</code>).
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <AddExerciseTagModal />
          <Link
            href="/admin/exercises"
            className="text-sm text-gray-600 underline-offset-4 hover:text-black hover:underline"
          >
            Back to exercises
          </Link>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto p-8">
        <div className="mx-auto max-w-3xl space-y-6">
          {sp.error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{sp.error}</div>
          )}
          {sp.saved && !sp.error && (
            <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">Saved.</div>
          )}
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              Could not load tags: {error.message}
            </div>
          )}

          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50/50 text-gray-500">
                    <th className="px-6 py-4 font-medium">Title</th>
                    <th className="px-6 py-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {list.length === 0 ? (
                    <tr>
                      <td colSpan={2} className="px-6 py-12 text-center text-gray-500">
                        No tags yet. Use <strong className="font-medium text-gray-800">Create tag</strong> in the bar
                        above.
                      </td>
                    </tr>
                  ) : (
                    list.map((row) => (
                      <tr key={row.id} className="hover:bg-gray-50/50">
                        <td className="px-6 py-4 align-middle">
                          <form
                            action={updateExerciseTag}
                            id={`tag-${row.id}`}
                            className="flex max-w-xl items-center gap-3"
                          >
                            <input type="hidden" name="id" value={row.id} />
                            <input
                              name="title"
                              required
                              defaultValue={row.title}
                              className="min-w-0 flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-black focus:outline-none"
                            />
                          </form>
                        </td>
                        <td className="px-6 py-4 text-right align-middle">
                          <div className="inline-flex items-center gap-2">
                            <button
                              type="submit"
                              form={`tag-${row.id}`}
                              className="rounded-lg bg-black px-3 py-2 text-xs font-medium text-white hover:bg-gray-800"
                            >
                              Save
                            </button>
                            <form action={deleteExerciseTag} className="inline">
                              <input type="hidden" name="id" value={row.id} />
                              <button
                                type="submit"
                                className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-3 py-2 text-xs font-medium text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                Delete
                              </button>
                            </form>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {list.length > 0 && (
              <div className="border-t border-gray-200 bg-gray-50/50 px-6 py-3 text-sm text-gray-500">
                {list.length} tag{list.length === 1 ? "" : "s"}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
