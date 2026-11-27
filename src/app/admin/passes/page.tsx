import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { getIsAdmin } from "@/utils/supabase/is-admin";
import { createServiceClient } from "@/utils/supabase/service";
import { loadProPasses } from "@/lib/billing/pro-passes";
import { PassesClient } from "./passes-client";

export const dynamic = "force-dynamic";

export default async function AdminPassesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/admin/passes");
  if (!(await getIsAdmin(supabase))) redirect("/member");

  const rows = await loadProPasses(createServiceClient());

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <PassesClient initialRows={rows} />
    </div>
  );
}
