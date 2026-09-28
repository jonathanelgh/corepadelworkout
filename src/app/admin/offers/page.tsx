import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { getIsAdmin } from "@/utils/supabase/is-admin";
import { createServiceClient } from "@/utils/supabase/service";
import { loadSignupOffers } from "@/lib/billing/signup-offer";
import { OffersClient } from "./offers-client";

export const dynamic = "force-dynamic";

export default async function AdminOffersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/admin/offers");
  if (!(await getIsAdmin(supabase))) redirect("/member");

  const rows = await loadSignupOffers(createServiceClient());

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <OffersClient initialRows={rows} />
    </div>
  );
}
