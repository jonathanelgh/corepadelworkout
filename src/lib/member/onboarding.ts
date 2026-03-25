export const LEVEL_TO_PADEL_SLUG = {
  beginner: "padel-beginner",
  intermediate: "padel-intermediate",
  advanced: "padel-advanced",
} as const;

export type OnboardingLevel = keyof typeof LEVEL_TO_PADEL_SLUG;

export const ONBOARDING_GOAL_SLUGS = [
  "power",
  "speed",
  "longevity",
  "overall_fitness",
  "stamina",
  "match_play",
  "injury_recovery",
  "consistency",
  "technique",
] as const;

export type OnboardingGoal = (typeof ONBOARDING_GOAL_SLUGS)[number];

const GOAL_SET = new Set<string>(ONBOARDING_GOAL_SLUGS);

export function isOnboardingGoal(v: string): v is OnboardingGoal {
  return GOAL_SET.has(v);
}

export const PRIMARY_GOAL_LABELS: Record<OnboardingGoal, string> = {
  power: "Power",
  speed: "Speed",
  longevity: "Longevity",
  overall_fitness: "Overall fitness",
  stamina: "Stamina",
  match_play: "Match play",
  injury_recovery: "Return from injury",
  consistency: "Consistency",
  technique: "Technique",
};

export type OnboardingEnvironment = "gym" | "home" | "club";

export const PAIN_KEYS = ["padel_elbow", "jumpers_knee", "lower_back", "plantar_fasciitis", "none"] as const;
export type PainKey = (typeof PAIN_KEYS)[number];

const PAIN_SET = new Set<string>(PAIN_KEYS);

export function normalizePainSelection(selected: PainKey[]): PainKey[] {
  if (selected.includes("none")) return ["none"];
  const uniq = [...new Set(selected)].filter((p): p is PainKey => p !== "none");
  return uniq;
}

export function isPainKey(v: string): v is PainKey {
  return PAIN_SET.has(v);
}
