import { ClickChart, StatGrid } from "@/components/affiliates/dashboard-bits";
import { loadRequestAffiliateDashboard } from "@/lib/affiliates/load-dashboard";
import { formatMoney } from "@/lib/affiliates/types";

export const dynamic = "force-dynamic";

export default async function AffiliateAnalyticsPage() {
  const dashboard = await loadRequestAffiliateDashboard();
  if (!dashboard) return null;
  const signupRate = dashboard.clicks > 0 ? Math.round((dashboard.signups / dashboard.clicks) * 1000) / 10 : 0;
  const subscribeRate =
    dashboard.signups > 0 ? Math.round((dashboard.subscribers / dashboard.signups) * 1000) / 10 : 0;
  const earnedPerClick = dashboard.clicks > 0 ? Math.round(dashboard.commissionCents / dashboard.clicks) : 0;
  const maxCommission = Math.max(1, ...dashboard.days.map((day) => day.commissionCents));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-600">
          Clicks are counted each time someone opens your link. Signups and subscribers only count inside
          the 30-day window, and a later link does not replace the first one.
        </p>
      </div>
      <StatGrid
        items={[
          { label: "Click to signup", value: `${signupRate}%` },
          { label: "Signup to subscriber", value: `${subscribeRate}%` },
          { label: "Commission per click", value: formatMoney(earnedPerClick, dashboard.currency) },
          {
            label: "Commission, 30 days",
            value: formatMoney(
              dashboard.days.reduce((sum, day) => sum + day.commissionCents, 0),
              dashboard.currency
            ),
          },
        ]}
      />
      <ClickChart days={dashboard.days} />
      <div className="rounded-2xl border border-zinc-200 bg-white p-4">
        <h2 className="text-sm font-semibold">Commission, last 30 days</h2>
        <div className="mt-4 flex h-36 items-end gap-1">
          {dashboard.days.map((day) => (
            <div key={day.date} className="flex h-full flex-1 items-end">
              <div
                className="w-full rounded-sm bg-zinc-950"
                style={{
                  height:
                    day.commissionCents === 0
                      ? "0%"
                      : `${Math.max(8, (day.commissionCents / maxCommission) * 100)}%`,
                }}
                title={`${day.date}: ${formatMoney(day.commissionCents, dashboard.currency)}`}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
