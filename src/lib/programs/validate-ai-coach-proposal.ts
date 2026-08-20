import type { ExerciseCatalogEntry } from "@/lib/programs/exercise-catalog";
import type { ProgramProposal, WorkoutProposal, WorkoutProposalExercise } from "@/lib/programs/ai-coach-gemini";

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
};

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

function getOptionalRpe(ex: WorkoutProposalExercise): unknown {
  return (ex as unknown as { rpe?: unknown }).rpe;
}
function getOptionalIntensity(ex: WorkoutProposalExercise): unknown {
  return (ex as unknown as { intensity?: unknown }).intensity;
}

function hasOwnKey(obj: unknown, key: string): boolean {
  if (!obj || (typeof obj !== "object" && typeof obj !== "function")) return false;
  return Object.prototype.hasOwnProperty.call(obj, key);
}

/** Admin-facing coaching summary — require enough substance for a real explanation. */
function hasSubstantialDesignRationale(v: unknown): boolean {
  return typeof v === "string" && v.trim().length >= 120;
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

  // Sets×reps main work needs RPE-based load guidance in coach explanations (not exact kg/lb).
  if (ex.phase === "main" && !isTimed && sets != null && reps != null) {
    const noteText = typeof ex.note === "string" ? ex.note : "";
    const intensityText =
      typeof getOptionalIntensity(ex) === "string" ? String(getOptionalIntensity(ex)) : "";
    const rpeText = typeof getOptionalRpe(ex) === "string" ? String(getOptionalRpe(ex)) : "";
    const explanation = `${noteText} ${intensityText}`.toLowerCase();
    const hasRpeInExplanation = /\brpe\b/.test(explanation);
    if (!requireNonEmptyString(rpeText) || !hasRpeInExplanation) {
      errors.push({
        path,
        message:
          "Sets×reps main exercise must set rpe and include RPE-based load guidance in note and/or intensity (e.g. \"choose a weight that hits RPE 8\") — never exact kg/lb.",
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
  }

  // RPE/intensity are optional until tool schema + DB columns are wired up.
  // When the model includes these keys, they must be non-empty strings.
  const rpeKeyPresent = hasOwnKey(ex as unknown, "rpe");
  const intensityKeyPresent = hasOwnKey(ex as unknown, "intensity");
  const rpeVal = getOptionalRpe(ex);
  const intensityVal = getOptionalIntensity(ex);

  if (rpeKeyPresent || intensityKeyPresent) {
    if (!requireNonEmptyString(rpeVal)) {
      errors.push({ path, message: "Exercise is missing required rpe (non-empty string)." });
    }
    if (!requireNonEmptyString(intensityVal)) {
      errors.push({ path, message: "Exercise is missing required intensity (non-empty string)." });
    }
  }

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
  });

  return errors.length ? { ok: false, errors } : { ok: true };
}

