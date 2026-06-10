import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { getIsAdmin } from "@/utils/supabase/is-admin";
import { loadAllAiPrompts } from "@/lib/programs/ai-prompts";
import { AiPromptsEditor } from "./prompts-editor";

export const dynamic = "force-dynamic";

export default async function AdminAiPromptsPage() {
  const supabase = await createClient();
  if (!(await getIsAdmin(supabase))) {
    redirect("/login?next=/admin/programs/ai/prompts");
  }

  const prompts = await loadAllAiPrompts(supabase);

  return <AiPromptsEditor initialPrompts={prompts} />;
}
