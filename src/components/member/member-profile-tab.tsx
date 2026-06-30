"use client";

import type { MemberHubProfile } from "@/lib/member/load-member-hub-data";
import type { MemberSubscriptionStatus } from "@/lib/member/load-subscription-status";
import { SubscriptionSettings } from "@/components/billing/subscription-settings";

export function MemberProfileTab({
  profile,
  subscription,
  billingSuccess,
}: {
  profile: MemberHubProfile;
  subscription: MemberSubscriptionStatus;
  billingSuccess?: boolean;
}) {
  return (
    <div className="mx-auto max-w-lg space-y-8">
      <SubscriptionSettings subscription={subscription} billingSuccess={billingSuccess} />

      <div>
        <h2 className="text-lg font-semibold text-zinc-900">Profile</h2>
        <p className="mt-1 text-sm text-zinc-600">Details from your account (edit form coming next).</p>
      </div>

      <dl className="divide-y divide-zinc-200 rounded-2xl border border-zinc-200 bg-white shadow-sm">
        {[
          ["Email", profile.email ?? "—"],
          ["Name", profile.full_name?.trim() || "—"],
          ["Padel level", profile.levelName],
          ["Top priority", profile.goalLabel],
          ["Train usually", profile.envLabel],
          ["Padel pains / focus", profile.painsStr],
          ["Birth date", profile.birth_date ?? "—"],
          ["Gender", profile.gender ?? "—"],
        ].map(([k, v]) => (
          <div key={k} className="grid grid-cols-3 gap-2 px-4 py-3 sm:px-5">
            <dt className="text-sm font-medium text-zinc-500">{k}</dt>
            <dd className="col-span-2 text-sm text-zinc-900">{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
