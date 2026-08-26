import type { ExerciseCatalogEntry } from "@/lib/programs/exercise-catalog";
import type { ProgramProposal, WorkoutProposal, WorkoutProposalExercise } from "@/lib/programs/ai-coach-gemini";
import {
  estimateWorkoutMinutes,
  estimateWorkoutProposalMinutes,
  minMainExercisesForTargetMinutes,
} from "@/lib/programs/estimate-workout-minutes";
import { coerceRpeField } from "@/lib/programs/rpe";
import { exerciseNeedsRpeGuidance } from "@/lib/programs/ai-rpe-guidance";

export type AiCoachProposalValidationError = {
  /** Human readable error message (can be shown back to the AI). */
  message: string;
  /** Stable pointer so we can pinpoint failing exercise (if applicable). */
  path?: string;
};

export type AiCoachProposalValidationResult =
  | { ok: true }
  | { ok: false; errors: AiCoachProposalValidationError[] };

type ValidatorOptions = {
  exerciseCatalogById: Map<string, ExerciseCatalogEntry>;
  /** Consultation / brief target session length in minutes. */
  targetMinutes?: number | null;
};

/** Minimum fraction of target minutes the estimated session must reach. */
const MIN_DURATION_FRACTION = 0.75;
/** Soft ceiling so sessions aren't wildly overfilled. */
const MAX_DURATION_FRACTION = 1.4;

function countMainExercises(
  exercises: Array<Pick<WorkoutProposalExercise, "phase">>
): number {
  return exercises.filter((ex) => ex.phase === "main").length;
}

function validateSessionDurationFit(
  exercises: WorkoutProposalExercise[],
  targetMinutes: number,
  label: string
): AiCoachProposalValidationError[] {
  const errors: AiCoachProposalValidationError[] = [];
  if (!Number.isFinite(targetMinutes) || targetMinutes < 8) return errors;

  const estimated = estimateWorkoutMinutes(exercises);
  const minOk = Math.ceil(targetMinutes * MIN_DURATION_FRACTION);
  const maxOk = Math.ceil(targetMinutes * MAX_DURATION_FRACTION);
  const minMains = minMainExercisesForTargetMinutes(targetMinutes);
  const mains = countMainExercises(exercises);

  if (estimated < minOk) {
    errors.push({
      message: `${label} is too short: estimated ~${estimated} min vs target ~${targetMinutes} min (need ≥${minOk}). Add more main-block work (extra exercises and/or more sets) so total work+rest fills the session. Do not pad only with warm-up/cool-down.`,
    });
  } else if (estimated > maxOk) {
    errors.push({
      message: `${label} is too long: estimated ~${estimated} min vs target ~${targetMinutes} min (keep ≤${maxOk}). Trim volume or rest so it fits.`,
    });
  }

  if (mains < minMains) {
    errors.push({
      message: `${label} has only ${mains} main exercise(s); for a ~${targetMinutes}-minute session include at least ${minMains} distinct main-phase exercises (not just warm-up/cool-down).`,
    });
  }

  return errors;
}

function isFinitePositiveNumber(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v) && v > 0;
}

function isFiniteNonNegativeNumber(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v) && v >= 0;
}

function requireNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

function getDurationSeconds(ex: WorkoutProposalExercise): number | null {
  const ds = ex.duration_seconds;
  if (isFinitePositiveNumber(ds)) return Math.ceil(ds);
  const dm = ex.duration_minutes;
  if (isFinitePositiveNumber(dm)) return Math.ceil(dm) * 60;
  return null;
}

function getSetsCount(ex: WorkoutProposalExercise): number | null {
  const s = ex.sets;
  if (typeof s === "number" && Number.isFinite(s) && s > 0) return Math.ceil(s);
  return null;
}

function getRepsCount(ex: WorkoutProposalExercise): number | null {
  const r = ex.reps;
  if (typeof r === "number" && Number.isFinite(r) && r > 0) return Math.ceil(r);
  return null;
}

function hasRestBetweenSets(ex: WorkoutProposalExercise): boolean {
  return isFiniteNonNegativeNumber(ex.rest_between_sets_seconds) && ex.rest_between_sets_seconds > 0;
}

function hasRestBetweenSides(ex: WorkoutProposalExercise): boolean {
  return (
    isFiniteNonNegativeNumber(ex.rest_between_sides_seconds) &&
    ex.rest_between_sides_seconds > 0
  );
}

function hasOptionalCoachNote(ex: WorkoutProposalExercise): boolean {
  return requireNonEmptyString(ex.note);
}

/** Admin-facing coaching summary — require enough substance for a real explanation. */
function hasSubstantialDesignRationale(v: unknown): boolean {
  return typeof v === "string" && v.trim().length >= 120;
}

function noteHasMatchingBetweenSetsRest(
  note: string,
  restSeconds: number,
  bothSides: boolean
): boolean {
  const n = Math.round(restSeconds);
  if (bothSides) {
    return new RegExp(
      `rest\\s+${n}\\s*sec(?:onds)?\\s+after\\s+both\\s+sides`,
      "i"
    ).test(note);
  }
  return new RegExp(`rest\\s+${n}\\s*sec(?:onds)?\\s+between\\s+sets`, "i").test(note);
}

function validateExerciseTechnical(
  ex: WorkoutProposalExercise,
  opts: ValidatorOptions,
  sessionPath: string,
  exerciseIndex: number
): AiCoachProposalValidationError[] {
  const errors: AiCoachProposalValidationError[] = [];

  const path = `${sessionPath}.exercises[${exerciseIndex}]`;

  if (!requireNonEmptyString(ex.exercise_id)) {
    errors.push({ path, message: "Exercise is missing a valid exercise_id." });
    return errors;
  }

  const catalogEntry = opts.exerciseCatalogById.get(ex.exercise_id);
  if (!catalogEntry) {
    errors.push({
      path,
      message: `Exercise_id ${ex.exercise_id} is not in the allowed catalog for this generation.`,
    });
    return errors;
  }

  if (ex.phase !== "warmup" && ex.phase !== "main" && ex.phase !== "cooldown") {
    errors.push({ path, message: "Exercise is missing/invalid phase (warmup|main|cooldown)." });
  }

  // rest_after_seconds is required by the tool schema (and is required by save/player logic).
  if (!isFiniteNonNegativeNumber(ex.rest_after_seconds)) {
    errors.push({
      path,
      message: "Exercise is missing rest_after_seconds (required) or it is not a valid number.",
    });
  }

  const durationSeconds = getDurationSeconds(ex);
  const isTimed = durationSeconds != null;
  const sets = getSetsCount(ex);
  const reps = getRepsCount(ex);
  const bothSides = Boolean(catalogEntry.bothSides);

  // Note (coach notes) is important for player UX and debugging. Require it on main work.
  if (ex.phase === "main") {
    if (!hasOptionalCoachNote(ex)) {
      errors.push({ path, message: "Main exercise is missing coach note (note)." });
    }
  }

  // RPE only when effort must be athlete-regulated — structured `rpe` is enough for UI.
  if (exerciseNeedsRpeGuidance(catalogEntry, ex, isTimed, sets, reps)) {
    if (!coerceRpeField(ex.rpe)) {
      errors.push({
        path,
        message:
          'Effort-regulated exercise must set rpe (e.g. "7" or "8-9"). Skip RPE for mobility, warm-up, cool-down, technique, and standard isometric holds.',
      });
    }
  }

  if (isTimed) {
    if (ex.duration_seconds == null && ex.duration_minutes == null) {
      errors.push({ path, message: "Timed exercise is missing duration_seconds/duration_minutes." });
    }

    // Timed work may be a single hold or multi-round intervals — AI decides.
    // If multi-round, rest between rounds is required.
    if (sets != null && sets > 1) {
      if (!hasRestBetweenSets(ex)) {
        errors.push({
          path,
          message: "Timed exercise with multiple rounds must include rest_between_sets_seconds > 0.",
        });
      }
    }

    // For bilateral timed work, the app needs an explicit between-sides rest.
    if (bothSides) {
      if (!hasRestBetweenSides(ex)) {
        errors.push({
          path,
          message: "Bilateral timed exercise must include rest_between_sides_seconds > 0.",
        });
      }
    }
  } else {
    // Sets×reps mode: require both sets and reps.
    if (sets == null || reps == null) {
      errors.push({
        path,
        message: "Sets×reps exercise must include BOTH sets and reps (positive numbers).",
      });
    }

    if (sets != null && sets > 1 && !hasRestBetweenSets(ex)) {
      errors.push({
        path,
        message: "Sets×reps exercise with multiple sets must include rest_between_sets_seconds > 0.",
      });
    }

    if (sets != null && sets > 1 && hasRestBetweenSets(ex)) {
      const noteText = typeof ex.note === "string" ? ex.note : "";
      const restSecs = Math.round(ex.rest_between_sets_seconds!);
      if (!noteHasMatchingBetweenSetsRest(noteText, restSecs, bothSides)) {
        errors.push({
          path,
          message: bothSides
            ? `Sets×reps both_sides note must include "Rest ${restSecs} seconds after both sides are completed" matching rest_between_sets_seconds=${restSecs}.`
            : `Sets×reps note must include "Rest ${restSecs} sec between sets" matching rest_between_sets_seconds=${restSecs} (do not invent a mismatched 30s cue).`,
        });
      }
    }
  }

  // Empty/omitted rpe on effort-regulated work is already covered above.
  // Intensity is optional (removed from athlete/admin UI).

  return errors;
}

export function validateWorkoutProposal(
  proposal: WorkoutProposal,
  opts: ValidatorOptions
): AiCoachProposalValidationResult {
  const errors: AiCoachProposalValidationError[] = [];

  if (!requireNonEmptyString(proposal.title)) {
    errors.push({ message: "Workout proposal is missing a non-empty title." });
  }
  if (!requireNonEmptyString(proposal.description)) {
    errors.push({ message: "Workout proposal is missing a non-empty description." });
  }
  if (!hasSubstantialDesignRationale(proposal.design_rationale)) {
    errors.push({
      message:
        "Workout proposal is missing design_rationale — provide a thorough coaching summary (structure, exercise choices, and why times/sets/reps).",
    });
  }

  if (!Array.isArray(proposal.exercises) || proposal.exercises.length === 0) {
    errors.push({ message: "Workout proposal must include at least one exercise." });
    return { ok: false, errors };
  }

  proposal.exercises.forEach((ex, idx) => {
    errors.push(
      ...validateExerciseTechnical(ex, opts, "workout", idx)
    );
  });

  const target =
    opts.targetMinutes != null && Number.isFinite(opts.targetMinutes)
      ? Math.round(opts.targetMinutes)
      : null;
  if (target != null && target >= 8) {
    errors.push(...validateSessionDurationFit(proposal.exercises, target, "Workout"));
    const estimated = estimateWorkoutProposalMinutes(proposal);
    if (
      requireNonEmptyString(proposal.title) &&
      /\b\d{1,3}\s*[- ]?\s*min(ute)?s?\b/i.test(proposal.title)
    ) {
      const claimed = Number.parseInt(
        proposal.title.match(/\b(\d{1,3})\s*[- ]?\s*min(ute)?s?\b/i)?.[1] ?? "",
        10
      );
      if (Number.isFinite(claimed) && Math.abs(claimed - estimated) > Math.max(8, target * 0.25)) {
        errors.push({
          message: `Title claims ~${claimed} minutes but the session estimates to ~${estimated} min. Either fill the session to match the title/target (~${target} min) or rename the title to the real duration — do not advertise a longer workout than you prescribe.`,
        });
      }
    }
  }

  return errors.length ? { ok: false, errors } : { ok: true };
}

export function validateProgramProposal(
  proposal: ProgramProposal,
  opts: ValidatorOptions
): AiCoachProposalValidationResult {
  const errors: AiCoachProposalValidationError[] = [];

  if (!requireNonEmptyString(proposal.title)) {
    errors.push({ message: "Program proposal is missing a non-empty title." });
  }
  if (!requireNonEmptyString(proposal.description)) {
    errors.push({ message: "Program proposal is missing a non-empty description." });
  }
  if (!hasSubstantialDesignRationale(proposal.design_rationale)) {
    errors.push({
      message:
        "Program proposal is missing design_rationale — provide a thorough coaching summary (structure, exercise choices, prescriptions, and week-to-week plan).",
    });
  }
  if (!isFinitePositiveNumber(proposal.duration_weeks)) {
    errors.push({ message: "Program proposal is missing duration_weeks (positive number)." });
  }
  if (!isFinitePositiveNumber(proposal.sessions_per_week)) {
    errors.push({ message: "Program proposal is missing sessions_per_week (positive number)." });
  }

  if (!Array.isArray(proposal.sessions) || proposal.sessions.length === 0) {
    errors.push({ message: "Program proposal must include at least one session." });
    return { ok: false, errors };
  }

  const weeks =
    typeof proposal.duration_weeks === "number" && Number.isFinite(proposal.duration_weeks)
      ? Math.floor(proposal.duration_weeks)
      : null;
  const spw =
    typeof proposal.sessions_per_week === "number" && Number.isFinite(proposal.sessions_per_week)
      ? Math.floor(proposal.sessions_per_week)
      : null;
  if (weeks != null && weeks > 0 && spw != null && spw > 0) {
    const expected = weeks * spw;
    if (proposal.sessions.length !== expected) {
      errors.push({
        message: `Program must include all ${expected} sessions (duration_weeks=${weeks} × sessions_per_week=${spw}). Got ${proposal.sessions.length}. Return every week — do not return week-1 templates only.`,
      });
    }
  }

  const target =
    opts.targetMinutes != null && Number.isFinite(opts.targetMinutes)
      ? Math.round(opts.targetMinutes)
      : typeof proposal.minutes_per_session === "number" &&
          Number.isFinite(proposal.minutes_per_session)
        ? Math.round(proposal.minutes_per_session)
        : null;

  proposal.sessions.forEach((session, sIdx) => {
    if (!requireNonEmptyString(session.name)) {
      errors.push({ message: `Session[${sIdx}] is missing a non-empty name.` });
    }
    if (!Array.isArray(session.exercises) || session.exercises.length === 0) {
      errors.push({ message: `Session[${sIdx}] (${session.name}) must include exercises.` });
      return;
    }

    session.exercises.forEach((ex, eIdx) => {
      errors.push(
        ...validateExerciseTechnical(ex, opts, `program.sessions[${sIdx}]`, eIdx)
      );
    });

    if (target != null && target >= 8) {
      const label = `Session[${sIdx}] (${session.name || "unnamed"})`;
      errors.push(...validateSessionDurationFit(session.exercises, target, label));
    }
  });

  return errors.length ? { ok: false, errors } : { ok: true };
}

