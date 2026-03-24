import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { MemberAppShell } from "@/components/member/member-app-shell";

export default async function MemberLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=${encodeURIComponent("/member")}`);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email, profile_image_url")
    .eq("id", user.id)
    .maybeSingle();

  const email = user.email ?? profile?.email ?? null;

  return (
    <MemberAppShell userEmail={email} profile={profile}>
      {children}
    </MemberAppShell>
  );
}
