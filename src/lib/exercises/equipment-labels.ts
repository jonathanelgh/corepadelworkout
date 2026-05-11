/** Rows from Supabase: exercise.exercise_equipment(sort_order, equipment(title)). */

export type ExerciseEquipmentJoinRow = {
  sort_order?: number | null;
  equipment?: { title: string } | { title: string }[] | null;
};

export function equipmentTitlesFromJoin(rows: ExerciseEquipmentJoinRow[] | null | undefined): string[] {
  if (!rows?.length) return [];
  const sorted = [...rows].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  const out: string[] = [];
  for (const pe of sorted) {
    const eq = pe.equipment;
    const row = Array.isArray(eq) ? eq[0] : eq;
    const t =
      row && typeof row === "object" && "title" in row ? String((row as { title: string }).title).trim() : "";
    if (t) out.push(t);
  }
  return out;
}
