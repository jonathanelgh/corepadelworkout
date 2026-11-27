import { redirect } from "next/navigation";
import { getHasActivePro } from "@/lib/member/has-active-pro";
import { createClient, getRequestUser } from "@/utils/supabase/server";

export default async function MemberLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const user = await getRequestUser();

  if (!user) {
    redirect(`/login?next=${encodeURIComponent("/member")}`);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarding_completed_at")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.onboarding_completed_at) {
    redirect("/onboarding");
  }

  if (!(await getHasActivePro(supabase, user.id))) {
    redirect("/subscribe");
  }

  return children;
}
