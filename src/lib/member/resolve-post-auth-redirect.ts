import type { SupabaseClient } from "@supabase/supabase-js";

function isSafePath(path: string | null | undefined): path is string {
  const trimmed = path?.trim() ?? "";
  return trimmed.startsWith("/") && !trimmed.startsWith("//");
}

async function hasCompletedOnboarding(
  supabase: SupabaseClient,
  userId: string
): Promise<boolean> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarding_completed_at")
    .eq("id", userId)
    .maybeSingle();

  return Boolean(profile?.onboarding_completed_at);
}

/** Where to send a user right after sign-in or sign-up. */
export async function resolvePostAuthRedirect(
  supabase: SupabaseClient,
  userId: string,
  explicitNext?: string | null
): Promise<string> {
  const completed = await hasCompletedOnboarding(supabase, userId);

  if (!completed) {
    return "/onboarding";
  }

  if (isSafePath(explicitNext)) {
    return explicitNext;
  }

  return "/member";
}
