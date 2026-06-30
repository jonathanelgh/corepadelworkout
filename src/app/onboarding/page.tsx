import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { OnboardingFlow } from "./onboarding-flow";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/signup");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, onboarding_completed_at")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.onboarding_completed_at) {
    redirect("/member");
  }

  const metaName =
    typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name.trim() : "";
  const initialName = profile?.full_name?.trim() || metaName;

  return (
    <OnboardingFlow initialName={initialName} initialEmail={user.email ?? ""} />
  );
}
