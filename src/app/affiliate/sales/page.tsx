import { SalesTable } from "@/components/affiliates/dashboard-bits";
import { loadRequestAffiliateDashboard } from "@/lib/affiliates/load-dashboard";
import { formatMoney } from "@/lib/affiliates/types";

export const dynamic = "force-dynamic";

export default async function AffiliateSalesPage() {
  const dashboard = await loadRequestAffiliateDashboard();
  if (!dashboard) return null;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Sales</h1>
        <p className="mt-2 text-sm text-zinc-600">
          {dashboard.salesCount} paid invoices, {formatMoney(dashboard.salesCents, dashboard.currency)} in
          subscription revenue, {formatMoney(dashboard.commissionCents, dashboard.currency)} in commission.
        </p>
      </div>
      <SalesTable sales={dashboard.sales} />
    </div>
  );
}
