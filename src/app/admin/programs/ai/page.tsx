import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { getIsAdmin } from "@/utils/supabase/is-admin";
import { fetchProgramsCatalog } from "@/lib/programs/programs-catalog";
import { listMembersForAiPicker } from "@/lib/programs/profile-ai-context";
import { AiCoachClient } from "./ai-coach-client";

export const dynamic = "force-dynamic";
/** Full multi-week OpenAI program generation regularly exceeds default serverless limits. */
export const maxDuration = 300;

export default async function AdminAiCoachPage() {
  const supabase = await createClient();
  if (!(await getIsAdmin(supabase))) {
    redirect("/login?next=/admin/programs/ai");
  }

  const [programsCatalog, members, equipmentResult] = await Promise.all([
    fetchProgramsCatalog(supabase),
    listMembersForAiPicker(supabase),
    supabase.from("equipment").select("title").order("title", { ascending: true }),
  ]);

  const equipmentOptions = (equipmentResult.data ?? [])
    .map((row) => (typeof row.title === "string" ? row.title.trim() : ""))
    .filter((title) => title.length > 0);

  return (
    <AiCoachClient
      initialCatalog={programsCatalog}
      members={members}
      equipmentOptions={equipmentOptions}
    />
  );
}
