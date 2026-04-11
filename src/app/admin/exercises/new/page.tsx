import { createClient } from "@/utils/supabase/server";
import { CreateExerciseForm } from "./create-exercise-form";

export const dynamic = "force-dynamic";

export default async function NewExercisePage() {
  const supabase = await createClient();
  const [
    locationsRes,
    equipmentRes,
    categoryTypesRes,
    movementPatternsRes,
    bodyRegionsRes,
    bodyPartsRes,
    exerciseLevelsRes,
  ] = await Promise.all([
      supabase.from("locations").select("id, name, slug").order("sort_order", { ascending: true }),
      supabase.from("equipment").select("id, title").order("title", { ascending: true }),
      supabase.from("exercise_category_types").select("id, name").order("name", { ascending: true }),
      supabase.from("movement_patterns").select("id, name").order("name", { ascending: true }),
      supabase.from("body_regions").select("id, name").order("name", { ascending: true }),
      supabase.from("body_parts").select("id, name").order("name", { ascending: true }),
      supabase.from("exercise_levels").select("id, name").order("sort_order", { ascending: true }),
    ]);

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
    <CreateExerciseForm
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
