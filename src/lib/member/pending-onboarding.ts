import type { OnboardingEnvironment, OnboardingGoal, OnboardingLevel, PainKey } from "@/lib/member/onboarding";

export const PENDING_ONBOARDING_STORAGE_KEY = "corepadel_pending_onboarding_v1";

export type PendingOnboardingV1 = {
  v: 1;
  displayName: string;
  level: OnboardingLevel;
  pains: PainKey[];
  goal: OnboardingGoal;
  environments: OnboardingEnvironment[];
  signupEmail: string;
};
