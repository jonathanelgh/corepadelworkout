import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { MemberAppShell } from "@/components/member/member-app-shell";

export default async function MemberShellLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=${encodeURIComponent("/member")}`);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email, profile_image_url, onboarding_completed_at")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.onboarding_completed_at) {
    redirect("/onboarding");
  }

  const email = user.email ?? profile?.email ?? null;

  return (
    <MemberAppShell
      userEmail={email}
      profile={
        profile
          ? {
              full_name: profile.full_name,
              email: profile.email,
              profile_image_url: profile.profile_image_url,
            }
          : null
      }
    >
      {children}
    </MemberAppShell>
  );
}
