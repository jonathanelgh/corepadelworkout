import { createClient } from "@/utils/supabase/server";
import { listMembersForAiPicker } from "@/lib/programs/profile-ai-context";
import { CreateProgramForm } from "./create-program-form";

export const dynamic = "force-dynamic";

export default async function NewProgramPage() {
  const supabase = await createClient();

  const [categoriesRes, difficultiesRes, exercisesRes, locationsRes, members] = await Promise.all([
    supabase.from("categories").select("id, name, slug").order("sort_order", { ascending: true }),
    supabase.from("difficulty_levels").select("id, name, slug").order("sort_order", { ascending: true }),
    supabase.from("exercises").select("id, title, location_id, status").order("title", { ascending: true }),
    supabase.from("locations").select("id, name, slug").order("sort_order", { ascending: true }),
    listMembersForAiPicker(supabase),
  ]);

  const loadError = [categoriesRes.error, difficultiesRes.error, exercisesRes.error, locationsRes.error]
    .filter(Boolean)
    .map((e) => e!.message)
    .join(" · ");

  const locations = locationsRes.data ?? [];
  const defaultLocationId = locations[0]?.id ?? "";

  return (
    <CreateProgramForm
      categories={categoriesRes.data ?? []}
      difficulties={difficultiesRes.data ?? []}
      exercises={exercisesRes.data ?? []}
      locations={locations}
      defaultLocationId={defaultLocationId}
      loadError={loadError || null}
      members={members}
    />
  );
}
