import type { ExerciseCatalogEntry } from "@/lib/programs/exercise-catalog";
import type { OnboardingLevel } from "@/lib/member/onboarding";
import type { WorkoutProposalExercise } from "@/lib/programs/ai-coach-gemini";
import {
  estimateWorkoutMinutes,
  minMainExercisesForTargetMinutes,
  sessionDurationBounds,
} from "@/lib/programs/estimate-workout-minutes";
import { exerciseEligibleForTrainingLevel } from "@/lib/programs/exercise-level-eligibility";
import {
  defaultStrengthSetsRepsForEntry,
  exerciseIsStrength,
  exerciseMatchesLocation,
  resolveRestBand,
} from "@/lib/programs/program-prescription-rules";
import {
  MAIN_TIMED_DEFAULT_ROUNDS,
  MAIN_TIMED_HOLD_DEFAULT_SECONDS,
} from "@/lib/programs/normalize-ai-exercise-prescription";

const MAX_SETS = 5;
const MAX_FILL_STEPS = 24;

export type SessionDurationOptions = {
  locationSlug?: string;
  trainingLevel?: OnboardingLevel | null;
  sessionLabel?: string;
};

function catalogById(
  catalog: ExerciseCatalogEntry[],
  id: string
): ExerciseCatalogEntry | undefined {
  return catalog.find((e) => e.id === id);
}

function isTimed(ex: WorkoutProposalExercise): boolean {
  return (
    (ex.duration_seconds != null && ex.duration_seconds > 0) ||
    (ex.duration_minutes != null && ex.duration_minutes > 0)
  );
}

function mainIndexList(exercises: WorkoutProposalExercise[]): number[] {
  const out: number[] = [];
  for (let i = 0; i < exercises.length; i++) {
    if (exercises[i]?.phase === "main") out.push(i);
  }
  return out;
}

function defaultMainExercise(
  pick: ExerciseCatalogEntry,
  level: OnboardingLevel = "beginner"
): WorkoutProposalExercise {
  const band = resolveRestBand(pick, "main");
  if (pick.programPrescriptionMode === "time_only") {
    return {
      exercise_id: pick.id,
      title: pick.title,
      phase: "main",
      duration_seconds: MAIN_TIMED_HOLD_DEFAULT_SECONDS,
      sets: MAIN_TIMED_DEFAULT_ROUNDS,
      rest_between_sets_seconds: band.default,
      rest_after_seconds: band.default,
    };
  }
  if (exerciseIsStrength(pick)) {
    return {
      exercise_id: pick.id,
      title: pick.title,
      phase: "main",
      ...defaultStrengthSetsRepsForEntry(pick, level),
      rest_between_sets_seconds: band.default,
      rest_after_seconds: band.default,
    };
  }
  return {
    exercise_id: pick.id,
    title: pick.title,
    phase: "main",
    duration_seconds: 45,
    sets: 3,
    rest_between_sets_seconds: band.default,
    rest_after_seconds: band.default,
  };
}

function mainCandidateScore(entry: ExerciseCatalogEntry): number {
  let score = 100;
  const blob = [entry.title, ...entry.categoryTypes].join(" ").toLowerCase();
  if (/\bstrength\b/.test(blob)) score -= 30;
  if (/\bfootwork\b|\bagility\b/.test(blob)) score -= 20;
  if (/\bcore\b|\btrunk\b/.test(blob)) score -= 10;
  if (entry.programPrescriptionMode === "sets_reps_only") score -= 5;
  return score;
}

function pickMainCatalogExercises(
  catalog: ExerciseCatalogEntry[],
  excludeIds: Set<string>,
  count: number,
  locationSlug?: string,
  trainingLevel?: OnboardingLevel | null
): ExerciseCatalogEntry[] {
  if (count <= 0) return [];
  const level = trainingLevel ?? "beginner";
  const eligible = catalog
    .filter(
      (e) =>
        e.status === "published" &&
        !excludeIds.has(e.id) &&
        exerciseMatchesLocation(e, locationSlug) &&
        exerciseEligibleForTrainingLevel(e, level)
    )
    .sort((a, b) => mainCandidateScore(a) - mainCandidateScore(b));
  return eligible.slice(0, count);
}

function insertMains(
  exercises: WorkoutProposalExercise[],
  additions: WorkoutProposalExercise[]
): WorkoutProposalExercise[] {
  if (additions.length === 0) return exercises;
  const firstCooldown = exercises.findIndex((e) => e.phase === "cooldown");
  const insertAt = firstCooldown >= 0 ? firstCooldown : exercises.length;
  const out = [...exercises];
  out.splice(insertAt, 0, ...additions);
  return out;
}

/**
 * Deterministically expand under-filled sessions so estimated length reaches
 * the consultation target band (same floor used by validate-ai-coach-proposal).
 * Prefers more main sets / rest / timed work before adding catalog mains.
 */
export function ensureSessionDurationFit(
  exercises: WorkoutProposalExercise[],
  catalog: ExerciseCatalogEntry[],
  targetMinutes: number,
  options?: SessionDurationOptions
): { exercises: WorkoutProposalExercise[]; warnings: string[] } {
  const warnings: string[] = [];
  if (!Number.isFinite(targetMinutes) || targetMinutes < 8) {
    return { exercises, warnings };
  }

  const { minOk } = sessionDurationBounds(targetMinutes);
  const minMains = minMainExercisesForTargetMinutes(targetMinutes);
  const level = options?.trainingLevel ?? "beginner";
  const label = options?.sessionLabel?.trim();
  let next = exercises.map((ex) => ({ ...ex }));

  const used = new Set(next.map((ex) => ex.exercise_id));

  // Ensure enough distinct main-phase exercises first.
  let mains = mainIndexList(next);
  if (mains.length < minMains) {
    const need = minMains - mains.length;
    const picks = pickMainCatalogExercises(
      catalog,
      used,
      need,
      options?.locationSlug,
      options?.trainingLevel
    );
    const additions = picks.map((p) => {
      used.add(p.id);
      return defaultMainExercise(p, level);
    });
    if (additions.length > 0) {
      next = insertMains(next, additions);
      warnings.push(
        label
          ? `${label}: Added ${additions.length} main exercise(s) to reach ~${targetMinutes} min session density.`
          : `Added ${additions.length} main exercise(s) to reach ~${targetMinutes} min session density.`
      );
    }
  }

  for (let step = 0; step < MAX_FILL_STEPS; step++) {
    const estimated = estimateWorkoutMinutes(next);
    if (estimated >= minOk) break;

    mains = mainIndexList(next);
    if (mains.length === 0) {
      const picks = pickMainCatalogExercises(
        catalog,
        used,
        Math.max(1, minMains),
        options?.locationSlug,
        options?.trainingLevel
      );
      if (picks.length === 0) break;
      const additions = picks.map((p) => {
        used.add(p.id);
        return defaultMainExercise(p, level);
      });
      next = insertMains(next, additions);
      warnings.push(
        label
          ? `${label}: Seeded main-block work to fill ~${targetMinutes} min.`
          : `Seeded main-block work to fill ~${targetMinutes} min.`
      );
      continue;
    }

    // 1) Bump sets on the lightest main (sets×reps or timed rounds).
    const bumpableSets = mains
      .map((idx) => ({ idx, sets: next[idx]!.sets ?? (isTimed(next[idx]!) ? 1 : 0) }))
      .filter((row) => row.sets > 0 && row.sets < MAX_SETS)
      .sort((a, b) => a.sets - b.sets);

    if (bumpableSets.length > 0) {
      const { idx, sets } = bumpableSets[0]!;
      next[idx] = { ...next[idx]!, sets: sets + 1 };
      continue;
    }

    // 2) Lengthen timed holds slightly.
    const timedIdx = mains.find(
      (idx) =>
        isTimed(next[idx]!) &&
        (next[idx]!.duration_seconds ?? (next[idx]!.duration_minutes ?? 0) * 60) < 90
    );
    if (timedIdx != null) {
      const ex = next[timedIdx]!;
      const secs =
        ex.duration_seconds != null && ex.duration_seconds > 0
          ? ex.duration_seconds
          : Math.ceil((ex.duration_minutes ?? 0) * 60);
      next[timedIdx] = {
        ...ex,
        duration_seconds: Math.min(90, secs + 15),
        duration_minutes: undefined,
      };
      continue;
    }

    // 3) Increase between-set rest toward band default/max.
    const restBump = mains.find((idx) => {
      const ex = next[idx]!;
      const entry = catalogById(catalog, ex.exercise_id);
      if (!entry) return false;
      const band = resolveRestBand(entry, "main");
      const current = ex.rest_between_sets_seconds ?? 0;
      return current < band.default;
    });
    if (restBump != null) {
      const ex = next[restBump]!;
      const entry = catalogById(catalog, ex.exercise_id)!;
      const band = resolveRestBand(entry, "main");
      next[restBump] = {
        ...ex,
        rest_between_sets_seconds: Math.min(
          band.max,
          Math.max(band.default, (ex.rest_between_sets_seconds ?? 0) + 15)
        ),
      };
      continue;
    }

    // 4) Add another main from the catalog.
    const picks = pickMainCatalogExercises(
      catalog,
      used,
      1,
      options?.locationSlug,
      options?.trainingLevel
    );
    if (picks.length === 0) break;
    const pick = picks[0]!;
    used.add(pick.id);
    next = insertMains(next, [defaultMainExercise(pick, level)]);
    warnings.push(
      label
        ? `${label}: Added ${pick.title} to fill ~${targetMinutes} min target.`
        : `Added ${pick.title} to fill ~${targetMinutes} min target.`
    );
  }

  const finalEstimated = estimateWorkoutMinutes(next);
  if (finalEstimated < minOk) {
    warnings.push(
      label
        ? `${label}: Still short after fill (~${finalEstimated} min vs need ≥${minOk}). Catalog may be too thin.`
        : `Still short after fill (~${finalEstimated} min vs need ≥${minOk}). Catalog may be too thin.`
    );
  } else if (finalEstimated !== estimateWorkoutMinutes(exercises)) {
    warnings.push(
      label
        ? `${label}: Expanded main-block volume to ~${finalEstimated} min (target ~${targetMinutes}).`
        : `Expanded main-block volume to ~${finalEstimated} min (target ~${targetMinutes}).`
    );
  }

  return { exercises: next, warnings };
}
