import Link from "next/link";
import { redirect } from "next/navigation";
import { loadAffiliateSubscriptions } from "@/lib/affiliates/load-admin";
import { formatMoney, formatWhen } from "@/lib/affiliates/types";
import { createClient } from "@/utils/supabase/server";
import { getIsAdmin } from "@/utils/supabase/is-admin";

export const dynamic = "force-dynamic";

export default async function AdminAffiliateSubscriptionsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/admin/affiliates/subscriptions");
  if (!(await getIsAdmin(supabase))) redirect("/member");

  const rows = await loadAffiliateSubscriptions();

  return (
    <div className="min-h-0 flex-1 overflow-y-auto p-6 md:p-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <div>
          <Link href="/admin/affiliates" className="text-sm text-zinc-500 hover:text-zinc-950">
            All affiliates
          </Link>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-950">Referred subscriptions</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-600">
            Subscriptions that started from an affiliate link inside the 30-day window.
          </p>
        </div>
        <div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="border-b border-zinc-200 text-xs uppercase tracking-wide text-zinc-500">
              <tr>
                <th className="px-4 py-3 font-medium">Affiliate</th>
                <th className="px-4 py-3 font-medium">Player</th>
                <th className="px-4 py-3 font-medium">Started</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Period ends</th>
                <th className="px-4 py-3 font-medium">Commission ends</th>
                <th className="px-4 py-3 font-medium">Earned</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-zinc-500">
                    No referred subscriptions yet.
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.id} className="border-b border-zinc-100 last:border-0">
                    <td className="px-4 py-3">
                      <Link href={`/admin/affiliates/${row.affiliateId}`} className="font-medium hover:underline">
                        {row.affiliateName}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <div>{row.playerName}</div>
                      <div className="text-zinc-500">{row.email}</div>
                    </td>
                    <td className="px-4 py-3">{formatWhen(row.startedAt)}</td>
                    <td className="px-4 py-3">{row.status}</td>
                    <td className="px-4 py-3">{row.periodEnd ? formatWhen(row.periodEnd) : "-"}</td>
                    <td className="px-4 py-3">{row.commissionEndsAt ? formatWhen(row.commissionEndsAt) : "-"}</td>
                    <td className="px-4 py-3">{formatMoney(row.commissionCents, row.currency)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
