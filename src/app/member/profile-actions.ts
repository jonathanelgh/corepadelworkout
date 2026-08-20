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
  coercePainKeys,
} from "@/lib/member/onboarding";

export type UpdateMemberProfilePayload = {
  displayName: string;
  level: OnboardingLevel | null;
  pains: PainKey[];
  goal: OnboardingGoal | null;
  environments: OnboardingEnvironment[];
};

export async function updateMemberProfile(
  payload: UpdateMemberProfilePayload,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const name = payload.displayName.trim();
  if (name.length > 80) {
    return { ok: false, message: "Name must be 80 characters or fewer." };
  }

  if (payload.level != null && !(payload.level in LEVEL_TO_PADEL_SLUG)) {
    return { ok: false, message: "Invalid level." };
  }

  const pains = coercePainKeys(payload.pains);

  let goal: OnboardingGoal | null = null;
  if (payload.goal != null) {
    if (!ONBOARDING_GOAL_SLUGS.includes(payload.goal)) {
      return { ok: false, message: "Invalid goal." };
    }
    goal = payload.goal;
  }

  const envOptions: OnboardingEnvironment[] = ["gym", "home", "club"];
  const environments = [...new Set(payload.environments)].filter((v): v is OnboardingEnvironment =>
    envOptions.includes(v),
  );

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, message: "You need to be signed in." };
  }

  let padelLevelId: string | null = null;
  if (payload.level != null) {
    const slug = LEVEL_TO_PADEL_SLUG[payload.level];
    const { data: levelRow, error: levelErr } = await supabase
      .from("padel_levels")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();
    if (levelErr || !levelRow?.id) {
      return { ok: false, message: "Could not load skill levels. Try again later." };
    }
    padelLevelId = levelRow.id;
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: name.length > 0 ? name : null,
      padel_level_id: padelLevelId,
      padel_pains: pains,
      primary_goal: goal,
      training_environment: environments[0] ?? null,
      training_environments: environments,
    })
    .eq("id", user.id);

  if (error) {
    console.error("profile update", error);
    return { ok: false, message: error.message || "Could not save your profile." };
  }

  revalidatePath("/member", "layout");
  return { ok: true };
}
