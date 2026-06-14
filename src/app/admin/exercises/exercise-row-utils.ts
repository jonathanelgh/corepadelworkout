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

type ExerciseLocationNested = {
  location_id: string;
  sort_order: number;
  locations: { name: string; slug: string } | { name: string; slug: string }[] | null;
};

type ExerciseRow = {
  id: string;
  title: string;
  status?: string | null;
  description: string | null;
  how_to: string | null;
  video_url: string | null;
  image_url: string | null;
  created_at: string;
  location_id: string;
  exercise_level_id: string | null;
  exercise_locations?: ExerciseLocationNested[] | null | undefined;
  exercise_equipment: { equipment_id: string; sort_order: number }[] | null | undefined;
};

function resolveLocationFields(row: ExerciseRow): {
  locationIds: string[];
  locationNames: string[];
  location_id: string;
} {
  const locRows = row.exercise_locations;
  if (locRows?.length) {
    const sorted = [...locRows].sort((a, b) => a.sort_order - b.sort_order);
    const locationIds = sorted.map((r) => r.location_id);
    const locationNames = sorted
      .map((r) => pickLocation(r.locations)?.name)
      .filter((n): n is string => Boolean(n));
    return {
      locationIds,
      locationNames,
      location_id: locationIds[0] ?? row.location_id,
    };
  }

  return {
    locationIds: row.location_id ? [row.location_id] : [],
    locationNames: [],
    location_id: row.location_id,
  };
}

export function exerciseRowToListItem(
  row: ExerciseRow,
  ctByExercise: Map<string, { exercise_category_type_id: string; sort_order: number }[]>,
  mpByExercise: Map<string, { movement_pattern_id: string; sort_order: number }[]>,
  brByExercise: Map<string, { body_region_id: string; sort_order: number }[]>,
  bpByExercise: Map<string, { body_part_id: string; sort_order: number }[]>
): ExerciseListItem {
  const id = row.id;
  const ee = row.exercise_equipment;
  const ct = ctByExercise.get(id);
  const mp = mpByExercise.get(id);
  const br = brByExercise.get(id);
  const bp = bpByExercise.get(id);
  const status = row.status === "draft" ? "draft" : "published";
  const { locationIds, locationNames, location_id } = resolveLocationFields(row);

  return {
    id,
    title: row.title,
    status,
    description: row.description ?? null,
    how_to: row.how_to ?? null,
    video_url: row.video_url ?? null,
    image_url: row.image_url ?? null,
    location_id,
    locationIds,
    created_at: row.created_at,
    locationName: locationNames.length > 0 ? locationNames.join(", ") : null,
    locationNames,
    equipmentIds: sortedJunctionIds(ee, (r) => r.equipment_id),
    equipmentLabels: [],
    categoryTypeIds: sortedJunctionIds(ct, (r) => r.exercise_category_type_id),
    movementPatternIds: sortedJunctionIds(mp, (r) => r.movement_pattern_id),
    bodyRegionIds: sortedJunctionIds(br, (r) => r.body_region_id),
    bodyPartIds: sortedJunctionIds(bp, (r) => r.body_part_id),
    exerciseLevelId: row.exercise_level_id ?? null,
    exerciseLevelLabel: null,
    categoryTypeLabels: [],
    movementPatternLabels: [],
    bodyRegionLabels: [],
    bodyPartLabels: [],
  };
}

export const EXERCISE_LOCATIONS_SELECT = `
  exercise_locations (
    location_id,
    sort_order,
    locations ( name, slug )
  )
`;
