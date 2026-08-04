import type { SupabaseClient } from "@supabase/supabase-js";
import { bucketJunctionByExerciseId } from "@/app/admin/exercises/exercise-row-utils";

/** PostgREST silently caps responses (~1000 rows). Junction tables exceed that. */
const JUNCTION_PAGE_SIZE = 1000;
/** Keep `.in(exercise_id, …)` filters small enough for URL / payload limits. */
const EXERCISE_ID_CHUNK = 120;

/**
 * Load all junction rows for the given exercises, paging past PostgREST max-rows.
 */
export async function fetchAllExerciseJunctionRows<T extends { exercise_id: string; sort_order: number }>(
  supabase: SupabaseClient,
  table:
    | "exercise_category_type_links"
    | "exercise_movement_pattern_links"
    | "exercise_body_region_links"
    | "exercise_body_part_links",
  select: string,
  exerciseIds: string[]
): Promise<T[]> {
  if (exerciseIds.length === 0) return [];

  const all: T[] = [];

  for (let i = 0; i < exerciseIds.length; i += EXERCISE_ID_CHUNK) {
    const chunk = exerciseIds.slice(i, i + EXERCISE_ID_CHUNK);
    let from = 0;

    for (;;) {
      const { data, error } = await supabase
        .from(table)
        .select(select)
        .in("exercise_id", chunk)
        .order("exercise_id", { ascending: true })
        .order("sort_order", { ascending: true })
        .range(from, from + JUNCTION_PAGE_SIZE - 1);

      if (error) {
        throw new Error(`${table}: ${error.message}`);
      }

      const rows = (data ?? []) as unknown as T[];
      all.push(...rows);
      if (rows.length < JUNCTION_PAGE_SIZE) break;
      from += JUNCTION_PAGE_SIZE;
    }
  }

  return all;
}

export async function loadExerciseTaxonomyJunctions(
  supabase: SupabaseClient,
  exerciseIds: string[]
): Promise<{
  ctByExercise: Map<string, { exercise_category_type_id: string; sort_order: number }[]>;
  mpByExercise: Map<string, { movement_pattern_id: string; sort_order: number }[]>;
  brByExercise: Map<string, { body_region_id: string; sort_order: number }[]>;
  bpByExercise: Map<string, { body_part_id: string; sort_order: number }[]>;
}> {
  if (exerciseIds.length === 0) {
    return {
      ctByExercise: new Map(),
      mpByExercise: new Map(),
      brByExercise: new Map(),
      bpByExercise: new Map(),
    };
  }

  const [catRows, mpRows, brRows, bpRows] = await Promise.all([
    fetchAllExerciseJunctionRows<{
      exercise_id: string;
      exercise_category_type_id: string;
      sort_order: number;
    }>(
      supabase,
      "exercise_category_type_links",
      "exercise_id, exercise_category_type_id, sort_order",
      exerciseIds
    ),
    fetchAllExerciseJunctionRows<{
      exercise_id: string;
      movement_pattern_id: string;
      sort_order: number;
    }>(
      supabase,
      "exercise_movement_pattern_links",
      "exercise_id, movement_pattern_id, sort_order",
      exerciseIds
    ),
    fetchAllExerciseJunctionRows<{
      exercise_id: string;
      body_region_id: string;
      sort_order: number;
    }>(supabase, "exercise_body_region_links", "exercise_id, body_region_id, sort_order", exerciseIds),
    fetchAllExerciseJunctionRows<{
      exercise_id: string;
      body_part_id: string;
      sort_order: number;
    }>(supabase, "exercise_body_part_links", "exercise_id, body_part_id, sort_order", exerciseIds),
  ]);

  return {
    ctByExercise: bucketJunctionByExerciseId(catRows),
    mpByExercise: bucketJunctionByExerciseId(mpRows),
    brByExercise: bucketJunctionByExerciseId(brRows),
    bpByExercise: bucketJunctionByExerciseId(bpRows),
  };
}
