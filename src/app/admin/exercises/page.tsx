import { Plus, Package, Layers } from "lucide-react";
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

function sortedJunctionIds<T extends { sort_order: number }>(
  rows: T[] | null | undefined,
  getId: (r: T) => string
): string[] {
  if (!rows?.length) return [];
  return [...rows].sort((a, b) => a.sort_order - b.sort_order).map(getId);
}

function bucketJunctionByExerciseId<T extends { exercise_id: string; sort_order: number }>(
  data: T[] | null | undefined
): Map<string, T[]> {
  const m = new Map<string, T[]>();
  for (const r of data ?? []) {
    const list = m.get(r.exercise_id) ?? [];
    list.push(r);
    m.set(r.exercise_id, list);
  }
  for (const list of m.values()) {
    list.sort((a, b) => a.sort_order - b.sort_order);
  }
  return m;
}

export default async function AdminExercisesPage() {
  const supabase = await createClient();
  const [
    exercisesRes,
    locationsRes,
    equipmentRes,
    categoryTypesRes,
    movementPatternsRes,
    bodyRegionsRes,
    bodyPartsRes,
    exerciseLevelsRes,
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
      locations ( name, slug ),
      exercise_equipment ( equipment_id, sort_order )
    `
        )
        .order("created_at", { ascending: false }),
      supabase.from("locations").select("id, name, slug").order("sort_order", { ascending: true }),
      supabase.from("equipment").select("id, title").order("title", { ascending: true }),
      supabase.from("exercise_category_types").select("id, name").order("name", { ascending: true }),
      supabase.from("movement_patterns").select("id, name").order("name", { ascending: true }),
      supabase.from("body_regions").select("id, name").order("name", { ascending: true }),
      supabase.from("body_parts").select("id, name").order("name", { ascending: true }),
      supabase.from("exercise_levels").select("id, name").order("sort_order", { ascending: true }),
    ]);

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
  const locations = locationsRes.data ?? [];
  const equipmentOptions = (equipmentRes.data ?? []).map((r) => ({
    id: r.id as string,
    label: r.title as string,
  }));
  const categoryTypeOptions = (categoryTypesRes.data ?? []).map((r) => ({
    id: r.id as string,
    label: r.name as string,
  }));
  const movementPatternOptions = (movementPatternsRes.data ?? []).map((r) => ({
    id: r.id as string,
    label: r.name as string,
  }));
  const bodyRegionOptions = (bodyRegionsRes.data ?? []).map((r) => ({
    id: r.id as string,
    label: r.name as string,
  }));
  const bodyPartOptions = (bodyPartsRes.data ?? []).map((r) => ({
    id: r.id as string,
    label: r.name as string,
  }));
  const exerciseLevelOptions = (exerciseLevelsRes.data ?? []).map((r) => ({
    id: r.id as string,
    label: r.name as string,
  }));

  const rows: ExerciseListItem[] = (exercises ?? []).map((row) => {
    const id = row.id as string;
    const loc = pickLocation(row.locations as { name: string; slug: string } | { name: string; slug: string }[] | null);
    const ee = row.exercise_equipment as { equipment_id: string; sort_order: number }[] | null | undefined;
    const ct = ctByExercise.get(id);
    const mp = mpByExercise.get(id);
    const br = brByExercise.get(id);
    const bp = bpByExercise.get(id);
    return {
      id,
      title: row.title as string,
      description: (row.description as string | null) ?? null,
      how_to: (row.how_to as string | null) ?? null,
      video_url: (row.video_url as string | null) ?? null,
      image_url: (row.image_url as string | null) ?? null,
      location_id: row.location_id as string,
      created_at: row.created_at as string,
      locationName: loc?.name ?? null,
      equipmentIds: sortedJunctionIds(ee, (r) => r.equipment_id),
      categoryTypeIds: sortedJunctionIds(ct, (r) => r.exercise_category_type_id),
      movementPatternIds: sortedJunctionIds(mp, (r) => r.movement_pattern_id),
      bodyRegionIds: sortedJunctionIds(br, (r) => r.body_region_id),
      bodyPartIds: sortedJunctionIds(bp, (r) => r.body_part_id),
      exerciseLevelId: (row.exercise_level_id as string | null) ?? null,
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

          <ExercisesListClient
            rows={rows}
            locations={locations}
            equipmentOptions={equipmentOptions}
            categoryTypeOptions={categoryTypeOptions}
            movementPatternOptions={movementPatternOptions}
            bodyRegionOptions={bodyRegionOptions}
            bodyPartOptions={bodyPartOptions}
            exerciseLevelOptions={exerciseLevelOptions}
          />
        </div>
      </div>
    </div>
  );
}
