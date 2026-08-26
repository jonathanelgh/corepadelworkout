import type { ExerciseCatalogEntry } from "@/lib/programs/exercise-catalog";
import type { SessionPhase } from "@/lib/programs/session-phase";

type RpeGuidanceExercise = {
  phase: SessionPhase | string;
};

function catalogBlob(entry: ExerciseCatalogEntry): string {
  return [
    entry.title,
    ...entry.categoryTypes,
    ...entry.movementPatterns,
    ...entry.bodyRegions,
    ...entry.bodyParts,
  ]
    .join(" ")
    .toLowerCase()
    .replace(/_/g, " ");
}

/**
 * RPE only when the athlete must regulate effort (weighted strength, conditioning,
 * repeated explosive work, near-fatigue). Not for mobility / warm-up / cool-down /
 * technique / standard isometric holds / Copenhagen-style work unless effort-based.
 */
export function exerciseNeedsRpeGuidance(
  entry: ExerciseCatalogEntry,
  ex: RpeGuidanceExercise,
  isTimed: boolean,
  sets: number | null,
  reps: number | null
): boolean {
  if (ex.phase === "warmup" || ex.phase === "cooldown") return false;

  const blob = catalogBlob(entry);
  if (/\bmobility\b|\bstretch\b|\btechnique\b/.test(blob)) return false;
  if (/\bcopenhagen\b/.test(blob)) return false;
  if (
    entry.programPrescriptionMode === "time_only" &&
    !/\bexplosive\b|\bplyometric\b|\bconditioning\b/.test(blob)
  ) {
    return false;
  }

  if (/\bexplosive\b|\bplyometric\b|\bconditioning\b|\bspeedstrength\b|\bspeed-strength\b/.test(blob)) {
    return true;
  }

  // Main sets×reps work needs a Target RPE (strength / weighted / general effort).
  if (ex.phase === "main" && !isTimed && sets != null && reps != null) {
    return true;
  }

  return false;
}
