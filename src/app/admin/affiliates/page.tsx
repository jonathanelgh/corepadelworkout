import { redirect } from "next/navigation";
import { loadAdminAffiliates } from "@/lib/affiliates/load-admin";
import { createClient } from "@/utils/supabase/server";
import { getIsAdmin } from "@/utils/supabase/is-admin";
import { AffiliatesAdminClient } from "./affiliates-admin-client";

export const dynamic = "force-dynamic";

export default async function AdminAffiliatesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/admin/affiliates");
  if (!(await getIsAdmin(supabase))) redirect("/member");

  const rows = await loadAdminAffiliates();
  return (
    <div className="min-h-0 flex-1 overflow-y-auto p-6 md:p-8">
      <AffiliatesAdminClient rows={rows} />
    </div>
  );
}
