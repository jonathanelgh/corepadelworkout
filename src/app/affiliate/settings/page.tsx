import { AffiliateSettingsForm } from "./settings-form";
import { loadRequestAffiliateDashboard } from "@/lib/affiliates/load-dashboard";
import { formatPercent } from "@/lib/affiliates/types";

export const dynamic = "force-dynamic";

export default async function AffiliateSettingsPage() {
  const dashboard = await loadRequestAffiliateDashboard();
  if (!dashboard) return null;
  const { profile } = dashboard;

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-2 text-sm leading-relaxed text-zinc-600">
          Your login email is {profile.email}. You earn {formatPercent(profile.commission_percent)} for{" "}
          {profile.commission_months} months on new referrals. CorePadel sets that rate.
        </p>
      </div>
      <AffiliateSettingsForm profile={profile} />
    </div>
  );
}
