import type { ExerciseCatalogEntry } from "@/lib/programs/exercise-catalog";
import type { WorkoutProposalExercise } from "@/lib/programs/ai-coach-gemini";
import type { OnboardingLevel } from "@/lib/member/onboarding";
import { exerciseEligibleForTrainingLevel } from "@/lib/programs/exercise-level-eligibility";
import {
  catalogEntryHasTag,
  exerciseMatchesLocation,
} from "@/lib/programs/program-prescription-rules";
import { exerciseHasRotationalPattern } from "@/lib/programs/ensure-rotational-exercise";
import type { SessionPhase } from "@/lib/programs/session-phase";

/**
 * Max distinct *main* exercise IDs that may appear in more than one session in a week.
 * Keep this low so days feel different; warm-up/cool-down may still share mobility.
 */
export const MAX_REPEATED_EXERCISES_PER_WEEK = 1;

type SessionWithExercises = {
  name: string;
  exercises: WorkoutProposalExercise[];
};

function phaseOf(ex: WorkoutProposalExercise): SessionPhase {
  return ex.phase === "warmup" || ex.phase === "cooldown" ? ex.phase : "main";
}

function isFootwork(entry: ExerciseCatalogEntry): boolean {
  return catalogEntryHasTag(entry, "footwork") || catalogEntryHasTag(entry, "agility");
}

function isRotational(entry: ExerciseCatalogEntry): boolean {
  return exerciseHasRotationalPattern(entry);
}

/** Structure-critical moves: prefer same-class replacements rather than dropping the requirement. */
function isProtectedMainEntry(entry: ExerciseCatalogEntry): boolean {
  return isFootwork(entry) || isRotational(entry);
}

function mainIdsAppearingInMultipleSessions(sessions: SessionWithExercises[]): string[] {
  const sessionCountById = new Map<string, number>();
  for (const session of sessions) {
    const seen = new Set<string>();
    for (const ex of session.exercises) {
      if (phaseOf(ex) !== "main") continue;
      if (seen.has(ex.exercise_id)) continue;
      seen.add(ex.exercise_id);
      sessionCountById.set(ex.exercise_id, (sessionCountById.get(ex.exercise_id) ?? 0) + 1);
    }
  }
  return [...sessionCountById.entries()]
    .filter(([, count]) => count > 1)
    .map(([id]) => id);
}

function replacementMatchesClass(
  candidate: ExerciseCatalogEntry,
  original: ExerciseCatalogEntry | undefined
): boolean {
  if (!original) return true;
  if (isFootwork(original)) return isFootwork(candidate);
  if (isRotational(original)) return isRotational(candidate);
  // Unprotected → avoid introducing another protected filler (structure pass owns those).
  return !isProtectedMainEntry(candidate);
}

function pickReplacement(
  catalog: ExerciseCatalogEntry[],
  opts: {
    excludeIds: Set<string>;
    locationSlug?: string;
    trainingLevel?: OnboardingLevel | null;
    original?: ExerciseCatalogEntry;
  }
): ExerciseCatalogEntry | null {
  const level = opts.trainingLevel ?? "beginner";
  const pool = catalog.filter((e) => {
    if (e.status !== "published" || opts.excludeIds.has(e.id)) return false;
    if (!exerciseEligibleForTrainingLevel(e, level)) return false;
    if (!exerciseMatchesLocation(e, opts.locationSlug)) return false;
    if (!replacementMatchesClass(e, opts.original)) return false;
    return true;
  });
  if (pool.length === 0) return null;
  // Prefer alphabetically stable picks so enforcement is deterministic.
  pool.sort((a, b) => a.title.localeCompare(b.title));
  return pool[0] ?? null;
}

/**
 * Cap cross-session MAIN exercise repeats within a week of session templates.
 * Warm-up / cool-down may repeat (mobility routines).
 * Footwork / rotation repeats are swapped to a different drill of the same class when possible.
 */
export function ensureWeeklyExerciseVariety<T extends SessionWithExercises>(
  sessions: T[],
  catalog: ExerciseCatalogEntry[],
  options?: {
    locationSlug?: string;
    trainingLevel?: OnboardingLevel | null;
    maxRepeated?: number;
  }
): { sessions: T[]; warnings: string[] } {
  const warnings: string[] = [];
  if (sessions.length < 2) return { sessions, warnings };

  const maxRepeated = options?.maxRepeated ?? MAX_REPEATED_EXERCISES_PER_WEEK;
  const byId = new Map(catalog.map((e) => [e.id, e]));

  const out: T[] = sessions.map((s) => ({
    ...s,
    exercises: s.exercises.map((ex) => ({ ...ex })),
  }));

  const weekUsed = new Set<string>();
  for (const s of out) {
    for (const ex of s.exercises) weekUsed.add(ex.exercise_id);
  }

  let guard = 0;
  while (guard++ < 80) {
    const repeated = mainIdsAppearingInMultipleSessions(out);
    if (repeated.length <= maxRepeated) break;

    const firstSeenOrder: string[] = [];
    for (const s of out) {
      for (const ex of s.exercises) {
        if (phaseOf(ex) !== "main") continue;
        if (!repeated.includes(ex.exercise_id)) continue;
        if (!firstSeenOrder.includes(ex.exercise_id)) firstSeenOrder.push(ex.exercise_id);
      }
    }

    // Prefer keeping one intentional anchor; swap everything else (including same-class protected).
    const protectedFirst = firstSeenOrder.filter((id) => {
      const entry = byId.get(id);
      return entry != null && isProtectedMainEntry(entry);
    });
    const unprotectedFirst = firstSeenOrder.filter((id) => !protectedFirst.includes(id));
    const allowedRepeats = new Set(
      [...protectedFirst, ...unprotectedFirst].slice(0, maxRepeated)
    );
    const excessIds = repeated.filter((id) => !allowedRepeats.has(id));

    type Candidate = {
      sessionIndex: number;
      exerciseIndex: number;
      exerciseId: string;
      priority: number;
    };
    const candidates: Candidate[] = [];

    for (const id of excessIds) {
      let seenBefore = false;
      for (let si = 0; si < out.length; si++) {
        const session = out[si]!;
        for (let ei = 0; ei < session.exercises.length; ei++) {
          const ex = session.exercises[ei]!;
          if (ex.exercise_id !== id || phaseOf(ex) !== "main") continue;
          if (!seenBefore) {
            seenBefore = true;
            continue; // keep first occurrence
          }
          candidates.push({
            sessionIndex: si,
            exerciseIndex: ei,
            exerciseId: id,
            priority: si * 10 + ei,
          });
        }
      }
    }

    if (candidates.length === 0) break;

    candidates.sort((a, b) => b.priority - a.priority);
    const target = candidates[0]!;
    const session = out[target.sessionIndex]!;
    const oldEx = session.exercises[target.exerciseIndex]!;
    const oldEntry = byId.get(target.exerciseId);
    const oldTitle = oldEntry?.title ?? target.exerciseId;

    const sessionIds = new Set(session.exercises.map((e) => e.exercise_id));
    const replacement = pickReplacement(catalog, {
      excludeIds: new Set([...weekUsed, ...sessionIds]),
      locationSlug: options?.locationSlug,
      trainingLevel: options?.trainingLevel,
      original: oldEntry,
    });

    if (!replacement) {
      warnings.push(
        `Could not replace repeated main "${oldTitle}" in "${session.name}" — not enough unused catalog exercises.`
      );
      // Drop this id from further attempts by allowing it as a soft repeat.
      break;
    }

    weekUsed.add(replacement.id);
    session.exercises[target.exerciseIndex] = {
      ...oldEx,
      exercise_id: replacement.id,
      title: replacement.title,
    };
    warnings.push(
      `Replaced repeated main "${oldTitle}" in "${session.name}" with "${replacement.title}" — max ${maxRepeated} repeated main exercise(s) per week.`
    );
  }

  return { sessions: out, warnings };
}
