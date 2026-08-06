import type { ExerciseCatalogEntry } from "@/lib/programs/exercise-catalog";
import type { OnboardingLevel } from "@/lib/member/onboarding";
import type { WorkoutProposalExercise } from "@/lib/programs/ai-coach-gemini";

export const COOLDOWN_DURATION_SECONDS = 60;
export const COOLDOWN_REST_AFTER_SECONDS = 15;
export const MIN_COOLDOWN_EXERCISES_PER_SESSION = 5;

/** @deprecated Prefer tag-based rest bands from resolveRestBand(). */
export const BEGINNER_MAIN_REST_SECONDS_MIN = 30;
export const BEGINNER_MAIN_REST_SECONDS_MAX = 60;
export const ADVANCED_MAIN_REST_SECONDS_MIN = 60;
export const ADVANCED_MAIN_REST_SECONDS_MAX = 90;

const STRENGTH_TYPE_HINTS = ["strength", "hypertrofy", "hypertrophy", "maximal", "plyometric"];
const AGILITY_FOOTWORK_STRENGTH_REST_TYPES = ["strength", "agility", "footwork"];

export type RestBand = { min: number; max: number; default: number };

/** Central rest matrix by exercise tag (Section 9). */
export function resolveRestBand(entry: ExerciseCatalogEntry, phase: string): RestBand {
  const types = entry.categoryTypes.map(normalizeToken).join(" ");
  const p = phase.toLowerCase();

  if (p === "warmup") {
    if (/explosive|plyometric|speed/.test(types)) return { min: 30, max: 45, default: 35 };
    if (/footwork|coordination|agility|skill/.test(types)) return { min: 15, max: 20, default: 15 };
    return { min: 10, max: 15, default: 15 };
  }
  if (p === "cooldown") return { min: 10, max: 15, default: 15 };

  if (/supramaximal/.test(types)) return { min: 180, max: 300, default: 210 };
  if (/maximalstrength|explosive/.test(types)) return { min: 120, max: 180, default: 150 };
  if (/speedstrength|plyometric/.test(types)) return { min: 90, max: 180, default: 120 };
  if (/specific|sport-specific/.test(types)) return { min: 60, max: 120, default: 90 };
  if (/hypertrofy|hypertrophy/.test(types)) return { min: 60, max: 90, default: 75 };
  if (/endurance|stability/.test(types)) return { min: 30, max: 60, default: 45 };
  if (/footwork|agility|coordination/.test(types)) return { min: 30, max: 60, default: 45 };
  if (/strength/.test(types)) return { min: 60, max: 90, default: 75 };
  return { min: 30, max: 90, default: 60 };
}

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

/**
 * "Core" in Core Padel programs = main-block work (not warm-up / cool-down).
 * Trunk/abs work is covered separately via rotation / anti-rotation rules.
 */
export function exerciseIsCoreFocus(entry: ExerciseCatalogEntry): boolean {
  // Catalog exercises are phase-agnostic; prefer anything that isn't clearly
  // warm-up/cool-down mobility-only when used as a main-block filler.
  if (entry.programPrescriptionMode === "time_only") {
    const types = entry.categoryTypes.map(normalizeToken).join(" ");
    if (/mobility|stretch|cool|warm/.test(types)) return false;
  }
  return true;
}

/** Session-level: any main-phase exercise counts as core-block work. */
export function sessionHasCoreBlock(
  exercises: Array<{ phase: string }>
): boolean {
  return exercises.some((e) => e.phase === "main");
}

export function catalogEntryHasTag(entry: ExerciseCatalogEntry, tag: string): boolean {
  const needle = normalizeToken(tag);
  // "core" as a catalog tag is ambiguous — prefer explicit main-block checks via
  // sessionHasCoreBlock. Keep a loose catalog match for legacy callers.
  if (needle === "core") {
    return exerciseIsCoreFocus(entry);
  }
  const haystack = [
    ...entry.categoryTypes,
    ...entry.bodyRegions,
    ...entry.bodyParts,
    ...entry.movementPatterns,
  ].map(normalizeToken);
  if (haystack.some((t) => t === needle || t.includes(needle))) return true;
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

export function clampRestToBand(seconds: number, band: RestBand): number {
  return Math.min(band.max, Math.max(band.min, Math.round(seconds)));
}

/** Level-aware fallback when no catalog entry is available. */
export function clampMainRestSeconds(seconds: number, level: OnboardingLevel): number {
  const min =
    level === "beginner" ? BEGINNER_MAIN_REST_SECONDS_MIN : ADVANCED_MAIN_REST_SECONDS_MIN;
  const max =
    level === "beginner" ? BEGINNER_MAIN_REST_SECONDS_MAX : ADVANCED_MAIN_REST_SECONDS_MAX;
  return Math.min(max, Math.max(min, Math.round(seconds)));
}

export function defaultMainRestAfterSeconds(level: OnboardingLevel): number {
  return level === "beginner" ? 45 : 75;
}

export function defaultRestForEntry(
  entry: ExerciseCatalogEntry,
  phase: string,
  level: OnboardingLevel
): number {
  const band = resolveRestBand(entry, phase);
  if (level === "beginner" && band.min > 90) {
    return Math.min(band.default, 90);
  }
  return band.default;
}

export function defaultStrengthSetsReps(): Pick<WorkoutProposalExercise, "sets" | "reps"> {
  return { sets: 3, reps: 10 };
}

/**
 * Sets/reps defaults from catalog strength tags (matches AI strength prescription matrix).
 * When multiple tags exist, prefer the highest-specificity match in STRENGTH_PRESCRIPTION_PRIORITY order.
 */
const STRENGTH_PRESCRIPTION_PRIORITY: {
  match: RegExp;
  sets: number;
  reps: number;
  minLevel?: OnboardingLevel;
}[] = [
  { match: /supramaximal/, sets: 4, reps: 2, minLevel: "advanced" },
  { match: /maximalstrength|maximal-strength/, sets: 4, reps: 5, minLevel: "intermediate" },
  { match: /speedstrength|speed-strength/, sets: 4, reps: 4, minLevel: "intermediate" },
  { match: /explosive/, sets: 4, reps: 4, minLevel: "intermediate" },
  { match: /plyometric/, sets: 4, reps: 4, minLevel: "intermediate" },
  { match: /hypertrofy|hypertrophy/, sets: 3, reps: 10 },
  { match: /specific|sport-specific/, sets: 3, reps: 8 },
  { match: /stability/, sets: 3, reps: 10 },
  { match: /endurance/, sets: 3, reps: 15 },
  { match: /strength/, sets: 3, reps: 10 },
];

function levelRank(level: OnboardingLevel): number {
  if (level === "advanced") return 2;
  if (level === "intermediate") return 1;
  return 0;
}

export function defaultStrengthSetsRepsForEntry(
  entry: ExerciseCatalogEntry,
  level: OnboardingLevel = "beginner"
): Pick<WorkoutProposalExercise, "sets" | "reps"> {
  const types = entry.categoryTypes.map(normalizeToken).join(" ");
  for (const row of STRENGTH_PRESCRIPTION_PRIORITY) {
    if (!row.match.test(types)) continue;
    if (row.minLevel && levelRank(level) < levelRank(row.minLevel)) {
      // Fall through to a safer lower-intensity default for this athlete.
      continue;
    }
    return { sets: row.sets, reps: row.reps };
  }
  return defaultStrengthSetsReps();
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

/**
 * True when the brief asks for a footwork / agility / court-movement focused program
 * (not just a general plan that happens to mention movement).
 */
export function detectFootworkSpecialtyFocus(text: string | null | undefined): boolean {
  const t = text?.trim();
  if (!t) return false;
  if (
    /\bfootwork\b/i.test(t) ||
    /\b(agility|change[\s-]?of[\s-]?direction|\bcod\b|ladder\s+drills?|court\s+movement|first[\s-]?step|quick\s+feet|quickness|lateral\s+movement|shuffle\s+drills?)\b/i.test(
      t
    )
  ) {
    return true;
  }
  return false;
}

/** Per-session footwork floor: specialty programs need a heavy footwork main block. */
export function resolveMinFootworkPerSession(opts: {
  sessionCount: number;
  sessionIndex: number;
  specialtyFootwork: boolean;
}): number {
  if (opts.specialtyFootwork) return 4;
  if (opts.sessionCount === 3) {
    return ([2, 1, 2] as const)[opts.sessionIndex] ?? 1;
  }
  return 1;
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

/**
 * Infer athlete training level from a free-text brief / chat (when the admin dropdown is Auto).
 * Prefers explicit athlete/player/level phrasing over bare adjectives.
 */
export function parseTrainingLevelFromBrief(text: string | null | undefined): OnboardingLevel | null {
  const t = text?.trim();
  if (!t) return null;

  if (
    /\b(elite)\s+(player|athlete|level|padel)?\b/i.test(t) ||
    /\bfor\s+(an?\s+)?elite\b/i.test(t)
  ) {
    return "advanced";
  }
  if (
    /\badvanced\s+(player|athlete|level|padel)\b/i.test(t) ||
    /\bfor\s+(an?\s+)?advanced\b/i.test(t) ||
    /\b(training\s+)?level[:\s]+advanced\b/i.test(t) ||
    /\badvanced\s+level\b/i.test(t)
  ) {
    return "advanced";
  }
  if (
    /\bintermediate\s+(player|athlete|level|padel)\b/i.test(t) ||
    /\bfor\s+(an?\s+)?intermediate\b/i.test(t) ||
    /\b(training\s+)?level[:\s]+intermediate\b/i.test(t)
  ) {
    return "intermediate";
  }
  if (
    /\b(beginner|rookie|starter|novice)\s+(player|athlete|level|padel)\b/i.test(t) ||
    /\bfor\s+(an?\s+)?(beginner|rookie|starter|novice)\b/i.test(t) ||
    /\b(training\s+)?level[:\s]+(beginner|rookie|starter)\b/i.test(t)
  ) {
    return "beginner";
  }

  // Bare level words in a short brief (e.g. "advanced, gym, 45 min")
  if (/\badvanced\b/i.test(t) || /\belite\b/i.test(t)) return "advanced";
  if (/\bintermediate\b/i.test(t)) return "intermediate";
  if (/\b(beginner|rookie|starter|novice)\b/i.test(t)) return "beginner";
  return null;
}
