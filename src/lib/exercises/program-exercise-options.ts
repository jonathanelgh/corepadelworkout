import type { SupabaseClient } from "@supabase/supabase-js";
import type { ExerciseOption } from "@/app/admin/programs/new/exercise-search-combobox";
import { sortedJunctionIds } from "@/app/admin/exercises/exercise-row-utils";

export async function loadProgramExerciseOptions(
  supabase: SupabaseClient
): Promise<{ exercises: ExerciseOption[]; error: string | null }> {
  const { data, error } = await supabase
    .from("exercises")
    .select(
      `
      id,
      title,
      status,
      location_id,
      exercise_locations ( location_id, sort_order )
    `
    )
    .order("title", { ascending: true });

  if (error) return { exercises: [], error: error.message };

  const exercises: ExerciseOption[] = (data ?? []).map((row) => {
    const junction = row.exercise_locations as
      | { location_id: string; sort_order: number }[]
      | null
      | undefined;
    const location_ids = sortedJunctionIds(junction, (r) => r.location_id);
    return {
      id: row.id as string,
      title: row.title as string,
      location_ids:
        location_ids.length > 0
          ? location_ids
          : row.location_id
            ? [row.location_id as string]
            : [],
      status: row.status === "draft" ? "draft" : "published",
    };
  });

  return { exercises, error: null };
}
