import { Plus, Package, Layers } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { bucketJunctionByExerciseId, exerciseRowToListItem, EXERCISE_LOCATIONS_SELECT } from "./exercise-row-utils";
import { ExercisesListClient } from "./exercises-list-client";
import type { ExerciseListItem } from "./types";

export const dynamic = "force-dynamic";

type PageSearch = Promise<{ error?: string; deleted?: string }>;

export default async function AdminExercisesPage({
  searchParams,
}: {
  searchParams: PageSearch;
}) {
  const sp = await searchParams;
  const supabase = await createClient();
  const exercisesRes = await supabase
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
      ${EXERCISE_LOCATIONS_SELECT},
      exercise_equipment ( equipment_id, sort_order )
    `
    )
    .order("created_at", { ascending: false });

  const { data: exercises, error } = exercisesRes;

  const exerciseIds = (exercises ?? []).map((e) => e.id as string);
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
    if (!catRes.error && catRes.data) {
      ctByExercise = bucketJunctionByExerciseId(catRes.data);
    }
    if (!mpRes.error && mpRes.data) {
      mpByExercise = bucketJunctionByExerciseId(mpRes.data);
    }
    if (!brRes.error && brRes.data) {
      brByExercise = bucketJunctionByExerciseId(brRes.data);
    }
    if (!bpRes.error && bpRes.data) {
      bpByExercise = bucketJunctionByExerciseId(bpRes.data);
    }
  }
  const [
    equipLibRes,
    locationsRes,
    levelsRes,
    categoryTypesRes,
    movementPatternsRes,
    bodyRegionsRes,
    bodyPartsRes,
  ] = await Promise.all([
    supabase.from("equipment").select("id, title").order("title", { ascending: true }),
    supabase.from("locations").select("id, name").order("sort_order", { ascending: true }),
    supabase.from("exercise_levels").select("id, name").order("sort_order", { ascending: true }),
    supabase.from("exercise_category_types").select("id, name").order("name", { ascending: true }),
    supabase.from("movement_patterns").select("id, name").order("name", { ascending: true }),
    supabase.from("body_regions").select("id, name").order("name", { ascending: true }),
    supabase.from("body_parts").select("id, name").order("name", { ascending: true }),
  ]);
  const equipmentTitleById = new Map((equipLibRes.data ?? []).map((e) => [e.id as string, e.title as string]));
  const levelNameById = new Map((levelsRes.data ?? []).map((e) => [e.id as string, e.name as string]));
  const categoryTypeNameById = new Map((categoryTypesRes.data ?? []).map((e) => [e.id as string, e.name as string]));
  const movementPatternNameById = new Map((movementPatternsRes.data ?? []).map((e) => [e.id as string, e.name as string]));
  const bodyRegionNameById = new Map((bodyRegionsRes.data ?? []).map((e) => [e.id as string, e.name as string]));
  const bodyPartNameById = new Map((bodyPartsRes.data ?? []).map((e) => [e.id as string, e.name as string]));

  const rows: ExerciseListItem[] = (exercises ?? []).map((row) => {
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
        status: (row.status as string | null) ?? "published",
        exercise_locations: row.exercise_locations as
          | {
              location_id: string;
              sort_order: number;
              locations: { name: string; slug: string } | { name: string; slug: string }[] | null;
            }[]
          | null
          | undefined,
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
    const equipmentLabels = item.equipmentIds
      .map((id) => equipmentTitleById.get(id))
      .filter((t): t is string => Boolean(t));
    const levelId = item.exerciseLevelId;
    return {
      ...item,
      equipmentLabels,
      exerciseLevelLabel: levelId ? (levelNameById.get(levelId) ?? null) : null,
      categoryTypeLabels: item.categoryTypeIds
        .map((id) => categoryTypeNameById.get(id))
        .filter((t): t is string => Boolean(t)),
      movementPatternLabels: item.movementPatternIds
        .map((id) => movementPatternNameById.get(id))
        .filter((t): t is string => Boolean(t)),
      bodyRegionLabels: item.bodyRegionIds
        .map((id) => bodyRegionNameById.get(id))
        .filter((t): t is string => Boolean(t)),
      bodyPartLabels: item.bodyPartIds
        .map((id) => bodyPartNameById.get(id))
        .filter((t): t is string => Boolean(t)),
    };
  });

  const listFilters = {
    locations: (locationsRes.data ?? []).map((l) => ({ id: l.id as string, label: l.name as string })),
    equipment: (equipLibRes.data ?? []).map((e) => ({ id: e.id as string, label: e.title as string })),
    levels: (levelsRes.data ?? []).map((l) => ({ id: l.id as string, label: l.name as string })),
    categoryTypes: (categoryTypesRes.data ?? []).map((c) => ({ id: c.id as string, label: c.name as string })),
    movementPatterns: (movementPatternsRes.data ?? []).map((m) => ({ id: m.id as string, label: m.name as string })),
    bodyRegions: (bodyRegionsRes.data ?? []).map((b) => ({ id: b.id as string, label: b.name as string })),
    bodyParts: (bodyPartsRes.data ?? []).map((b) => ({ id: b.id as string, label: b.name as string })),
  };

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
            href="/admin/exercises/taxonomy"
            className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <Layers className="h-4 w-4" />
            Taxonomy
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
          {sp.error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {sp.error}
            </div>
          )}
          {sp.deleted && (
            <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
              Exercise deleted.
            </div>
          )}

          <ExercisesListClient rows={rows} filters={listFilters} />
        </div>
      </div>
    </div>
  );
}
