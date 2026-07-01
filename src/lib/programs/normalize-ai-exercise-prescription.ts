import type { ProgramExercisePayload } from "@/lib/programs/program-curriculum";
import {
  inferExercisePrescriptionType,
  type ExercisePrescriptionType,
} from "@/lib/programs/program-exercises";
import type { SessionPhase } from "@/lib/programs/session-phase";

export type AiExerciseFields = {
  phase: SessionPhase;
  duration_minutes?: number | null;
  sets?: number | null;
  reps?: number | null;
  rest_between_sets_seconds?: number | null;
  rest_after_seconds?: number | null;
};

function parseNonNegInt(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v) && v >= 0) return Math.ceil(v);
  return null;
}

export function inferAiPrescriptionType(ex: AiExerciseFields): ExercisePrescriptionType {
  const durationMinutes =
    ex.duration_minutes != null && ex.duration_minutes > 0 ? Math.ceil(ex.duration_minutes) : null;
  const durationSeconds = durationMinutes != null ? durationMinutes * 60 : null;
  return inferExercisePrescriptionType({
    durationSeconds,
    durationMinutes,
    sets: ex.sets ?? null,
    restBetweenSetsSeconds: ex.rest_between_sets_seconds ?? null,
  });
}

const DEFAULT_REST_AFTER: Record<SessionPhase, number> = {
  warmup: 20,
  main: 45,
  cooldown: 15,
};

const DEFAULT_REST_AFTER_TIMED = 30;
const DEFAULT_REST_BETWEEN_SETS = 30;

/** Rest before the next exercise in the session. */
export function defaultRestAfterSeconds(
  ex: AiExerciseFields,
  opts: { isLastInSession: boolean }
): number {
  const explicit = parseNonNegInt(ex.rest_after_seconds);
  if (opts.isLastInSession) return explicit ?? 0;
  if (explicit != null && explicit > 0) return explicit;

  const type = inferAiPrescriptionType(ex);
  if (type === "time" || type === "timed_intervals") return DEFAULT_REST_AFTER_TIMED;
  return DEFAULT_REST_AFTER[ex.phase] ?? 45;
}

/** Rest between timed sets/rounds when sets > 1 with a work duration. */
export function defaultRestBetweenSetsSeconds(ex: AiExerciseFields): number | null {
  const explicit = parseNonNegInt(ex.rest_between_sets_seconds);
  if (explicit != null && explicit > 0) return explicit;

  const type = inferAiPrescriptionType(ex);
  const sets = ex.sets != null && ex.sets > 0 ? Math.ceil(ex.sets) : 1;
  if (type === "timed_intervals" && sets > 1) return DEFAULT_REST_BETWEEN_SETS;
  return null;
}

export function aiExerciseToProgramPayload(
  ex: AiExerciseFields & {
    exercise_id: string;
    choice_group?: string | null;
    note?: string | null;
  },
  opts: { isLastInSession: boolean }
): ProgramExercisePayload {
  const durationMinutes =
    ex.duration_minutes != null && ex.duration_minutes > 0 ? Math.ceil(ex.duration_minutes) : null;

  return {
    exercise_id: ex.exercise_id,
    duration_minutes: null,
    duration_seconds: durationMinutes != null ? durationMinutes * 60 : null,
    sets: ex.sets != null && ex.sets > 0 ? Math.ceil(ex.sets) : null,
    reps: ex.reps != null && ex.reps > 0 ? Math.ceil(ex.reps) : null,
    rest_between_sets_seconds: defaultRestBetweenSetsSeconds(ex),
    rest_after_seconds: defaultRestAfterSeconds(ex, opts),
    session_phase: ex.phase,
    choice_group: ex.choice_group ?? null,
    note: ex.note ?? null,
  };
}

export function normalizeAiExerciseRest<T extends AiExerciseFields>(exercises: T[]): T[] {
  return exercises.map((ex, index) => ({
    ...ex,
    rest_between_sets_seconds: defaultRestBetweenSetsSeconds(ex) ?? undefined,
    rest_after_seconds: defaultRestAfterSeconds(ex, {
      isLastInSession: index === exercises.length - 1,
    }),
  }));
}
