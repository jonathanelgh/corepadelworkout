"use client";

import { useActionState } from "react";
import Link from "next/link";
import { formatMoney, formatWhen } from "@/lib/affiliates/types";
import type { PayoutReportView } from "@/lib/affiliates/payout-reports";
import { generateReportAction, lockReportAction, markPaidAction } from "../report-actions";

export function PayoutReportClient({
  month,
  months,
  report,
}: {
  month: string;
  months: Array<{ value: string; label: string }>;
  report: PayoutReportView | null;
}) {
  const [generated, generate, generating] = useActionState(generateReportAction, {});
  const [locked, lock, locking] = useActionState(lockReportAction, {});
  const [paid, markPaid, paying] = useActionState(markPaidAction, {});
  const error = generated.error || locked.error || paid.error;

  return (
    <div className="flex flex-col gap-6">
      <form method="get" action="/admin/affiliates/payouts" className="flex flex-wrap items-end gap-3">
        <label className="text-sm text-zinc-700">
          Month
          <select
            name="month"
            defaultValue={month}
            className="mt-1 block rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm"
          >
            {months.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className="rounded-full border border-zinc-200 px-4 py-2 text-sm font-medium">
          Show month
        </button>
      </form>

      <div className="flex flex-wrap items-center gap-3">
        {report?.status !== "locked" ? (
          <form action={generate}>
            <input type="hidden" name="month" value={month} />
            <button
              type="submit"
              disabled={generating}
              className="rounded-full bg-zinc-950 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
            >
              {generating ? "Building..." : report ? "Update report" : "Generate report"}
            </button>
          </form>
        ) : null}
        {report && report.status === "open" ? (
          <form action={lock}>
            <input type="hidden" name="month" value={month} />
            <input type="hidden" name="report_id" value={report.id} />
            <button
              type="submit"
              disabled={locking}
              className="rounded-full bg-[#ccff00] px-4 py-2 text-sm font-semibold text-zinc-950 disabled:opacity-60"
            >
              {locking ? "Locking..." : "Lock report"}
            </button>
          </form>
        ) : null}
        {report?.status === "locked" ? (
          <span className="text-sm text-zinc-500">
            Locked{report.lockedAt ? ` ${formatWhen(report.lockedAt)}` : ""}. Amounts stay as they are.
          </span>
        ) : null}
      </div>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      {report ? (
        <div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white">
          <div className="flex items-center justify-between px-4 py-3 text-sm">
            <span className="font-medium">{report.label}</span>
            <span>{formatMoney(report.totalCents, report.currency)}</span>
          </div>
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-y border-zinc-200 text-xs uppercase tracking-wide text-zinc-500">
              <tr>
                <th className="px-4 py-3 font-medium">Affiliate</th>
                <th className="px-4 py-3 font-medium">Invoices</th>
                <th className="px-4 py-3 font-medium">Amount</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Payment</th>
              </tr>
            </thead>
            <tbody>
              {report.lines.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-zinc-500">
                    No commission was earned in this month.
                  </td>
                </tr>
              ) : (
                report.lines.map((line) => (
                  <tr key={line.payoutId} className="border-b border-zinc-100 last:border-0">
                    <td className="px-4 py-3">
                      <Link href={`/admin/affiliates/${line.affiliateId}`} className="font-medium hover:underline">
                        {line.affiliateName}
                      </Link>
                      <div className="text-zinc-500">{line.email}</div>
                    </td>
                    <td className="px-4 py-3">{line.invoiceCount}</td>
                    <td className="px-4 py-3">{formatMoney(line.amountCents, line.currency)}</td>
                    <td className="px-4 py-3">{line.status === "paid" ? "Paid" : "Unpaid"}</td>
                    <td className="px-4 py-3">
                      {line.status === "paid" ? (
                        line.paidAt ? formatWhen(line.paidAt) : "Paid"
                      ) : report.status === "locked" ? (
                        <form action={markPaid}>
                          <input type="hidden" name="month" value={month} />
                          <input type="hidden" name="payout_id" value={line.payoutId} />
                          <button
                            type="submit"
                            disabled={paying}
                            className="rounded-full border border-zinc-200 px-3 py-1.5 text-sm font-medium disabled:opacity-60"
                          >
                            Mark paid
                          </button>
                        </form>
                      ) : (
                        "Lock the report first"
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-sm text-zinc-500">No report for this month yet.</p>
      )}
    </div>
  );
}
