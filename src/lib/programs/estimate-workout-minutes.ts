import type { WorkoutProposal, WorkoutProposalExercise } from "@/lib/programs/ai-coach-gemini";
import { aiExerciseToProgramPayload } from "@/lib/programs/normalize-ai-exercise-prescription";

/** Rough working time for one sets×reps set (seconds). */
function estimateSetsRepsWorkSeconds(sets: number, reps: number): number {
  const perSet = Math.max(25, Math.ceil(reps * 2.5));
  return sets * perSet;
}

/**
 * Estimate total workout length from prescriptions (work + between-set rest + between-exercise rest).
 * Used for save metadata and duration validation against the consultation target.
 */
export function estimateWorkoutMinutes(
  exercises: Array<
    Pick<
      WorkoutProposalExercise,
      | "phase"
      | "duration_seconds"
      | "duration_minutes"
      | "sets"
      | "reps"
      | "rest_between_sets_seconds"
      | "rest_between_sides_seconds"
      | "rest_after_seconds"
      | "note"
      | "rpe"
      | "intensity"
      | "load_prescription"
      | "choice_group"
    > & { exercise_id: string }
  >
): number {
  let total = 0;
  for (let i = 0; i < exercises.length; i++) {
    const ex = exercises[i]!;
    const payload = aiExerciseToProgramPayload(
      { ...ex, choice_group: ex.choice_group ?? null, note: ex.note ?? null },
      { isLastInSession: i === exercises.length - 1 }
    );

    if (payload.duration_seconds && payload.duration_seconds > 0) {
      const rounds = payload.sets != null && payload.sets > 1 ? payload.sets : 1;
      total += (payload.duration_seconds * rounds) / 60;
    } else if (payload.sets != null && payload.reps != null) {
      total += estimateSetsRepsWorkSeconds(payload.sets, payload.reps) / 60;
    }

    if (payload.rest_between_sets_seconds && payload.sets && payload.sets > 1) {
      total += (payload.rest_between_sets_seconds * (payload.sets - 1)) / 60;
    }
    if (payload.rest_between_sides_seconds && payload.rest_between_sides_seconds > 0) {
      total += payload.rest_between_sides_seconds / 60;
    }
    if (payload.rest_after_seconds) {
      total += payload.rest_after_seconds / 60;
    }
  }
  return Math.ceil(total) || 1;
}

export function estimateWorkoutProposalMinutes(proposal: WorkoutProposal): number {
  return estimateWorkoutMinutes(proposal.exercises);
}

/** Minimum main-phase exercises so a target duration is not just warm-up/cool-down. */
export function minMainExercisesForTargetMinutes(targetMinutes: number): number {
  if (targetMinutes >= 40) return 6;
  if (targetMinutes >= 30) return 5;
  if (targetMinutes >= 20) return 4;
  if (targetMinutes >= 12) return 3;
  return 2;
}
