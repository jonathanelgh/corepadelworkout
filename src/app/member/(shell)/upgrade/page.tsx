import Link from "next/link";
import { Crown, Check } from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import { getMemberShellContext } from "@/lib/member/member-shell-context";
import { loadMemberSubscriptionStatus } from "@/lib/member/load-subscription-status";
import { MemberAppShell } from "@/components/member/member-app-shell";
import { SubscribeButton } from "@/components/billing/subscribe-button";
import { ManageSubscriptionButton } from "@/components/billing/manage-subscription-button";

const perks = [
  "All paid training programs",
  "Exercise library",
  "AI Coach",
  "Cancel any time from your profile",
];

export default async function MemberUpgradePage({
  searchParams,
}: {
  searchParams: Promise<{ canceled?: string }>;
}) {
  const sp = await searchParams;
  const { userEmail, profile } = await getMemberShellContext();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const subscription = user
    ? await loadMemberSubscriptionStatus(supabase, user.id)
    : {
        hasActivePro: false,
        planName: null,
        status: null,
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
        hasStripeCustomer: false,
      };

  const { data: plan } = await supabase
    .from("subscription_plans")
    .select("name, description, price_amount, currency, interval")
    .eq("slug", "pro-monthly")
    .eq("active", true)
    .maybeSingle();

  const priceLabel =
    plan?.price_amount != null
      ? `€${Number(plan.price_amount).toFixed(0)} / ${plan.interval === "year" ? "year" : "month"}`
      : "Pro monthly";

  return (
    <MemberAppShell userEmail={userEmail} profile={profile}>
      <div className="mx-auto max-w-lg space-y-8">
        <div>
          <Link href="/member" className="text-sm font-medium text-emerald-700 hover:text-emerald-800">
            ← Back to dashboard
          </Link>
          <h1 className="mt-4 text-2xl font-bold text-zinc-900">Pro membership</h1>
          <p className="mt-2 text-sm text-zinc-600">
            One subscription for paid programs, the exercise library, and AI Coach.
          </p>
        </div>

        {sp.canceled === "1" && (
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-700">
            Checkout canceled — you can subscribe whenever you&apos;re ready.
          </div>
        )}

        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2 text-zinc-900">
            <Crown className="h-6 w-6 text-amber-500" />
            <span className="text-lg font-bold">{plan?.name ?? "Pro"}</span>
          </div>
          <p className="text-2xl font-bold tabular-nums text-zinc-900">{priceLabel}</p>
          {plan?.description && <p className="mt-2 text-sm text-zinc-600">{plan.description}</p>}
          <ul className="mt-6 space-y-3">
            {perks.map((t) => (
              <li key={t} className="flex gap-2 text-sm text-zinc-700">
                <Check className="h-4 w-4 shrink-0 text-emerald-600" />
                {t}
              </li>
            ))}
          </ul>

          {subscription.hasActivePro ? (
            <ManageSubscriptionButton className="mt-8 w-full rounded-xl bg-zinc-900 py-3 text-sm font-semibold text-white hover:bg-zinc-800">
              Manage subscription
            </ManageSubscriptionButton>
          ) : (
            <SubscribeButton className="mt-8 w-full rounded-xl bg-zinc-900 py-3 text-sm font-semibold text-white hover:bg-zinc-800">
              Subscribe with Stripe
            </SubscribeButton>
          )}

          <p className="mt-3 text-center text-xs text-zinc-500">
            Secure checkout by Stripe. Manage billing anytime under Profile → Subscription.
          </p>
        </div>
      </div>
    </MemberAppShell>
  );
}
