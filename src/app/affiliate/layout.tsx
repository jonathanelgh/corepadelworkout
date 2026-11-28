import { redirect } from "next/navigation";
import { ChangePasswordModal } from "@/components/affiliates/change-password-modal";
import { AffiliateShell } from "@/components/affiliates/affiliate-shell";
import { loadRequestAffiliateDashboard } from "@/lib/affiliates/load-dashboard";
import { getRequestUser } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";

export default async function AffiliateLayout({ children }: { children: React.ReactNode }) {
  const dashboard = await loadRequestAffiliateDashboard();
  if (!dashboard) {
    const user = await getRequestUser();
    if (!user) redirect("/login?next=/affiliate");
    redirect("/member");
  }

  return (
    <AffiliateShell name={dashboard.profile.display_name}>
      {children}
      {dashboard.mustChangePassword ? <ChangePasswordModal /> : null}
    </AffiliateShell>
  );
}
