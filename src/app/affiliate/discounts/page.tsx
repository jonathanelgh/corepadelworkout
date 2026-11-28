import { DiscountsClient } from "./discounts-client";
import { loadAffiliateDiscounts } from "@/lib/affiliates/discounts";
import { loadRequestAffiliateDashboard } from "@/lib/affiliates/load-dashboard";
import { getPublicSiteUrl } from "@/lib/stripe/config";

export const dynamic = "force-dynamic";

export default async function AffiliateDiscountsPage() {
  const dashboard = await loadRequestAffiliateDashboard();
  if (!dashboard) return null;
  const discounts = await loadAffiliateDiscounts(dashboard.profile.id);

  return (
    <DiscountsClient
      discounts={discounts}
      commissionPercent={dashboard.profile.commission_percent}
      signupUrl={`${getPublicSiteUrl()}/signup`}
    />
  );
}
