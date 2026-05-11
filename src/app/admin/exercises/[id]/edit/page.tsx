import { notFound } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { bucketJunctionByExerciseId, exerciseRowToListItem } from "../../exercise-row-utils";
import type { ExerciseListItem } from "../../types";
import { EditExerciseForm } from "./edit-exercise-form";

export const dynamic = "force-dynamic";

export default async function EditExercisePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const exerciseRes = await supabase
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
    .eq("id", id)
    .maybeSingle();

  if (!exerciseRes.data) {
    notFound();
  }

  const row = exerciseRes.data;

  const [
    catRes,
    mpRes,
    brRes,
    bpRes,
    locationsRes,
    equipmentRes,
    categoryTypesRes,
    movementPatternsRes,
    bodyRegionsRes,
    bodyPartsRes,
    exerciseLevelsRes,
  ] = await Promise.all([
    supabase
      .from("exercise_category_type_links")
      .select("exercise_id, exercise_category_type_id, sort_order")
      .eq("exercise_id", id),
    supabase
      .from("exercise_movement_pattern_links")
      .select("exercise_id, movement_pattern_id, sort_order")
      .eq("exercise_id", id),
    supabase.from("exercise_body_region_links").select("exercise_id, body_region_id, sort_order").eq("exercise_id", id),
    supabase.from("exercise_body_part_links").select("exercise_id, body_part_id, sort_order").eq("exercise_id", id),
    supabase.from("locations").select("id, name, slug").order("sort_order", { ascending: true }),
    supabase.from("equipment").select("id, title").order("title", { ascending: true }),
    supabase.from("exercise_category_types").select("id, name").order("name", { ascending: true }),
    supabase.from("movement_patterns").select("id, name").order("name", { ascending: true }),
    supabase.from("body_regions").select("id, name").order("name", { ascending: true }),
    supabase.from("body_parts").select("id, name").order("name", { ascending: true }),
    supabase.from("exercise_levels").select("id, name").order("sort_order", { ascending: true }),
  ]);

  const ctByExercise = bucketJunctionByExerciseId(catRes.data);
  const mpByExercise = bucketJunctionByExerciseId(mpRes.data);
  const brByExercise = bucketJunctionByExerciseId(brRes.data);
  const bpByExercise = bucketJunctionByExerciseId(bpRes.data);

  const initial: ExerciseListItem = exerciseRowToListItem(
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
      locations: row.locations as { name: string; slug: string } | { name: string; slug: string }[] | null,
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

  return (
    <EditExerciseForm
      initial={initial}
      locations={locationsRes.data ?? []}
      locationsError={locationsRes.error?.message}
      equipmentOptions={equipmentOptions}
      categoryTypeOptions={categoryTypeOptions}
      movementPatternOptions={movementPatternOptions}
      bodyRegionOptions={bodyRegionOptions}
      bodyPartOptions={bodyPartOptions}
      exerciseLevelOptions={exerciseLevelOptions}
      equipmentError={equipmentRes.error?.message}
      categoryTypesError={categoryTypesRes.error?.message}
      movementPatternsError={movementPatternsRes.error?.message}
      bodyRegionsError={bodyRegionsRes.error?.message}
      bodyPartsError={bodyPartsRes.error?.message}
      exerciseLevelsError={exerciseLevelsRes.error?.message}
    />
  );
}
