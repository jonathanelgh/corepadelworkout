import { Plus, Search, MoreHorizontal, Pencil } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";

type ExerciseRow = {
  id: string;
  title: string;
  description: string | null;
  video_url: string | null;
  image_url: string | null;
  created_at: string;
  location: { name: string; slug: string } | null;
};

function pickLocation(
  loc: { name: string; slug: string } | { name: string; slug: string }[] | null
): { name: string; slug: string } | null {
  if (!loc) return null;
  return Array.isArray(loc) ? loc[0] ?? null : loc;
}

export default async function AdminExercisesPage() {
  const supabase = await createClient();
  const { data: exercises, error } = await supabase
    .from("exercises")
    .select(
      `
      id,
      title,
      description,
      video_url,
      image_url,
      created_at,
      locations ( name, slug )
    `
    )
    .order("created_at", { ascending: false });

  const rows: ExerciseRow[] = (exercises ?? []).map((row) => ({
    id: row.id as string,
    title: row.title as string,
    description: (row.description as string | null) ?? null,
    video_url: (row.video_url as string | null) ?? null,
    image_url: (row.image_url as string | null) ?? null,
    created_at: row.created_at as string,
    location: pickLocation(row.locations as { name: string; slug: string } | { name: string; slug: string }[] | null),
  }));

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-8">
        <h1 className="text-lg font-semibold text-gray-900">Exercises</h1>
        <Link
          href="/admin/exercises/new"
          className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create exercise
        </Link>
      </div>

      <div className="min-h-0 flex-1 overflow-auto p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              Could not load exercises: {error.message}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white p-4 rounded-xl border border-gray-200">
            <div className="relative w-full sm:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search exercises..."
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                disabled
                title="Search coming soon"
              />
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50 text-gray-500 text-sm border-b border-gray-200">
                    <th className="px-6 py-4 font-medium">Exercise</th>
                    <th className="px-6 py-4 font-medium">Location</th>
                    <th className="px-6 py-4 font-medium">Media</th>
                    <th className="px-6 py-4 font-medium">Created</th>
                    <th className="px-6 py-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-16 text-center text-gray-500">
                        <p className="font-medium text-gray-900 mb-1">No exercises yet</p>
                        <p className="text-sm mb-4">Create your first exercise to use it across programs.</p>
                        <Link
                          href="/admin/exercises/new"
                          className="inline-flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                          Create exercise
                        </Link>
                      </td>
                    </tr>
                  ) : (
                    rows.map((ex) => {
                      const loc = ex.location;
                      const hasVideo = Boolean(ex.video_url?.trim());
                      const hasImage = Boolean(ex.image_url?.trim());
                      const created = new Date(ex.created_at).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      });
                      return (
                        <tr key={ex.id} className="hover:bg-gray-50/50 transition-colors group">
                          <td className="px-6 py-4">
                            <div className="font-medium text-gray-900">{ex.title}</div>
                            {ex.description && (
                              <div className="text-gray-500 line-clamp-2 mt-0.5 max-w-md">{ex.description}</div>
                            )}
                          </td>
                          <td className="px-6 py-4 text-gray-600">
                            {loc ? (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-gray-100 text-gray-700 text-xs font-medium">
                                {loc.name}
                              </span>
                            ) : (
                              "—"
                            )}
                          </td>
                          <td className="px-6 py-4 text-gray-600">
                            <div className="flex gap-2">
                              {hasVideo && (
                                <span className="text-xs font-medium text-gray-700 border border-gray-200 rounded-md px-2 py-0.5">
                                  Video
                                </span>
                              )}
                              {hasImage && (
                                <span className="text-xs font-medium text-gray-700 border border-gray-200 rounded-md px-2 py-0.5">
                                  Image
                                </span>
                              )}
                              {!hasVideo && !hasImage && (
                                <span className="text-gray-400">—</span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-gray-500">{created}</td>
                          <td className="px-6 py-4 text-right">
                            <button
                              type="button"
                              className="inline-flex p-1.5 text-gray-400 hover:text-black hover:bg-gray-100 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                              title="Edit (coming soon)"
                              disabled
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              className="inline-flex p-1.5 text-gray-400 hover:text-black md:hidden"
                              disabled
                            >
                              <MoreHorizontal className="w-5 h-5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            {rows.length > 0 && (
              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50/50 text-sm text-gray-500">
                {rows.length} exercise{rows.length === 1 ? "" : "s"}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
