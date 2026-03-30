import { Plus, Package, Tag } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import type { ExerciseListItem } from "./edit-exercise-modal";
import { ExercisesListClient } from "./exercises-list-client";

export const dynamic = "force-dynamic";

function pickLocation(
  loc: { name: string; slug: string } | { name: string; slug: string }[] | null
): { name: string; slug: string } | null {
  if (!loc) return null;
  return Array.isArray(loc) ? loc[0] ?? null : loc;
}

export default async function AdminExercisesPage() {
  const supabase = await createClient();
  const [exercisesRes, locationsRes] = await Promise.all([
    supabase
      .from("exercises")
      .select(
        `
      id,
      title,
      description,
      how_to,
      video_url,
      image_url,
      created_at,
      location_id,
      locations ( name, slug )
    `
      )
      .order("created_at", { ascending: false }),
    supabase.from("locations").select("id, name, slug").order("sort_order", { ascending: true }),
  ]);

  const { data: exercises, error } = exercisesRes;
  const locations = locationsRes.data ?? [];

  const rows: ExerciseListItem[] = (exercises ?? []).map((row) => {
    const loc = pickLocation(row.locations as { name: string; slug: string } | { name: string; slug: string }[] | null);
    return {
      id: row.id as string,
      title: row.title as string,
      description: (row.description as string | null) ?? null,
      how_to: (row.how_to as string | null) ?? null,
      video_url: (row.video_url as string | null) ?? null,
      image_url: (row.image_url as string | null) ?? null,
      location_id: row.location_id as string,
      created_at: row.created_at as string,
      locationName: loc?.name ?? null,
    };
  });

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="flex h-14 shrink-0 items-center justify-between gap-4 border-b border-gray-200 bg-white px-8">
        <h1 className="text-lg font-semibold text-gray-900">Exercises</h1>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Link
            href="/admin/exercises/equipment"
            className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <Package className="h-4 w-4" />
            Equipment
          </Link>
          <Link
            href="/admin/exercises/tags"
            className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <Tag className="h-4 w-4" />
            Tags
          </Link>
          <Link
            href="/admin/exercises/new"
            className="flex items-center gap-2 rounded-lg bg-black px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800"
          >
            <Plus className="h-4 w-4" />
            Create exercise
          </Link>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto p-8">
        <div className="mx-auto max-w-7xl space-y-6">
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              Could not load exercises: {error.message}
            </div>
          )}

          <ExercisesListClient rows={rows} locations={locations} />
        </div>
      </div>
    </div>
  );
}
