import Link from "next/link";
import { redirect } from "next/navigation";
import { loadPayoutReport } from "@/lib/affiliates/payout-reports";
import { formatMonthLabel, monthKey, parseMonth, previousFinishedMonth, recentFinishedMonths } from "@/lib/affiliates/months";
import { createClient } from "@/utils/supabase/server";
import { getIsAdmin } from "@/utils/supabase/is-admin";
import { PayoutReportClient } from "./report-client";

export const dynamic = "force-dynamic";

export default async function AdminPayoutReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/admin/affiliates/payouts");
  if (!(await getIsAdmin(supabase))) redirect("/member");

  const params = await searchParams;
  const fallback = previousFinishedMonth();
  const selected = parseMonth(params.month) ?? fallback;
  const month = monthKey(selected.year, selected.month);
  const report = await loadPayoutReport(month);
  const months = recentFinishedMonths().map((item) => ({
    value: monthKey(item.year, item.month),
    label: formatMonthLabel(item.year, item.month),
  }));

  return (
    <div className="min-h-0 flex-1 overflow-y-auto p-6 md:p-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <div>
          <Link href="/admin/affiliates" className="text-sm text-zinc-500 hover:text-zinc-950">
            All affiliates
          </Link>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-950">Payout reports</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-600">
            Pick a finished month. The list is that month's commission for each affiliate. Lock it when
            the amounts are final, then mark each affiliate paid. They can download a receipt after it is paid.
          </p>
        </div>
        <PayoutReportClient month={month} months={months} report={report} />
      </div>
    </div>
  );
}
