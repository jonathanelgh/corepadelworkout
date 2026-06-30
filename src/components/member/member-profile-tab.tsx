"use client";

import { useState } from "react";
import { ChevronRight, Pencil } from "lucide-react";
import type { MemberHubProfile } from "@/lib/member/load-member-hub-data";
import type { MemberSubscriptionStatus } from "@/lib/member/load-subscription-status";
import { SubscriptionSettings } from "@/components/billing/subscription-settings";
import { ProfileEditSheet } from "@/components/member/profile-edit-sheet";

export function MemberProfileTab({
  profile,
  subscription,
  billingSuccess,
}: {
  profile: MemberHubProfile;
  subscription: MemberSubscriptionStatus;
  billingSuccess?: boolean;
}) {
  const [editOpen, setEditOpen] = useState(false);

  const rows: [string, string][] = [
    ["Email", profile.email ?? "—"],
    ["Name", profile.full_name?.trim() || "—"],
    ["Padel level", profile.levelName],
    ["Top priority", profile.goalLabel],
    ["Train usually", profile.envLabel],
    ["Padel pains / focus", profile.painsStr],
    ["Birth date", profile.birth_date ?? "—"],
    ["Gender", profile.gender ?? "—"],
  ];

  return (
    <div className="mx-auto max-w-lg space-y-8">
      <SubscriptionSettings subscription={subscription} billingSuccess={billingSuccess} />

      <div>
        <h2 className="text-lg font-semibold text-zinc-900">Profile</h2>
        <p className="mt-1 text-sm text-zinc-600">Your account details and training preferences.</p>
      </div>

      <button
        type="button"
        onClick={() => setEditOpen(true)}
        className="group w-full rounded-2xl border border-zinc-200 bg-white text-left shadow-sm transition hover:border-zinc-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ccff00]/50"
      >
        <div className="flex items-center justify-between gap-3 border-b border-zinc-100 px-4 py-3 sm:px-5">
          <div>
            <p className="text-sm font-semibold text-zinc-900">Training profile</p>
            <p className="text-xs text-zinc-500">Tap to edit name, level, goals, and more</p>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-3 py-1.5 text-xs font-semibold text-zinc-700 transition group-hover:bg-[#ccff00]/30">
            <Pencil className="h-3.5 w-3.5" />
            Edit
            <ChevronRight className="h-3.5 w-3.5" />
          </span>
        </div>
        <dl className="divide-y divide-zinc-100">
          {rows.map(([k, v]) => (
            <div key={k} className="grid grid-cols-3 gap-2 px-4 py-3 sm:px-5">
              <dt className="text-sm font-medium text-zinc-500">{k}</dt>
              <dd className="col-span-2 text-sm text-zinc-900">{v}</dd>
            </div>
          ))}
        </dl>
      </button>

      <ProfileEditSheet open={editOpen} profile={profile} onClose={() => setEditOpen(false)} />
    </div>
  );
}
