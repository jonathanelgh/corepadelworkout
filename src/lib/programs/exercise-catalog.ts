import type { SupabaseClient } from "@supabase/supabase-js";
import { bucketJunctionByExerciseId, exerciseRowToListItem } from "@/app/admin/exercises/exercise-row-utils";

export type ExerciseCatalogEntry = {
  id: string;
  title: string;
  status: "draft" | "published";
  description: string | null;
  locationId: string;
  locationSlug: string | null;
  locationName: string | null;
  levelName: string | null;
  categoryTypes: string[];
  movementPatterns: string[];
  bodyRegions: string[];
  bodyParts: string[];
  equipment: string[];
};

export type ProgramAiContext = {
  exercises: ExerciseCatalogEntry[];
  locations: { id: string; name: string; slug: string }[];
  categories: { id: string; name: string; slug: string }[];
  difficulties: { id: string; name: string; slug: string }[];
};

export async function loadProgramAiContext(supabase: SupabaseClient): Promise<ProgramAiContext> {
  const [
    exercisesRes,
    locationsRes,
    categoriesRes,
    difficultiesRes,
    categoryTypesRes,
    movementPatternsRes,
    bodyRegionsRes,
    bodyPartsRes,
    exerciseLevelsRes,
    equipmentRes,
  ] = await Promise.all([
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
        exercise_level_id,
        status,
        locations ( name, slug ),
        exercise_equipment ( equipment_id, sort_order )
      `
      )
      .order("title", { ascending: true }),
    supabase.from("locations").select("id, name, slug").order("sort_order", { ascending: true }),
    supabase.from("categories").select("id, name, slug").order("sort_order", { ascending: true }),
    supabase.from("difficulty_levels").select("id, name, slug").order("sort_order", { ascending: true }),
    supabase.from("exercise_category_types").select("id, name"),
    supabase.from("movement_patterns").select("id, name"),
    supabase.from("body_regions").select("id, name"),
    supabase.from("body_parts").select("id, name"),
    supabase.from("exercise_levels").select("id, name"),
    supabase.from("equipment").select("id, title"),
  ]);

  const exercises = exercisesRes.data ?? [];
  const exerciseIds = exercises.map((e) => e.id as string);

  let ctByExercise = new Map<string, { exercise_category_type_id: string; sort_order: number }[]>();
  let mpByExercise = new Map<string, { movement_pattern_id: string; sort_order: number }[]>();
  let brByExercise = new Map<string, { body_region_id: string; sort_order: number }[]>();
  let bpByExercise = new Map<string, { body_part_id: string; sort_order: number }[]>();

  if (exerciseIds.length > 0) {
    const [catRes, mpRes, brRes, bpRes] = await Promise.all([
      supabase
        .from("exercise_category_type_links")
        .select("exercise_id, exercise_category_type_id, sort_order")
        .in("exercise_id", exerciseIds),
      supabase
        .from("exercise_movement_pattern_links")
        .select("exercise_id, movement_pattern_id, sort_order")
        .in("exercise_id", exerciseIds),
      supabase
        .from("exercise_body_region_links")
        .select("exercise_id, body_region_id, sort_order")
        .in("exercise_id", exerciseIds),
      supabase
        .from("exercise_body_part_links")
        .select("exercise_id, body_part_id, sort_order")
        .in("exercise_id", exerciseIds),
    ]);
    if (catRes.data) ctByExercise = bucketJunctionByExerciseId(catRes.data);
    if (mpRes.data) mpByExercise = bucketJunctionByExerciseId(mpRes.data);
    if (brRes.data) brByExercise = bucketJunctionByExerciseId(brRes.data);
    if (bpRes.data) bpByExercise = bucketJunctionByExerciseId(bpRes.data);
  }

  const categoryTypeName = new Map(
    (categoryTypesRes.data ?? []).map((r) => [r.id as string, r.name as string])
  );
  const movementName = new Map((movementPatternsRes.data ?? []).map((r) => [r.id as string, r.name as string]));
  const bodyRegionName = new Map((bodyRegionsRes.data ?? []).map((r) => [r.id as string, r.name as string]));
  const bodyPartName = new Map((bodyPartsRes.data ?? []).map((r) => [r.id as string, r.name as string]));
  const levelName = new Map((exerciseLevelsRes.data ?? []).map((r) => [r.id as string, r.name as string]));
  const equipmentName = new Map((equipmentRes.data ?? []).map((r) => [r.id as string, r.title as string]));

  const catalog: ExerciseCatalogEntry[] = exercises.map((row) => {
    const item = exerciseRowToListItem(
      {
        id: row.id as string,
        title: row.title as string,
        description: (row.description as string | null) ?? null,
        how_to: (row.how_to as string | null) ?? null,
        video_url: (row.video_url as string | null) ?? null,
        image_url: (row.image_url as string | null) ?? null,
        created_at: row.created_at as string,
        location_id: row.location_id as string,
        exercise_level_id: (row.exercise_level_id as string | null) ?? null,
        locations: row.locations as
          | { name: string; slug: string }
          | { name: string; slug: string }[]
          | null,
        exercise_equipment: row.exercise_equipment as
          | { equipment_id: string; sort_order: number }[]
          | null
          | undefined,
      },
      ctByExercise,
      mpByExercise,
      brByExercise,
      bpByExercise
    );

    const loc = Array.isArray(row.locations) ? row.locations[0] : row.locations;

    return {
      id: item.id,
      title: item.title,
      status: row.status === "draft" ? "draft" : "published",
      description: item.description,
      locationId: item.location_id,
      locationSlug: loc?.slug ?? null,
      locationName: loc?.name ?? null,
      levelName: item.exerciseLevelId ? levelName.get(item.exerciseLevelId) ?? null : null,
      categoryTypes: item.categoryTypeIds.map((id) => categoryTypeName.get(id)).filter(Boolean) as string[],
      movementPatterns: item.movementPatternIds.map((id) => movementName.get(id)).filter(Boolean) as string[],
      bodyRegions: item.bodyRegionIds.map((id) => bodyRegionName.get(id)).filter(Boolean) as string[],
      bodyParts: item.bodyPartIds.map((id) => bodyPartName.get(id)).filter(Boolean) as string[],
      equipment: item.equipmentIds.map((id) => equipmentName.get(id)).filter(Boolean) as string[],
    };
  });

  return {
    exercises: catalog,
    locations: (locationsRes.data ?? []).map((r) => ({
      id: r.id as string,
      name: r.name as string,
      slug: r.slug as string,
    })),
    categories: (categoriesRes.data ?? []).map((r) => ({
      id: r.id as string,
      name: r.name as string,
      slug: r.slug as string,
    })),
    difficulties: (difficultiesRes.data ?? []).map((r) => ({
      id: r.id as string,
      name: r.name as string,
      slug: r.slug as string,
    })),
  };
}

function truncate(s: string, max: number): string {
  const t = s.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

/** Compact catalog for Gemini — one exercise per line. */
export function formatExerciseCatalogForPrompt(entries: ExerciseCatalogEntry[]): string {
  if (entries.length === 0) return "(no exercises in library)";
  return entries
    .map((e) => {
      const tags = [
        e.levelName ? `level:${e.levelName}` : null,
        e.categoryTypes.length ? `types:${e.categoryTypes.join("/")}` : null,
        e.movementPatterns.length ? `move:${e.movementPatterns.join("/")}` : null,
        e.bodyRegions.length ? `regions:${e.bodyRegions.join("/")}` : null,
        e.equipment.length ? `gear:${e.equipment.join("/")}` : null,
      ]
        .filter(Boolean)
        .join("; ");
      const desc = e.description ? ` — ${truncate(e.description, 100)}` : "";
      return `[${e.id}] ${e.title} @${e.locationSlug ?? e.locationName ?? "unknown"}${tags ? ` (${tags})` : ""}${desc}`;
    })
    .join("\n");
}

export function formatProgramMetaForPrompt(ctx: ProgramAiContext): string {
  const line = (label: string, items: { name: string; slug: string }[]) =>
    `${label}: ${items.map((i) => `${i.name} (${i.slug})`).join(", ") || "(none)"}`;
  return [line("Locations", ctx.locations), line("Categories", ctx.categories), line("Difficulty levels", ctx.difficulties)].join(
    "\n"
  );
}
