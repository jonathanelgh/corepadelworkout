import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { OnboardingFlow } from "./onboarding-flow";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let initialName = "";
  const isAuthenticated = Boolean(user);

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, onboarding_completed_at")
      .eq("id", user.id)
      .maybeSingle();

    if (profile?.onboarding_completed_at) {
      redirect("/member");
    }

    initialName = profile?.full_name?.trim() ?? "";
  }

  return (
    <OnboardingFlow
      isAuthenticated={isAuthenticated}
      initialName={initialName}
      initialEmail={user?.email ?? ""}
    />
  );
}
