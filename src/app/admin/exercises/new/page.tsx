import { createClient } from "@/utils/supabase/server";
import { CreateExerciseForm } from "./create-exercise-form";

export const dynamic = "force-dynamic";

export default async function NewExercisePage() {
  const supabase = await createClient();
  const { data: locations, error } = await supabase
    .from("locations")
    .select("id, name, slug")
    .order("sort_order", { ascending: true });

  return (
    <CreateExerciseForm locations={locations ?? []} locationsError={error?.message} />
  );
}
