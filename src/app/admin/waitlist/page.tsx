import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { getIsAdmin } from "@/utils/supabase/is-admin";
import { createServiceClient } from "@/utils/supabase/service";
import { loadPreLaunchSignups } from "@/lib/pre-launch/early-access";
import { WaitlistClient } from "./waitlist-client";

export const dynamic = "force-dynamic";

export default async function AdminWaitlistPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/admin/waitlist");
  if (!(await getIsAdmin(supabase))) redirect("/member");

  const rows = await loadPreLaunchSignups(createServiceClient());

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <WaitlistClient initialRows={rows} />
    </div>
  );
}
