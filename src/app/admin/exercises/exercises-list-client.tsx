"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Pencil, Plus, Search } from "lucide-react";
import { EditExerciseModal, type ExerciseListItem } from "./edit-exercise-modal";

type LocationOption = { id: string; name: string; slug: string };

function matchesExerciseQuery(ex: ExerciseListItem, q: string): boolean {
  if (!q) return true;
  const n = q.toLowerCase();
  if (ex.title.toLowerCase().includes(n)) return true;
  if (ex.description?.toLowerCase().includes(n)) return true;
  if (ex.how_to?.toLowerCase().includes(n)) return true;
  if (ex.locationName?.toLowerCase().includes(n)) return true;
  return false;
}

export function ExercisesListClient({
  rows,
  locations,
}: {
  rows: ExerciseListItem[];
  locations: LocationOption[];
}) {
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<ExerciseListItem | null>(null);

  const filtered = useMemo(
    () => rows.filter((ex) => matchesExerciseQuery(ex, query.trim())),
    [rows, query]
  );

  return (
    <>
      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by title, description, location…"
            className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pr-4 pl-10 text-sm transition-all focus:border-transparent focus:ring-2 focus:ring-black focus:outline-none"
            aria-label="Search exercises"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/50 text-gray-500">
                <th className="px-6 py-4 font-medium">Exercise</th>
                <th className="px-6 py-4 font-medium">Location</th>
                <th className="px-6 py-4 font-medium">Media</th>
                <th className="px-6 py-4 font-medium">Created</th>
                <th className="px-6 py-4 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center text-gray-500">
                    {rows.length === 0 ? (
                      <>
                        <p className="mb-1 font-medium text-gray-900">No exercises yet</p>
                        <p className="mb-4 text-sm">Create your first exercise to use it across programs.</p>
                        <Link
                          href="/admin/exercises/new"
                          className="inline-flex items-center gap-2 rounded-lg bg-black px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800"
                        >
                          <Plus className="h-4 w-4" />
                          Create exercise
                        </Link>
                      </>
                    ) : (
                      <>No matches for your search.</>
                    )}
                  </td>
                </tr>
              ) : (
                filtered.map((ex) => {
                  const loc = ex.locationName;
                  const hasVideo = Boolean(ex.video_url?.trim());
                  const hasImage = Boolean(ex.image_url?.trim());
                  const created = new Date(ex.created_at).toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  });
                  return (
                    <tr key={ex.id} className="transition-colors hover:bg-gray-50/50">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{ex.title}</div>
                        {ex.description && (
                          <div className="mt-0.5 line-clamp-2 max-w-md text-gray-500">{ex.description}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {loc ? (
                          <span className="inline-flex items-center rounded-md bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
                            {loc}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        <div className="flex gap-2">
                          {hasVideo && (
                            <span className="rounded-md border border-gray-200 px-2 py-0.5 text-xs font-medium text-gray-700">
                              Video
                            </span>
                          )}
                          {hasImage && (
                            <span className="rounded-md border border-gray-200 px-2 py-0.5 text-xs font-medium text-gray-700">
                              Image
                            </span>
                          )}
                          {!hasVideo && !hasImage && <span className="text-gray-400">—</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-500">{created}</td>
                      <td className="px-6 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => setEditing(ex)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-800 hover:bg-gray-50"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Edit
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {filtered.length > 0 && (
          <div className="border-t border-gray-200 bg-gray-50/50 px-6 py-4 text-sm text-gray-500">
            Showing {filtered.length} of {rows.length} exercise{rows.length === 1 ? "" : "s"}
          </div>
        )}
      </div>

      <EditExerciseModal item={editing} locations={locations} onClose={() => setEditing(null)} />
    </>
  );
}
