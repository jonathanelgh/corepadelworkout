import { createClient } from "@/utils/supabase/server";
import { CreateExerciseForm } from "./create-exercise-form";

export const dynamic = "force-dynamic";

export default async function NewExercisePage() {
  const supabase = await createClient();
  const [locationsRes, equipmentRes, tabsRes] = await Promise.all([
    supabase.from("locations").select("id, name, slug").order("sort_order", { ascending: true }),
    supabase.from("equipment").select("id, title").order("title", { ascending: true }),
    supabase.from("exercise_tabs").select("id, title").order("title", { ascending: true }),
  ]);

  const equipmentOptions = (equipmentRes.data ?? []).map((r) => ({
    id: r.id as string,
    label: r.title as string,
  }));
  const tagOptions = (tabsRes.data ?? []).map((r) => ({
    id: r.id as string,
    label: r.title as string,
  }));

  return (
    <CreateExerciseForm
      locations={locationsRes.data ?? []}
      locationsError={locationsRes.error?.message}
      equipmentOptions={equipmentOptions}
      tagOptions={tagOptions}
      equipmentError={equipmentRes.error?.message}
      tagsError={tabsRes.error?.message}
    />
  );
}
