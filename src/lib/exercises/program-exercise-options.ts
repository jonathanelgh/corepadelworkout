import type { SupabaseClient } from "@supabase/supabase-js";
import type { ExerciseOption } from "@/app/admin/programs/new/exercise-search-combobox";
import { parseExerciseProgramPrescriptionMode } from "@/lib/exercises/program-prescription-mode";
import { sortedJunctionIds } from "@/app/admin/exercises/exercise-row-utils";

export async function loadProgramExerciseOptions(
  supabase: SupabaseClient
): Promise<{ exercises: ExerciseOption[]; error: string | null }> {
  const [exercisesRes, levelsRes] = await Promise.all([
    supabase
      .from("exercises")
      .select(
        `
      id,
      title,
      status,
      image_url,
      video_url,
      program_prescription_mode,
      both_sides,
      exercise_level_id,
      location_id,
      exercise_locations ( location_id, sort_order )
    `
      )
      .order("title", { ascending: true }),
    supabase.from("exercise_levels").select("id, name"),
  ]);

  if (exercisesRes.error) return { exercises: [], error: exercisesRes.error.message };

  const levelNameById = new Map(
    (levelsRes.data ?? []).map((r) => [r.id as string, r.name as string])
  );

  const exercises: ExerciseOption[] = (exercisesRes.data ?? []).map((row) => {
    const junction = row.exercise_locations as
      | { location_id: string; sort_order: number }[]
      | null
      | undefined;
    const location_ids = sortedJunctionIds(junction, (r) => r.location_id);
    const levelId = (row.exercise_level_id as string | null) ?? null;
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
      programPrescriptionMode: parseExerciseProgramPrescriptionMode(row.program_prescription_mode),
      bothSides: Boolean(row.both_sides),
      image_url: (row.image_url as string | null) ?? null,
      video_url: (row.video_url as string | null) ?? null,
      levelName: levelId ? levelNameById.get(levelId) ?? null : null,
    };
  });

  return { exercises, error: null };
}
