import type { ExerciseListItem } from "./types";

export function pickLocation(
  loc: { name: string; slug: string } | { name: string; slug: string }[] | null
): { name: string; slug: string } | null {
  if (!loc) return null;
  return Array.isArray(loc) ? loc[0] ?? null : loc;
}

export function sortedJunctionIds<T extends { sort_order: number }>(
  rows: T[] | null | undefined,
  getId: (r: T) => string
): string[] {
  if (!rows?.length) return [];
  return [...rows].sort((a, b) => a.sort_order - b.sort_order).map(getId);
}

export function bucketJunctionByExerciseId<T extends { exercise_id: string; sort_order: number }>(
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

type ExerciseRow = {
  id: string;
  title: string;
  description: string | null;
  how_to: string | null;
  video_url: string | null;
  image_url: string | null;
  created_at: string;
  location_id: string;
  exercise_level_id: string | null;
  locations: { name: string; slug: string } | { name: string; slug: string }[] | null;
  exercise_equipment: { equipment_id: string; sort_order: number }[] | null | undefined;
};

export function exerciseRowToListItem(
  row: ExerciseRow,
  ctByExercise: Map<string, { exercise_category_type_id: string; sort_order: number }[]>,
  mpByExercise: Map<string, { movement_pattern_id: string; sort_order: number }[]>,
  brByExercise: Map<string, { body_region_id: string; sort_order: number }[]>,
  bpByExercise: Map<string, { body_part_id: string; sort_order: number }[]>
): ExerciseListItem {
  const id = row.id;
  const loc = pickLocation(row.locations);
  const ee = row.exercise_equipment;
  const ct = ctByExercise.get(id);
  const mp = mpByExercise.get(id);
  const br = brByExercise.get(id);
  const bp = bpByExercise.get(id);
  return {
    id,
    title: row.title,
    description: row.description ?? null,
    how_to: row.how_to ?? null,
    video_url: row.video_url ?? null,
    image_url: row.image_url ?? null,
    location_id: row.location_id,
    created_at: row.created_at,
    locationName: loc?.name ?? null,
    equipmentIds: sortedJunctionIds(ee, (r) => r.equipment_id),
    equipmentLabels: [],
    categoryTypeIds: sortedJunctionIds(ct, (r) => r.exercise_category_type_id),
    movementPatternIds: sortedJunctionIds(mp, (r) => r.movement_pattern_id),
    bodyRegionIds: sortedJunctionIds(br, (r) => r.body_region_id),
    bodyPartIds: sortedJunctionIds(bp, (r) => r.body_part_id),
    exerciseLevelId: row.exercise_level_id ?? null,
  };
}
