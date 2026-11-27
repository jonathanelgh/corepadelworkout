import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { loadAdminAffiliate } from "@/lib/affiliates/load-admin";
import { formatMoney, formatPercent, formatWhen } from "@/lib/affiliates/types";
import { createClient } from "@/utils/supabase/server";
import { getIsAdmin } from "@/utils/supabase/is-admin";
import { AffiliateDetailForm } from "./affiliate-detail-form";

export const dynamic = "force-dynamic";

export default async function AdminAffiliateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/admin/affiliates/${id}`);
  if (!(await getIsAdmin(supabase))) redirect("/member");

  const detail = await loadAdminAffiliate(id);
  if (!detail) notFound();
  const { profile } = detail;

  return (
    <div className="min-h-0 flex-1 overflow-y-auto p-6 md:p-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <div>
          <Link href="/admin/affiliates" className="text-sm text-zinc-500 hover:text-zinc-950">
            All affiliates
          </Link>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-950">{profile.display_name}</h1>
          <p className="mt-2 break-all text-sm text-zinc-600">{detail.link}</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-4">
          <Stat label="Clicks" value={String(detail.clicks)} />
          <Stat label="Signups" value={String(detail.signups)} />
          <Stat label="Subscribers" value={String(detail.subscribers)} />
          <Stat label="Unpaid" value={formatMoney(detail.balanceCents, detail.currency)} />
        </div>

        <AffiliateDetailForm profile={profile} balanceCents={detail.balanceCents} currency={detail.currency} />

        <section className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white">
          <h2 className="px-4 pt-4 text-sm font-semibold text-zinc-950">Referred players</h2>
          <p className="px-4 pb-3 text-sm text-zinc-500">
            Current deal for new visits: {formatPercent(profile.commission_percent)} for {profile.commission_months} months.
            Players already referred keep the rate from their first visit.
          </p>
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-y border-zinc-200 text-xs uppercase tracking-wide text-zinc-500">
              <tr>
                <th className="px-4 py-3 font-medium">Player</th>
                <th className="px-4 py-3 font-medium">First visit</th>
                <th className="px-4 py-3 font-medium">Window ends</th>
                <th className="px-4 py-3 font-medium">Subscribed</th>
                <th className="px-4 py-3 font-medium">Commission ends</th>
                <th className="px-4 py-3 font-medium">Earned</th>
              </tr>
            </thead>
            <tbody>
              {detail.referrals.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-zinc-500">
                    No signups from this link yet.
                  </td>
                </tr>
              ) : (
                detail.referrals.map((referral) => (
                  <tr key={referral.id} className="border-b border-zinc-100 last:border-0">
                    <td className="px-4 py-3">
                      <div className="font-medium">{referral.name}</div>
                      <div className="text-zinc-500">{referral.email}</div>
                    </td>
                    <td className="px-4 py-3">{formatWhen(referral.firstTouchAt)}</td>
                    <td className="px-4 py-3">{formatWhen(referral.expiresAt)}</td>
                    <td className="px-4 py-3">{referral.subscribedAt ? formatWhen(referral.subscribedAt) : "-"}</td>
                    <td className="px-4 py-3">{referral.commissionEndsAt ? formatWhen(referral.commissionEndsAt) : "-"}</td>
                    <td className="px-4 py-3">{formatMoney(referral.commissionCents, detail.currency)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </section>

        <section className="rounded-2xl border border-zinc-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-zinc-950">Payouts</h2>
          {detail.payouts.length === 0 ? (
            <p className="mt-3 text-sm text-zinc-500">No payouts recorded.</p>
          ) : (
            <ul className="mt-3 divide-y divide-zinc-100 text-sm">
              {detail.payouts.map((payout) => (
                <li key={payout.id} className="flex items-center justify-between py-3">
                  <span>
                    {formatMoney(payout.amount_cents, payout.currency)}
                    {payout.period_label ? `, ${payout.period_label}` : ""}
                    {payout.notes ? `, ${payout.notes}` : ""}
                  </span>
                  <span className="text-zinc-500">{payout.paid_at ? formatWhen(payout.paid_at) : "-"}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4">
      <div className="text-xs uppercase tracking-wide text-zinc-500">{label}</div>
      <div className="mt-1 text-xl font-semibold text-zinc-950">{value}</div>
    </div>
  );
}
