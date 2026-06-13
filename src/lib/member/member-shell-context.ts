import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

export type MemberShellProfile = {
  full_name: string | null;
  email: string | null;
  profile_image_url: string | null;
};

export async function getMemberShellContext(): Promise<{
  userEmail: string | null;
  profile: MemberShellProfile | null;
}> {
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

  return {
    userEmail: user.email ?? profile?.email ?? null,
    profile: profile
      ? {
          full_name: profile.full_name,
          email: profile.email,
          profile_image_url: profile.profile_image_url,
        }
      : null,
  };
}
