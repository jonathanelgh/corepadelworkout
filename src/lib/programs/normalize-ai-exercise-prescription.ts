import type { ProgramExercisePayload } from "@/lib/programs/program-curriculum";
import {
  inferExercisePrescriptionType,
  type ExercisePrescriptionType,
} from "@/lib/programs/program-exercises";
import { parseSessionPhase, type SessionPhase } from "@/lib/programs/session-phase";
import { WARMUP_DURATION_SECONDS } from "@/lib/programs/warmup-prescription";
import { DEFAULT_REST_BETWEEN_SIDES_SECONDS } from "@/lib/programs/program-exercises";
import {
  promoteProgressionOutOfNote,
  clearAiLoadPrescription,
  sanitizeBothSidesCoachNote,
} from "@/lib/programs/sanitize-coach-note";

export type AiExerciseFields = {
  phase: SessionPhase;
  duration_seconds?: number | null;
  duration_minutes?: number | null;
  sets?: number | null;
  reps?: number | null;
  rest_between_sets_seconds?: number | null;
  rest_between_sides_seconds?: number | null;
  rest_after_seconds?: number | null;
  load_prescription?: string | null;
  note?: string | null;
};

function parseNonNegInt(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v) && v >= 0) return Math.ceil(v);
  return null;
}

export function inferAiPrescriptionType(ex: AiExerciseFields): ExercisePrescriptionType {
  const durationSeconds =
    ex.duration_seconds != null && ex.duration_seconds > 0
      ? Math.ceil(ex.duration_seconds)
      : ex.duration_minutes != null && ex.duration_minutes > 0
        ? Math.ceil(ex.duration_minutes) * 60
        : null;
  const durationMinutes = durationSeconds != null ? Math.ceil(durationSeconds / 60) : null;
  return inferExercisePrescriptionType({
    durationSeconds,
    durationMinutes,
    sets: ex.sets ?? null,
    restBetweenSetsSeconds: ex.rest_between_sets_seconds ?? null,
  });
}

const DEFAULT_REST_AFTER: Record<SessionPhase, number> = {
  warmup: 15,
  main: 45,
  cooldown: 15,
};

const DEFAULT_REST_AFTER_TIMED = 30;
const DEFAULT_REST_BETWEEN_SETS = 30;
/** Fixed between-set rest for sets×reps prescriptions (shown as coach note + structured field). */
export const SETS_REPS_REST_BETWEEN_SETS_SECONDS = 30;
export const SETS_REPS_BETWEEN_SETS_NOTE = "Rest 30 sec between sets";
const DEFAULT_REST_BETWEEN_SIDES = DEFAULT_REST_BETWEEN_SIDES_SECONDS;

/** Main-block timed work must be multi-round (timed intervals), not a single timer. */
export const MAIN_TIMED_MIN_ROUNDS = 2;
export const MAIN_TIMED_MAX_ROUNDS = 3;
export const MAIN_TIMED_DEFAULT_ROUNDS = 3;
export const MAIN_TIMED_REST_BETWEEN_ROUNDS_SECONDS = 30;
/** Default hold length when catalog is time_only and AI/admin omit duration (e.g. Pallof Press Hold). */
export const MAIN_TIMED_HOLD_DEFAULT_SECONDS = 30;

const BETWEEN_SETS_NOTE_RE = /rest\s+\d+\s*sec(?:onds)?\s+between\s+sets/i;

function hasTimedDuration(ex: AiExerciseFields): boolean {
  return (
    (ex.duration_seconds != null && ex.duration_seconds > 0) ||
    (ex.duration_minutes != null && ex.duration_minutes > 0)
  );
}

function resolveWorkSeconds(ex: AiExerciseFields): number | null {
  if (ex.duration_seconds != null && ex.duration_seconds > 0) {
    return Math.ceil(ex.duration_seconds);
  }
  if (ex.duration_minutes != null && ex.duration_minutes > 0) {
    return Math.ceil(ex.duration_minutes) * 60;
  }
  return null;
}

/**
 * AI generation helper: main timed exercises use timed intervals with 2–3 rounds.
 * Do **not** call this on manual admin create/edit — those paths keep entered values.
 */
export function ensureMainTimedRounds<T extends AiExerciseFields>(ex: T): T {
  if (ex.phase !== "main" || !hasTimedDuration(ex)) return ex;

  let sets =
    ex.sets != null && ex.sets > 0 ? Math.ceil(ex.sets) : MAIN_TIMED_DEFAULT_ROUNDS;
  sets = Math.min(MAIN_TIMED_MAX_ROUNDS, Math.max(MAIN_TIMED_MIN_ROUNDS, sets));

  const restBetween =
    ex.rest_between_sets_seconds != null && ex.rest_between_sets_seconds > 0
      ? Math.ceil(ex.rest_between_sets_seconds)
      : MAIN_TIMED_REST_BETWEEN_ROUNDS_SECONDS;

  return {
    ...ex,
    sets,
    rest_between_sets_seconds: restBetween,
  };
}

/**
 * Catalog `time_only` main exercises (holds, timed drills) must keep a duration.
 * Fills a default hold when missing and clears sets×reps-style reps.
 */
export function ensureTimeOnlyMainPrescription<T extends AiExerciseFields>(
  ex: T,
  mode: string | null | undefined
): T {
  if (mode !== "time_only" || ex.phase !== "main") {
    return ensureMainTimedRounds(ex);
  }

  const durationSeconds = resolveWorkSeconds(ex) ?? MAIN_TIMED_HOLD_DEFAULT_SECONDS;
  return ensureMainTimedRounds({
    ...ex,
    duration_seconds: durationSeconds,
    duration_minutes: null,
    reps: null,
  });
}

/** True when this is sets×reps work with multiple sets (not timed). */
export function isMultiSetSetsReps(ex: AiExerciseFields): boolean {
  const type = inferAiPrescriptionType(ex);
  const sets = ex.sets != null && ex.sets > 0 ? Math.ceil(ex.sets) : 1;
  return type === "sets_reps" && sets > 1;
}

/** Ensure sets×reps multi-set exercises carry the between-sets rest coach note. Skip both_sides. */
export function ensureSetsRepsBetweenSetsNote(
  note: string | null | undefined,
  ex: AiExerciseFields,
  opts?: { bothSides?: boolean }
): string | null {
  if (opts?.bothSides || !isMultiSetSetsReps(ex)) {
    const trimmed = note?.trim();
    return trimmed || null;
  }
  const existing = note?.trim() || "";
  if (BETWEEN_SETS_NOTE_RE.test(existing)) return existing || null;
  if (!existing) return SETS_REPS_BETWEEN_SETS_NOTE;
  return `${existing} ${SETS_REPS_BETWEEN_SETS_NOTE}`;
}

/** Rest between left and right on bilateral timed exercises. Catalog both_sides only. */
export function defaultRestBetweenSidesSeconds(
  ex: AiExerciseFields,
  opts?: { bothSides?: boolean }
): number | null {
  if (!opts?.bothSides) return null;
  const explicit = parseNonNegInt(ex.rest_between_sides_seconds);
  if (explicit != null && explicit > 0) return explicit;
  const type = inferAiPrescriptionType(ex);
  if (type === "time" || type === "timed_intervals") return DEFAULT_REST_BETWEEN_SIDES;
  return null;
}

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

/** Rest between sets/rounds when sets > 1 (timed intervals or sets×reps). */
export function defaultRestBetweenSetsSeconds(ex: AiExerciseFields): number | null {
  const explicit = parseNonNegInt(ex.rest_between_sets_seconds);
  if (explicit != null && explicit > 0) return explicit;

  const type = inferAiPrescriptionType(ex);
  const sets = ex.sets != null && ex.sets > 0 ? Math.ceil(ex.sets) : 1;
  if (type === "timed_intervals" && sets > 1) return DEFAULT_REST_BETWEEN_SETS;
  if (type === "sets_reps" && sets > 1) return SETS_REPS_REST_BETWEEN_SETS_SECONDS;
  return null;
}

export function aiExerciseToProgramPayload(
  ex: AiExerciseFields & {
    exercise_id: string;
    choice_group?: string | null;
    note?: string | null;
  },
  opts: { isLastInSession: boolean; bothSides?: boolean }
): ProgramExercisePayload {
  const cleaned = clearAiLoadPrescription(
    promoteProgressionOutOfNote({
      note: ex.note ?? null,
      load_prescription: ex.load_prescription ?? null,
    })
  );
  const noteSansBothSides = sanitizeBothSidesCoachNote(cleaned.note, {
    bothSides: opts.bothSides,
  });

  let durationSeconds =
    ex.duration_seconds != null && ex.duration_seconds > 0
      ? Math.ceil(ex.duration_seconds)
      : ex.duration_minutes != null && ex.duration_minutes > 0
        ? Math.ceil(ex.duration_minutes) * 60
        : null;

  if (ex.phase === "warmup" && (durationSeconds == null || durationSeconds <= 0)) {
    durationSeconds = WARMUP_DURATION_SECONDS;
  }

  const withRounds = ensureMainTimedRounds({
    ...ex,
    duration_seconds: durationSeconds,
    duration_minutes: null,
  });

  const sets =
    withRounds.phase === "warmup"
      ? null
      : withRounds.sets != null && withRounds.sets > 0
        ? Math.ceil(withRounds.sets)
        : null;
  const reps =
    withRounds.phase === "warmup"
      ? null
      : withRounds.reps != null && withRounds.reps > 0
        ? Math.ceil(withRounds.reps)
        : null;
  const forNote: AiExerciseFields = {
    ...withRounds,
    duration_seconds: durationSeconds,
    duration_minutes: null,
    sets,
    reps,
  };

  return {
    exercise_id: ex.exercise_id,
    duration_minutes: null,
    duration_seconds: durationSeconds,
    sets,
    reps,
    rest_between_sets_seconds: defaultRestBetweenSetsSeconds(forNote),
    rest_between_sides_seconds: defaultRestBetweenSidesSeconds(forNote, {
      bothSides: opts.bothSides,
    }),
    rest_after_seconds: defaultRestAfterSeconds(forNote, opts),
    load_prescription: cleaned.load_prescription,
    session_phase: ex.phase,
    choice_group: ex.choice_group ?? null,
    note: ensureSetsRepsBetweenSetsNote(noteSansBothSides, forNote, {
      bothSides: opts.bothSides,
    }),
  };
}

export function normalizeAiExerciseRest<T extends AiExerciseFields>(
  exercises: T[],
  opts?: { bothSidesByExerciseId?: Map<string, boolean> }
): T[] {
  return exercises.map((ex, index) => {
    const exerciseId = "exercise_id" in ex && typeof ex.exercise_id === "string" ? ex.exercise_id : "";
    const bothSides = opts?.bothSidesByExerciseId?.get(exerciseId) ?? false;
    const cleaned = clearAiLoadPrescription(
      promoteProgressionOutOfNote({
        note: ex.note ?? null,
        load_prescription: ex.load_prescription ?? null,
      })
    );
    const noteSansBothSides = sanitizeBothSidesCoachNote(cleaned.note, { bothSides });
    const withRounds = ensureMainTimedRounds(ex);
    const restBetween = defaultRestBetweenSetsSeconds(withRounds) ?? undefined;
    const withRest: AiExerciseFields = {
      ...withRounds,
      rest_between_sets_seconds: restBetween ?? null,
    };
    return {
      ...ex,
      ...withRounds,
      note: ensureSetsRepsBetweenSetsNote(noteSansBothSides, withRest, { bothSides }) ?? undefined,
      load_prescription: undefined,
      rest_between_sets_seconds: restBetween,
      rest_between_sides_seconds:
        defaultRestBetweenSidesSeconds(withRounds, { bothSides }) ?? undefined,
      rest_after_seconds: defaultRestAfterSeconds(withRounds, {
        isLastInSession: index === exercises.length - 1,
      }),
    };
  });
}

export type StoredProgramExerciseFields = {
  session_phase: SessionPhase | string | null;
  duration_minutes: number | null;
  duration_seconds: number | null;
  sets: number | null;
  reps: number | null;
  rest_between_sets_seconds: number | null;
  rest_between_sides_seconds?: number | null;
  rest_after_seconds: number | null;
};

export function storedExerciseToAiFields(ex: StoredProgramExerciseFields): AiExerciseFields {
  const durationSeconds =
    ex.duration_seconds != null && ex.duration_seconds > 0
      ? Math.ceil(ex.duration_seconds)
      : ex.duration_minutes != null && ex.duration_minutes > 0
        ? Math.ceil(ex.duration_minutes) * 60
        : null;
  const durationMinutes =
    durationSeconds != null ? Math.ceil(durationSeconds / 60) : null;

  return {
    phase: parseSessionPhase(ex.session_phase),
    duration_seconds: durationSeconds,
    duration_minutes: durationMinutes,
    sets: ex.sets,
    reps: ex.reps,
    rest_between_sets_seconds: ex.rest_between_sets_seconds,
    rest_between_sides_seconds: ex.rest_between_sides_seconds ?? null,
    rest_after_seconds: ex.rest_after_seconds,
  };
}

/** Compute rest fields for a stored program_exercises row; only fills gaps. */
export function backfillStoredProgramExerciseRest(
  ex: StoredProgramExerciseFields,
  opts: { isLastInSession: boolean }
): {
  rest_after_seconds: number;
  rest_between_sets_seconds: number | null;
  needsUpdate: boolean;
} {
  const fields = storedExerciseToAiFields(ex);
  const currentAfter = ex.rest_after_seconds ?? 0;
  const currentBetween = ex.rest_between_sets_seconds;

  const targetAfter = defaultRestAfterSeconds(fields, opts);
  const targetBetween = defaultRestBetweenSetsSeconds(fields);

  const needsRestAfter =
    !opts.isLastInSession && (ex.rest_after_seconds == null || currentAfter === 0);
  const needsRestBetween =
    (currentBetween == null || currentBetween === 0) && targetBetween != null;

  return {
    rest_after_seconds: needsRestAfter ? targetAfter : currentAfter,
    rest_between_sets_seconds: needsRestBetween ? targetBetween : currentBetween,
    needsUpdate: needsRestAfter || needsRestBetween,
  };
}
