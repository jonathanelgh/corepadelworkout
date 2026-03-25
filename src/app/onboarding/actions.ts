"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import {
  LEVEL_TO_PADEL_SLUG,
  ONBOARDING_GOAL_SLUGS,
  type OnboardingEnvironment,
  type OnboardingGoal,
  type OnboardingLevel,
  type PainKey,
  isPainKey,
  normalizePainSelection,
} from "@/lib/member/onboarding";

export type OnboardingPayload = {
  displayName: string;
  level: OnboardingLevel;
  pains: PainKey[];
  goal: OnboardingGoal;
  environments: OnboardingEnvironment[];
  /** When set, must match the signed-in user's email (magic-link sign-up flow). */
  signupEmail?: string;
};

export async function completeOnboarding(
  payload: OnboardingPayload,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const name = payload.displayName.trim();
  if (name.length < 1 || name.length > 80) {
    return { ok: false, message: "Please enter your name (1–80 characters)." };
  }

  if (!(payload.level in LEVEL_TO_PADEL_SLUG)) {
    return { ok: false, message: "Invalid level." };
  }

  const painsIn = payload.pains.filter(isPainKey);
  const pains = normalizePainSelection(painsIn);
  if (pains.length === 0) {
    return { ok: false, message: "Pick at least one option for how you feel." };
  }

  if (!ONBOARDING_GOAL_SLUGS.includes(payload.goal)) {
    return { ok: false, message: "Invalid goal." };
  }

  const envs: OnboardingEnvironment[] = ["gym", "home", "club"];
  const environments = [...new Set(payload.environments)].filter((v): v is OnboardingEnvironment => envs.includes(v));
  if (environments.length === 0) {
    return { ok: false, message: "Invalid training location." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, message: "You need to be signed in." };
  }

  if (payload.signupEmail) {
    const a = user.email?.trim().toLowerCase() ?? "";
    const b = payload.signupEmail.trim().toLowerCase();
    if (!a || a !== b) {
      return {
        ok: false,
        message: "Sign in with the same email you used for the magic link to finish setup.",
      };
    }
  }

  const slug = LEVEL_TO_PADEL_SLUG[payload.level];
  const { data: levelRow, error: levelErr } = await supabase
    .from("padel_levels")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  if (levelErr || !levelRow?.id) {
    return { ok: false, message: "Could not load skill levels. Try again later." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: name,
      padel_level_id: levelRow.id,
      padel_pains: pains,
      primary_goal: payload.goal,
      training_environment: environments[0],
      training_environments: environments,
      onboarding_completed_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) {
    console.error("onboarding update", error);
    return { ok: false, message: error.message || "Could not save your profile." };
  }

  revalidatePath("/member", "layout");
  revalidatePath("/onboarding");
  return { ok: true };
}
