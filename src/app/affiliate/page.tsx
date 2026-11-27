import { CopyLink } from "@/components/affiliates/copy-link";
import { ClickChart, StatGrid } from "@/components/affiliates/dashboard-bits";
import { loadRequestAffiliateDashboard } from "@/lib/affiliates/load-dashboard";
import { formatMoney, formatPercent } from "@/lib/affiliates/types";

export const dynamic = "force-dynamic";

export default async function AffiliateOverviewPage() {
  const dashboard = await loadRequestAffiliateDashboard();
  if (!dashboard) return null;
  const { profile } = dashboard;
  const conversion =
    dashboard.clicks > 0 ? Math.round((dashboard.subscribers / dashboard.clicks) * 1000) / 10 : 0;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-600">
          You earn {formatPercent(profile.commission_percent)} of each paid subscription invoice for{" "}
          {profile.commission_months} months. A player stays linked to you for 30 days after they open
          your link. The trial itself is not a sale.
        </p>
      </div>
      <CopyLink link={dashboard.link} />
      <StatGrid
        items={[
          { label: "Clicks", value: String(dashboard.clicks), hint: `${dashboard.clicks30} in 30 days` },
          { label: "Signups", value: String(dashboard.signups) },
          { label: "Subscribers", value: String(dashboard.subscribers), hint: `${conversion}% of clicks` },
          { label: "Paid sales", value: String(dashboard.salesCount) },
          { label: "Commission", value: formatMoney(dashboard.commissionCents, dashboard.currency) },
          { label: "Unpaid", value: formatMoney(dashboard.balanceCents, dashboard.currency) },
        ]}
      />
      <ClickChart days={dashboard.days} />
    </div>
  );
}
