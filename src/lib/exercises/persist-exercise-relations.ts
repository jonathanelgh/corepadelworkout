import type { SupabaseClient } from "@supabase/supabase-js";

export type ExerciseRelationsInput = {
  equipmentIds: string[];
  categoryTypeIds: string[];
  movementPatternIds: string[];
  bodyRegionIds: string[];
  bodyPartIds: string[];
};

export async function replaceExerciseEquipment(
  supabase: SupabaseClient,
  exerciseId: string,
  equipmentIds: string[]
): Promise<void> {
  const { error: delErr } = await supabase.from("exercise_equipment").delete().eq("exercise_id", exerciseId);
  if (delErr) throw new Error(delErr.message);
  if (equipmentIds.length === 0) return;
  const rows = equipmentIds.map((equipment_id, sort_order) => ({
    exercise_id: exerciseId,
    equipment_id,
    sort_order,
  }));
  const { error: insErr } = await supabase.from("exercise_equipment").insert(rows);
  if (insErr) throw new Error(insErr.message);
}

export async function replaceExerciseCategoryTypeLinks(
  supabase: SupabaseClient,
  exerciseId: string,
  categoryTypeIds: string[]
): Promise<void> {
  const { error: delErr } = await supabase.from("exercise_category_type_links").delete().eq("exercise_id", exerciseId);
  if (delErr) throw new Error(delErr.message);
  if (categoryTypeIds.length === 0) return;
  const rows = categoryTypeIds.map((exercise_category_type_id, sort_order) => ({
    exercise_id: exerciseId,
    exercise_category_type_id,
    sort_order,
  }));
  const { error: insErr } = await supabase.from("exercise_category_type_links").insert(rows);
  if (insErr) throw new Error(insErr.message);
}

export async function replaceExerciseMovementPatternLinks(
  supabase: SupabaseClient,
  exerciseId: string,
  movementPatternIds: string[]
): Promise<void> {
  const { error: delErr } = await supabase
    .from("exercise_movement_pattern_links")
    .delete()
    .eq("exercise_id", exerciseId);
  if (delErr) throw new Error(delErr.message);
  if (movementPatternIds.length === 0) return;
  const rows = movementPatternIds.map((movement_pattern_id, sort_order) => ({
    exercise_id: exerciseId,
    movement_pattern_id,
    sort_order,
  }));
  const { error: insErr } = await supabase.from("exercise_movement_pattern_links").insert(rows);
  if (insErr) throw new Error(insErr.message);
}

export async function replaceExerciseBodyRegionLinks(
  supabase: SupabaseClient,
  exerciseId: string,
  bodyRegionIds: string[]
): Promise<void> {
  const { error: delErr } = await supabase.from("exercise_body_region_links").delete().eq("exercise_id", exerciseId);
  if (delErr) throw new Error(delErr.message);
  if (bodyRegionIds.length === 0) return;
  const rows = bodyRegionIds.map((body_region_id, sort_order) => ({
    exercise_id: exerciseId,
    body_region_id,
    sort_order,
  }));
  const { error: insErr } = await supabase.from("exercise_body_region_links").insert(rows);
  if (insErr) throw new Error(insErr.message);
}

export async function replaceExerciseBodyPartLinks(
  supabase: SupabaseClient,
  exerciseId: string,
  bodyPartIds: string[]
): Promise<void> {
  const { error: delErr } = await supabase.from("exercise_body_part_links").delete().eq("exercise_id", exerciseId);
  if (delErr) throw new Error(delErr.message);
  if (bodyPartIds.length === 0) return;
  const rows = bodyPartIds.map((body_part_id, sort_order) => ({
    exercise_id: exerciseId,
    body_part_id,
    sort_order,
  }));
  const { error: insErr } = await supabase.from("exercise_body_part_links").insert(rows);
  if (insErr) throw new Error(insErr.message);
}

export async function applyExerciseRelations(
  supabase: SupabaseClient,
  exerciseId: string,
  relations: ExerciseRelationsInput
): Promise<void> {
  await replaceExerciseEquipment(supabase, exerciseId, relations.equipmentIds);
  await replaceExerciseCategoryTypeLinks(supabase, exerciseId, relations.categoryTypeIds);
  await replaceExerciseMovementPatternLinks(supabase, exerciseId, relations.movementPatternIds);
  await replaceExerciseBodyRegionLinks(supabase, exerciseId, relations.bodyRegionIds);
  await replaceExerciseBodyPartLinks(supabase, exerciseId, relations.bodyPartIds);
}

export async function insertExerciseWithRelations(
  supabase: SupabaseClient,
  exercise: {
    title: string;
    description: string | null;
    how_to: string | null;
    video_url: string | null;
    image_url: string | null;
    location_id: string;
    exercise_level_id: string | null;
  },
  relations: ExerciseRelationsInput
): Promise<string> {
  const { data: row, error: insertError } = await supabase
    .from("exercises")
    .insert(exercise)
    .select("id")
    .single();

  if (insertError || !row) {
    throw new Error(insertError?.message ?? "Could not create exercise.");
  }

  const exerciseId = row.id as string;
  try {
    await applyExerciseRelations(supabase, exerciseId, relations);
  } catch (e) {
    await supabase.from("exercises").delete().eq("id", exerciseId);
    throw e;
  }
  return exerciseId;
}
