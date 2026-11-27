import type { SupabaseClient } from "@supabase/supabase-js";
import { userHasAffiliateAccount } from "@/lib/affiliates/tracking";
import { getHasActivePro } from "@/lib/member/has-active-pro";
import { isCourtWarmupFunnelPath } from "@/lib/programs/court-warmup-funnel";

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
  if (await userHasAffiliateAccount(supabase, userId)) {
    return "/affiliate";
  }

  const completed = await hasCompletedOnboarding(supabase, userId);
  if (!completed) {
    return "/onboarding";
  }

  if (!(await getHasActivePro(supabase, userId))) {
    return "/subscribe";
  }

  // Warm-up funnel: send them into the program once onboarding and Pro are done.
  if (isSafePath(explicitNext) && isCourtWarmupFunnelPath(explicitNext)) {
    return explicitNext;
  }

  if (isSafePath(explicitNext)) {
    return explicitNext;
  }

  return "/member";
}
