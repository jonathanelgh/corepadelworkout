import { loadRequestAffiliateDashboard } from "@/lib/affiliates/load-dashboard";
import { formatMoney, formatWhen } from "@/lib/affiliates/types";

export const dynamic = "force-dynamic";

export default async function AffiliatePayoutsPage() {
  const dashboard = await loadRequestAffiliateDashboard();
  if (!dashboard) return null;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Payouts</h1>
        <p className="mt-2 text-sm text-zinc-600">
          Paid out {formatMoney(dashboard.paidCents, dashboard.currency)}. Unpaid balance{" "}
          {formatMoney(dashboard.balanceCents, dashboard.currency)}.
        </p>
      </div>
      <div className="rounded-2xl border border-zinc-200 bg-white">
        {dashboard.payouts.length === 0 ? (
          <p className="p-4 text-sm text-zinc-500">No payouts yet. Unpaid commission stays in your balance until it is paid.</p>
        ) : (
          <ul className="divide-y divide-zinc-100 text-sm">
            {dashboard.payouts.map((payout) => (
              <li key={payout.id} className="flex items-center justify-between gap-4 px-4 py-3">
                <div>
                  <div className="font-medium">{formatMoney(payout.amount_cents, payout.currency)}</div>
                  <div className="text-zinc-500">
                    {payout.period_label || "Payout"}
                    {payout.notes ? `, ${payout.notes}` : ""}
                  </div>
                </div>
                <div className="flex items-center gap-4 text-right text-zinc-500">
                  <div>
                    <div>{payout.status === "paid" ? "Paid" : "Waiting for payment"}</div>
                    <div>{payout.paid_at ? formatWhen(payout.paid_at) : formatWhen(payout.created_at)}</div>
                  </div>
                  {payout.status === "paid" ? (
                    <a
                      href={`/affiliate/payouts/${payout.id}/receipt`}
                      className="rounded-full border border-zinc-200 px-3 py-1.5 text-sm font-medium text-zinc-950"
                    >
                      Download receipt
                    </a>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
