import Link from "next/link";
import { Crown, Check } from "lucide-react";
import type { MemberSubscriptionStatus } from "@/lib/member/load-subscription-status";
import { PromoDiscountBannerView } from "@/components/billing/promo-discount-banner";
import { ManageSubscriptionButton } from "@/components/billing/manage-subscription-button";
import { SubscribeButton } from "@/components/billing/subscribe-button";

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
}

export function SubscriptionSettings({
  subscription,
  billingSuccess,
  promoCode,
}: {
  subscription: MemberSubscriptionStatus;
  billingSuccess?: boolean;
  promoCode?: string | null;
}) {
  const { hasActivePro, planName, status, currentPeriodEnd, cancelAtPeriodEnd } = subscription;
  const isAdminPro = planName === "Admin";

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-zinc-900">Subscription</h2>
        <p className="mt-1 text-sm text-zinc-600">
          Pro unlocks paid programs, the exercise library, and AI Coach features.
        </p>
      </div>

      {billingSuccess && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          Thanks — your subscription is being activated. It may take a moment to appear here.
        </div>
      )}

      {!hasActivePro && promoCode && <PromoDiscountBannerView promoCode={promoCode} />}

      <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-600">
            <Crown className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            {hasActivePro ? (
              <>
                <p className="font-semibold text-zinc-900">{planName ?? "Pro"} — active</p>
                <p className="mt-1 text-sm text-zinc-600">
                  {isAdminPro
                    ? "Full Pro access included with your admin account."
                    : cancelAtPeriodEnd
                      ? `Access until ${formatDate(currentPeriodEnd)} (canceled, won’t renew)`
                      : `Renews on ${formatDate(currentPeriodEnd)}`}
                </p>
                {status && status !== "active" && (
                  <p className="mt-1 text-xs text-amber-700">Status: {status}</p>
                )}
              </>
            ) : (
              <>
                <p className="font-semibold text-zinc-900">No active Pro subscription</p>
                <p className="mt-1 text-sm text-zinc-600">
                  Free programs stay available. Upgrade for the full library and member tools.
                </p>
              </>
            )}
          </div>
        </div>

        <ul className="mt-5 space-y-2 border-t border-zinc-100 pt-5">
          {[
            "All paid training programs",
            "Exercise library",
            "AI Coach",
          ].map((perk) => (
            <li key={perk} className="flex gap-2 text-sm text-zinc-700">
              <Check className="h-4 w-4 shrink-0 text-emerald-600" />
              {perk}
            </li>
          ))}
        </ul>

        <div className="mt-6 flex flex-wrap gap-3">
          {hasActivePro && !isAdminPro ? (
            <ManageSubscriptionButton className="rounded-xl bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800">
              Manage subscription
            </ManageSubscriptionButton>
          ) : !hasActivePro ? (
            <SubscribeButton className="rounded-xl bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800">
              Subscribe to Pro
            </SubscribeButton>
          ) : null}
          <Link
            href="/member/exercises"
            className="rounded-xl border border-zinc-200 px-5 py-2.5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50"
          >
            Exercise library
          </Link>
          <Link
            href="/member/upgrade"
            className="rounded-xl border border-zinc-200 px-5 py-2.5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50"
          >
            View plans
          </Link>
        </div>
      </div>
    </div>
  );
}
