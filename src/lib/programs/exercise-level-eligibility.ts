import type { ExerciseCatalogEntry } from "@/lib/programs/exercise-catalog";
import type { OnboardingLevel } from "@/lib/member/onboarding";
import { isOnboardingLevel } from "@/lib/programs/profile-ai-context";

/** Exercise taxonomy ranks (higher = harder). Matches `exercise_levels.slug`. */
const EXERCISE_LEVEL_RANK: Record<string, number> = {
  "rookie-starter": 1,
  intermediate: 2,
  advanced: 3,
  elite: 4,
};

/**
 * Allowed exercise ranks per athlete / program training level.
 * - beginner → beginner only
 * - intermediate → beginner + intermediate
 * - advanced → intermediate + advanced (+ elite); not beginner
 */
const TRAINING_ALLOWED_EXERCISE_RANKS: Record<OnboardingLevel, ReadonlySet<number>> = {
  beginner: new Set([1]),
  intermediate: new Set([1, 2]),
  advanced: new Set([2, 3, 4]),
};

export function normalizeExerciseLevelSlug(
  slugOrName: string | null | undefined
): string | null {
  if (!slugOrName?.trim()) return null;
  const s = slugOrName.trim().toLowerCase();
  if (s === "rookie-starter" || s === "rookie" || s === "starter") return "rookie-starter";
  if (s === "beginner" || s.includes("beginner")) return "rookie-starter";
  if (s.includes("rookie") || s.includes("starter")) return "rookie-starter";
  if (s === "intermediate" || s.includes("intermediate")) return "intermediate";
  if (s === "advanced" || s.includes("advanced")) return "advanced";
  if (s === "elite" || s.includes("elite")) return "elite";
  return null;
}

export function exerciseLevelRank(
  entry: Pick<ExerciseCatalogEntry, "levelSlug" | "levelName">
): number | null {
  const slug =
    normalizeExerciseLevelSlug(entry.levelSlug) ??
    normalizeExerciseLevelSlug(entry.levelName);
  if (!slug) return null;
  return EXERCISE_LEVEL_RANK[slug] ?? null;
}

/**
 * Whether an exercise may appear in a program/workout for this training level.
 * Untagged exercises are treated as beginner (rookie-starter) — advanced athletes do not get them.
 */
export function exerciseEligibleForTrainingLevel(
  entry: Pick<ExerciseCatalogEntry, "levelSlug" | "levelName">,
  trainingLevel: OnboardingLevel | null | undefined
): boolean {
  if (!trainingLevel) return true;
  const allowed = TRAINING_ALLOWED_EXERCISE_RANKS[trainingLevel];
  const rank = exerciseLevelRank(entry) ?? 1; // missing level → beginner
  return allowed.has(rank);
}

export function filterCatalogByTrainingLevel<
  T extends Pick<ExerciseCatalogEntry, "levelSlug" | "levelName">,
>(catalog: T[], trainingLevel: OnboardingLevel | null | undefined): T[] {
  if (!trainingLevel) return catalog;
  return catalog.filter((e) => exerciseEligibleForTrainingLevel(e, trainingLevel));
}

export function trainingLevelFromProgramDifficultySlug(
  slug: string | null | undefined
): OnboardingLevel | null {
  if (!slug?.trim()) return null;
  const s = slug.trim().toLowerCase();
  if (s === "beginner") return "beginner";
  if (s === "intermediate") return "intermediate";
  if (s === "advanced") return "advanced";
  // all-levels / unknown → no hard exercise-level cap
  return null;
}

/** Prefer explicit training level; else map program difficulty slug. */
export function resolveExerciseLevelCap(opts: {
  trainingLevel?: string | null;
  difficultySlug?: string | null;
}): OnboardingLevel | null {
  if (isOnboardingLevel(opts.trainingLevel)) return opts.trainingLevel;
  return trainingLevelFromProgramDifficultySlug(opts.difficultySlug);
}
