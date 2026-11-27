import Link from "next/link";
import { BrandWordmark } from "@/components/brand/brand-wordmark";
import { redirect } from "next/navigation";
import { Check } from "lucide-react";
import { SubscribeButton } from "@/components/billing/subscribe-button";
import { proMonthlyPriceLabel } from "@/lib/billing/format-subscription-price";
import { PRO_TRIAL_DAYS, userEligibleForProTrial } from "@/lib/billing/pro-trial";
import { userHasAffiliateAccount } from "@/lib/affiliates/tracking";
import { getHasActivePro } from "@/lib/member/has-active-pro";
import { resolvePostAuthRedirect } from "@/lib/member/resolve-post-auth-redirect";
import { PRO_PLAN_SLUG } from "@/lib/stripe/config";
import { createClient } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";

const perks = [
  "Every training program",
  "Exercise library",
  "AI Coach",
];

export default async function SubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ canceled?: string }>;
}) {
  const sp = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/signup?next=${encodeURIComponent("/subscribe")}`);
  }

  if (await userHasAffiliateAccount(supabase, user.id)) {
    redirect("/affiliate");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarding_completed_at")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.onboarding_completed_at) {
    redirect("/onboarding");
  }

  if (await getHasActivePro(supabase, user.id)) {
    redirect(await resolvePostAuthRedirect(supabase, user.id));
  }

  const trialEligible = await userEligibleForProTrial(user.id);
  const { data: plan } = await supabase
    .from("subscription_plans")
    .select("name, price_amount, currency, interval")
    .eq("slug", PRO_PLAN_SLUG)
    .eq("active", true)
    .maybeSingle();
  const priceLabel = proMonthlyPriceLabel(plan);

  return (
    <div className="min-h-dvh bg-zinc-50 text-zinc-900">
      <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col px-4 py-8">
        <Link href="/" className="inline-flex">
          <BrandWordmark />
        </Link>

        <main className="flex flex-1 flex-col justify-center py-10">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">Pro membership</p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight">
            {trialEligible ? `${PRO_TRIAL_DAYS} days free, then Pro` : "Continue with Pro"}
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-zinc-600">
            {trialEligible
              ? `Core Padel is included with Pro. Add a card to start a ${PRO_TRIAL_DAYS}-day trial. You are charged ${priceLabel} after the trial unless you cancel.`
              : `Core Padel requires Pro. Subscribe for ${priceLabel}. Your card is charged today.`}
          </p>

          {sp.canceled === "1" && (
            <p className="mt-4 rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-700">
              Checkout was canceled. You can start whenever you are ready.
            </p>
          )}

          <div className="mt-8 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <p className="text-2xl font-bold tabular-nums">{trialEligible ? `${PRO_TRIAL_DAYS} days free` : priceLabel}</p>
            <p className="mt-1 text-sm text-zinc-500">
              {trialEligible ? `Then ${priceLabel}` : "Billed monthly"}
            </p>
            <ul className="mt-6 space-y-3">
              {[...perks, trialEligible ? "Cancel any time before the trial ends" : "Cancel any time from your profile"].map((perk) => (
                <li key={perk} className="flex gap-2 text-sm text-zinc-700">
                  <Check className="h-4 w-4 shrink-0 text-emerald-600" />
                  {perk}
                </li>
              ))}
            </ul>
            <SubscribeButton className="mt-8 w-full rounded-xl bg-zinc-900 py-3.5 text-sm font-semibold text-white hover:bg-zinc-800">
              {trialEligible ? `Start ${PRO_TRIAL_DAYS}-day trial` : "Subscribe with Stripe"}
            </SubscribeButton>
            <p className="mt-3 text-center text-xs text-zinc-500">
              {trialEligible
                ? "Secure checkout by Stripe. Cancel from your profile before the trial ends and you will not be charged."
                : "Secure checkout by Stripe. Manage billing anytime from your profile."}
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
