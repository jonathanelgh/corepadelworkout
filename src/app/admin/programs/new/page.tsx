import { createClient } from "@/utils/supabase/server";
import { loadProgramExerciseOptions } from "@/lib/exercises/program-exercise-options";
import { listMembersForAiPicker } from "@/lib/programs/profile-ai-context";
import { CreateProgramForm } from "./create-program-form";

export const dynamic = "force-dynamic";

export default async function NewProgramPage() {
  const supabase = await createClient();

  const [categoriesRes, difficultiesRes, exerciseOptionsRes, locationsRes, members] = await Promise.all([
    supabase.from("categories").select("id, name, slug").order("sort_order", { ascending: true }),
    supabase.from("difficulty_levels").select("id, name, slug").order("sort_order", { ascending: true }),
    loadProgramExerciseOptions(supabase),
    supabase.from("locations").select("id, name, slug").order("sort_order", { ascending: true }),
    listMembersForAiPicker(supabase),
  ]);

  const loadError = [
    categoriesRes.error?.message,
    difficultiesRes.error?.message,
    exerciseOptionsRes.error,
    locationsRes.error?.message,
  ]
    .filter((m): m is string => Boolean(m))
    .join(" · ");

  const locations = locationsRes.data ?? [];
  const defaultLocationId = locations[0]?.id ?? "";

  return (
    <CreateProgramForm
      categories={categoriesRes.data ?? []}
      difficulties={difficultiesRes.data ?? []}
      exercises={exerciseOptionsRes.exercises}
      locations={locations}
      defaultLocationId={defaultLocationId}
      loadError={loadError || null}
      members={members}
    />
  );
}
