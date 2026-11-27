import { formatMoney } from "@/lib/affiliates/types";
import type { AffiliateDayStat } from "@/lib/affiliates/types";

export function StatGrid({
  items,
}: {
  items: Array<{ label: string; value: string; hint?: string }>;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => (
        <div key={item.label} className="rounded-2xl border border-zinc-200 bg-white p-4">
          <div className="text-xs uppercase tracking-wide text-zinc-500">{item.label}</div>
          <div className="mt-1 text-2xl font-semibold tracking-tight">{item.value}</div>
          {item.hint ? <div className="mt-1 text-sm text-zinc-500">{item.hint}</div> : null}
        </div>
      ))}
    </div>
  );
}

export function ClickChart({ days }: { days: AffiliateDayStat[] }) {
  const max = Math.max(1, ...days.map((day) => day.clicks));
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4">
      <h2 className="text-sm font-semibold">Clicks, last 30 days</h2>
      <div className="mt-4 flex h-36 items-end gap-1">
        {days.map((day) => (
          <div key={day.date} className="group flex h-full flex-1 items-end">
            <div
              className="w-full rounded-sm bg-[#ccff00]"
              style={{ height: day.clicks === 0 ? "0%" : `${Math.max(8, (day.clicks / max) * 100)}%` }}
              title={`${day.date}: ${day.clicks} clicks`}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export function SalesTable({
  sales,
}: {
  sales: Array<{
    id: string;
    earned_at: string;
    sale_amount_cents: number;
    commission_cents: number;
    commission_percent: number;
    currency: string;
    payout_id: string | null;
  }>;
}) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead className="border-b border-zinc-200 text-xs uppercase tracking-wide text-zinc-500">
          <tr>
            <th className="px-4 py-3 font-medium">Date</th>
            <th className="px-4 py-3 font-medium">Sale</th>
            <th className="px-4 py-3 font-medium">Rate</th>
            <th className="px-4 py-3 font-medium">Commission</th>
            <th className="px-4 py-3 font-medium">Payout</th>
          </tr>
        </thead>
        <tbody>
          {sales.length === 0 ? (
            <tr>
              <td colSpan={5} className="px-4 py-8 text-zinc-500">
                No paid sales yet. A trial does not count as a sale. Commission starts when a referred player is charged.
              </td>
            </tr>
          ) : (
            sales.map((sale) => (
              <tr key={sale.id} className="border-b border-zinc-100 last:border-0">
                <td className="px-4 py-3">
                  {new Intl.DateTimeFormat("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  }).format(new Date(sale.earned_at))}
                </td>
                <td className="px-4 py-3">{formatMoney(sale.sale_amount_cents, sale.currency)}</td>
                <td className="px-4 py-3">{sale.commission_percent}%</td>
                <td className="px-4 py-3">{formatMoney(sale.commission_cents, sale.currency)}</td>
                <td className="px-4 py-3">{sale.payout_id ? "Paid" : "Unpaid"}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
