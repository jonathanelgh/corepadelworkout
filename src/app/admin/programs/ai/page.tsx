import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { getIsAdmin } from "@/utils/supabase/is-admin";
import { fetchProgramsCatalog } from "@/lib/programs/programs-catalog";
import { listMembersForAiPicker } from "@/lib/programs/profile-ai-context";
import { AiCoachClient } from "./ai-coach-client";

export const dynamic = "force-dynamic";

export default async function AdminAiCoachPage() {
  const supabase = await createClient();
  if (!(await getIsAdmin(supabase))) {
    redirect("/login?next=/admin/programs/ai");
  }

  const [programsCatalog, members] = await Promise.all([
    fetchProgramsCatalog(supabase),
    listMembersForAiPicker(supabase),
  ]);

  return <AiCoachClient initialCatalog={programsCatalog} members={members} />;
}
