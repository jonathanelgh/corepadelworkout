import { createClient } from "@/utils/supabase/server";
import { loadMemberHubData } from "@/lib/member/load-member-hub-data";
import { getMemberShellContext } from "@/lib/member/member-shell-context";
import { tabFromSearchParam } from "@/lib/member/member-tabs";
import { MemberHubLoader } from "@/components/member/member-hub-loader";

export const dynamic = "force-dynamic";

type PageSearch = Promise<{ tab?: string; billing?: string }>;

export default async function MemberHubPage({ searchParams }: { searchParams: PageSearch }) {
  const sp = await searchParams;
  const { userEmail, profile } = await getMemberShellContext();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const hubData = await loadMemberHubData(supabase, user.id, userEmail);
  const initialTab = tabFromSearchParam(sp.tab);
  const billingSuccess = sp.billing === "success";

  return (
    <MemberHubLoader
      hubData={hubData}
      initialTab={initialTab}
      userEmail={userEmail}
      profile={profile}
      billingSuccess={billingSuccess}
    />
  );
}
