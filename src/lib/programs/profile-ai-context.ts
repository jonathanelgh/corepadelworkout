import type { SupabaseClient } from "@supabase/supabase-js";
import {
  PRIMARY_GOAL_LABELS,
  isOnboardingGoal,
  workoutStructureLevelFromPadelSlug,
  type OnboardingLevel,
} from "@/lib/member/onboarding";

const ENV_LABELS: Record<string, string> = {
  gym: "At the gym",
  home: "At home",
  club: "At the club / court",
};

const PAIN_LABELS: Record<string, string> = {
  padel_elbow: "Padel elbow",
  jumpers_knee: "Jumper's knee",
  lower_back: "Lower back",
  plantar_fasciitis: "Heel / plantar fasciitis",
  none: "None",
};

const GENDER_LABELS: Record<string, string> = {
  male: "Male",
  female: "Female",
  other: "Other",
};

function birthYear(birthDate: string | null | undefined): string | null {
  if (!birthDate) return null;
  const y = birthDate.slice(0, 4);
  return /^\d{4}$/.test(y) ? y : null;
}

function trainingEnvironmentLabel(
  trainingEnvironments: string[] | null | undefined,
  trainingEnvironment: string | null | undefined
): string | null {
  const envs =
    trainingEnvironments && trainingEnvironments.length > 0
      ? trainingEnvironments
      : trainingEnvironment
        ? [trainingEnvironment]
        : [];
  if (envs.length === 0) return null;
  const labels = envs.map((e) => ENV_LABELS[e] ?? e);
  return `${labels.join(", ")} (choose exercises and equipment appropriate for this setting)`;
}

const STRUCTURE_LEVEL_LABELS: Record<OnboardingLevel, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

export const TRAINING_LEVEL_OPTIONS: { id: OnboardingLevel; label: string }[] = [
  { id: "beginner", label: "Beginner" },
  { id: "intermediate", label: "Intermediate" },
  { id: "advanced", label: "Advanced" },
];

export function isOnboardingLevel(v: string | null | undefined): v is OnboardingLevel {
  return v === "beginner" || v === "intermediate" || v === "advanced";
}

export function formatWorkoutStructureLevelContext(
  level: OnboardingLevel,
  source: "onboarding" | "admin"
): string {
  const label = STRUCTURE_LEVEL_LABELS[level];
  const prefix =
    source === "admin"
      ? `Training level (admin): ${level}`
      : `Onboarding level: ${level}`;
  return `${prefix} — use Mandatory workout structure — ${label.toUpperCase()} and the matching level engine from Core Padel methodology`;
}

function stripStructureLevelLines(text: string): string {
  return text
    .split("\n")
    .filter(
      (line) =>
        !line.startsWith("Onboarding level:") && !line.startsWith("Training level (admin):")
    )
    .join("\n")
    .trim();
}

/** Admin AI coach: optional level override; auto uses member onboarding when profile is present. */
export function buildAdminAiAthleteContext(
  profileContext: string | null | undefined,
  adminTrainingLevel: OnboardingLevel | null | undefined
): string {
  let profile = profileContext?.trim() ?? "";

  if (adminTrainingLevel) {
    profile = stripStructureLevelLines(profile);
    const levelLine = formatWorkoutStructureLevelContext(adminTrainingLevel, "admin");
    profile = profile ? `${profile}\n${levelLine}` : levelLine;
  }

  return userContextBlock(profile || null);
}

/** Member AI coach: always uses the signed-in user's onboarding level from their profile. */
export function buildMemberAiAthleteContext(profileContext: string | null | undefined): string {
  return userContextBlock(profileContext);
}

export function formatProfileForAiContext(profile: {
  full_name: string | null;
  gender: string | null;
  birth_date: string | null;
  padel_levels?: { name: string; slug?: string } | { name: string; slug?: string }[] | null;
  padel_pains: string[] | null;
  primary_goal: string | null;
  training_environment: string | null;
  training_environments: string[] | null;
}): string {
  const levelRel = profile.padel_levels;
  const levelRow = Array.isArray(levelRel) ? levelRel[0] : levelRel;
  const levelName =
    levelRow && typeof levelRow === "object" && "name" in levelRow ? levelRow.name : null;
  const levelSlug =
    levelRow && typeof levelRow === "object" && "slug" in levelRow
      ? (levelRow.slug as string | undefined)
      : undefined;
  const structureLevel = workoutStructureLevelFromPadelSlug(levelSlug);

  const pains =
    profile.padel_pains && profile.padel_pains.length > 0
      ? profile.padel_pains.map((p) => PAIN_LABELS[p] ?? p).join(", ")
      : "None";

  const goal =
    profile.primary_goal && isOnboardingGoal(profile.primary_goal)
      ? PRIMARY_GOAL_LABELS[profile.primary_goal]
      : null;

  const env = trainingEnvironmentLabel(
    profile.training_environments,
    profile.training_environment
  );

  const lines: string[] = [];
  const name = profile.full_name?.trim();
  if (name) lines.push(`Name: ${name}`);
  if (profile.gender) lines.push(`Gender: ${GENDER_LABELS[profile.gender] ?? profile.gender}`);
  const year = birthYear(profile.birth_date);
  if (year) lines.push(`Birth Year: ${year}`);
  if (levelName) lines.push(`Padel Level: ${levelName}`);
  if (structureLevel) {
    lines.push(formatWorkoutStructureLevelContext(structureLevel, "onboarding"));
  }
  lines.push(`Current Pains/Injuries: ${pains}`);
  if (goal) lines.push(`Goals: ${goal}`);
  if (env) lines.push(`Preferred Workout Environment: ${env}`);

  return lines.join("\n");
}

export async function loadProfileAiContext(
  supabase: SupabaseClient,
  userId: string
): Promise<string | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select(
      `
      full_name,
      gender,
      birth_date,
      padel_pains,
      primary_goal,
      training_environment,
      training_environments,
      padel_levels ( name, slug )
    `
    )
    .eq("id", userId)
    .maybeSingle();

  if (error || !data) return null;

  const text = formatProfileForAiContext({
    full_name: data.full_name as string | null,
    gender: data.gender as string | null,
    birth_date: data.birth_date as string | null,
    padel_levels: data.padel_levels as
      | { name: string; slug?: string }
      | { name: string; slug?: string }[]
      | null,
    padel_pains: (data.padel_pains as string[] | null) ?? null,
    primary_goal: data.primary_goal as string | null,
    training_environment: data.training_environment as string | null,
    training_environments: (data.training_environments as string[] | null) ?? null,
  });

  return text.trim() || null;
}

export type MemberPickerOption = {
  id: string;
  label: string;
  email: string | null;
};

export async function listMembersForAiPicker(
  supabase: SupabaseClient,
  limit = 200
): Promise<MemberPickerOption[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .order("full_name", { ascending: true, nullsFirst: false })
    .limit(limit);

  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => {
    const name = (row.full_name as string | null)?.trim();
    const email = (row.email as string | null)?.trim() || null;
    const label = name || email || (row.id as string).slice(0, 8);
    return { id: row.id as string, label, email };
  });
}

export function userContextBlock(userContext: string | null | undefined): string {
  if (!userContext?.trim()) return "";
  return `\n## Athlete profile\n${userContext.trim()}\n`;
}
