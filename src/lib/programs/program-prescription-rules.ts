import type { ExerciseCatalogEntry } from "@/lib/programs/exercise-catalog";
import type { OnboardingLevel } from "@/lib/member/onboarding";
import type { WorkoutProposalExercise } from "@/lib/programs/ai-coach-gemini";

export const COOLDOWN_DURATION_SECONDS = 60;
export const COOLDOWN_REST_AFTER_SECONDS = 15;
export const MIN_COOLDOWN_EXERCISES_PER_SESSION = 5;

export const BEGINNER_MAIN_REST_SECONDS_MIN = 30;
export const BEGINNER_MAIN_REST_SECONDS_MAX = 45;
export const ADVANCED_MAIN_REST_SECONDS_MIN = 60;
export const ADVANCED_MAIN_REST_SECONDS_MAX = 90;

const STRENGTH_TYPE_HINTS = ["strength", "hypertrofy", "hypertrophy", "maximal", "plyometric"];
const AGILITY_FOOTWORK_STRENGTH_REST_TYPES = ["strength", "agility", "footwork"];

function normalizeToken(value: string): string {
  return value.trim().toLowerCase().replace(/[_\s]+/g, "-");
}

function blob(entry: ExerciseCatalogEntry): string {
  return [
    entry.title,
    ...entry.categoryTypes,
    ...entry.movementPatterns,
    ...entry.bodyRegions,
    ...entry.bodyParts,
  ]
    .join(" ")
    .toLowerCase();
}

export function catalogEntryHasTag(entry: ExerciseCatalogEntry, tag: string): boolean {
  const needle = normalizeToken(tag);
  const haystack = [
    ...entry.categoryTypes,
    ...entry.bodyRegions,
    ...entry.bodyParts,
    ...entry.movementPatterns,
  ].map(normalizeToken);
  if (haystack.some((t) => t === needle || t.includes(needle))) return true;
  if (needle === "core") {
    return haystack.some((t) => t === "core" || t === "abdomen" || t.includes("core"));
  }
  return blob(entry).includes(needle);
}

export function exerciseIsStrength(entry: ExerciseCatalogEntry): boolean {
  if (entry.programPrescriptionMode === "sets_reps_only") return true;
  return entry.categoryTypes.some((t) => {
    const n = normalizeToken(t);
    return STRENGTH_TYPE_HINTS.some((hint) => n.includes(hint));
  });
}

export function exerciseNeedsMainBlockRest(entry: ExerciseCatalogEntry): boolean {
  return entry.categoryTypes.some((t) => {
    const n = normalizeToken(t);
    return AGILITY_FOOTWORK_STRENGTH_REST_TYPES.some((hint) => n.includes(hint));
  });
}

export function exerciseIsHighIntensityStart(entry: ExerciseCatalogEntry): boolean {
  const text = blob(entry);
  if (/\bsprint\b/.test(text)) return true;
  if (/\bshuffle\b/.test(text)) return true;
  if (/\bjump\b/.test(text) || /\bplyometric\b/.test(text)) return true;
  return entry.categoryTypes.some((t) => {
    const n = normalizeToken(t);
    return n.includes("plyometric") || n.includes("explosive");
  });
}

export function clampMainRestSeconds(seconds: number, level: OnboardingLevel): number {
  const min =
    level === "beginner" ? BEGINNER_MAIN_REST_SECONDS_MIN : ADVANCED_MAIN_REST_SECONDS_MIN;
  const max =
    level === "beginner" ? BEGINNER_MAIN_REST_SECONDS_MAX : ADVANCED_MAIN_REST_SECONDS_MAX;
  return Math.min(max, Math.max(min, Math.round(seconds)));
}

export function defaultMainRestAfterSeconds(level: OnboardingLevel): number {
  return level === "beginner" ? 37 : 75;
}

export function defaultStrengthSetsReps(): Pick<WorkoutProposalExercise, "sets" | "reps"> {
  return { sets: 3, reps: 10 };
}

export type RehabFocus =
  | "elbow"
  | "wrist"
  | "shoulder"
  | "knee"
  | "ankle"
  | "hip"
  | "lower-back"
  | "upper-back";

const KINETIC_CHAIN_PARTS: Record<RehabFocus, string[]> = {
  elbow: ["wrist", "elbow", "shoulder", "upper-back"],
  wrist: ["wrist", "elbow", "shoulder", "upper-back"],
  shoulder: ["shoulder", "upper-back", "elbow", "wrist"],
  knee: ["ankle", "knee", "hip"],
  ankle: ["ankle", "knee", "hip"],
  hip: ["hip", "knee", "lower-back"],
  "lower-back": ["lower-back", "hip", "abdomen", "upper-back"],
  "upper-back": ["upper-back", "shoulder", "elbow"],
};

const REHAB_KEYWORDS: { focus: RehabFocus; pattern: RegExp }[] = [
  { focus: "elbow", pattern: /\b(padel elbow|tennis elbow|elbow)\b/i },
  { focus: "wrist", pattern: /\bwrist\b/i },
  { focus: "shoulder", pattern: /\bshoulder\b/i },
  { focus: "knee", pattern: /\b(jumper'?s knee|patella|knee)\b/i },
  { focus: "ankle", pattern: /\b(ankle|plantar|achilles)\b/i },
  { focus: "hip", pattern: /\bhip\b/i },
  { focus: "lower-back", pattern: /\b(lower back|lumbar)\b/i },
  { focus: "upper-back", pattern: /\b(upper back|thoracic)\b/i },
];

export function detectRehabFocus(text: string | null | undefined): RehabFocus | null {
  const t = text?.trim();
  if (!t) return null;
  if (!/\b(rehab|prehab|pre-hab|injury|recovery|return to play)\b/i.test(t)) return null;
  for (const { focus, pattern } of REHAB_KEYWORDS) {
    if (pattern.test(t)) return focus;
  }
  return null;
}

export function kineticChainBodyParts(focus: RehabFocus): string[] {
  return KINETIC_CHAIN_PARTS[focus];
}

export function exerciseMatchesBodyPart(entry: ExerciseCatalogEntry, part: string): boolean {
  const needle = normalizeToken(part);
  return entry.bodyParts.some((p) => normalizeToken(p) === needle || normalizeToken(p).includes(needle));
}

export function exerciseMatchesLocation(entry: ExerciseCatalogEntry, locationSlug?: string): boolean {
  if (!locationSlug?.trim()) return true;
  const slug = locationSlug.trim().toLowerCase();
  return entry.locationSlugs.some((s) => s.toLowerCase() === slug);
}

export function parseTrainingLevelFromAthleteContext(text: string | null | undefined): OnboardingLevel | null {
  if (!text) return null;
  const admin = text.match(/Training level \(admin\):\s*(beginner|intermediate|advanced)/i);
  if (admin) return admin[1]!.toLowerCase() as OnboardingLevel;
  const onboarding = text.match(/Onboarding level:\s*(beginner|intermediate|advanced)/i);
  if (onboarding) return onboarding[1]!.toLowerCase() as OnboardingLevel;
  return null;
}
