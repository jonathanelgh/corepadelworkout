"use client";

import dynamic from "next/dynamic";
import type { MemberHubData } from "@/lib/member/load-member-hub-data";
import type { MemberShellProfile } from "@/lib/member/member-shell-context";
import type { MemberTab } from "@/lib/member/member-tabs";
import { MemberShellSkeleton } from "@/components/member/member-shell-skeleton";

const MemberAppShell = dynamic(
  () => import("@/components/member/member-app-shell").then((m) => m.MemberAppShell),
  { ssr: false, loading: () => <MemberShellSkeleton /> }
);

export function MemberHubLoader({
  hubData,
  initialTab,
  userEmail,
  profile,
  billingSuccess,
}: {
  hubData: MemberHubData;
  initialTab: MemberTab;
  userEmail: string | null;
  profile: MemberShellProfile | null;
  billingSuccess?: boolean;
}) {
  return (
    <MemberAppShell
      hubData={hubData}
      initialTab={initialTab}
      userEmail={userEmail}
      profile={profile}
      billingSuccess={billingSuccess}
    />
  );
}
