import type { ExercisePrescriptionType } from "@/lib/programs/program-exercises";

export type ExerciseProgramPrescriptionMode = "all" | "time_only" | "sets_reps_only";

export const EXERCISE_PROGRAM_PRESCRIPTION_MODE_OPTIONS: {
  id: ExerciseProgramPrescriptionMode;
  label: string;
  hint: string;
}[] = [
  {
    id: "all",
    label: "All modes",
    hint: "Sets & reps, time, or timed sets + rest when building programs.",
  },
  {
    id: "time_only",
    label: "Time-based only",
    hint: "Only timed work in programs (single time or timed sets + rest).",
  },
  {
    id: "sets_reps_only",
    label: "Sets & reps only",
    hint: "No timer in programs — prescribe sets and reps only.",
  },
];

export function parseExerciseProgramPrescriptionMode(
  value: unknown
): ExerciseProgramPrescriptionMode {
  if (value === "time_only" || value === "sets_reps_only") return value;
  return "all";
}

export function allowedProgramPrescriptionTypes(
  mode: ExerciseProgramPrescriptionMode
): ExercisePrescriptionType[] {
  switch (mode) {
    case "time_only":
      return ["time", "timed_intervals"];
    case "sets_reps_only":
      return ["sets_reps"];
    default:
      return ["sets_reps", "time", "timed_intervals"];
  }
}

export function defaultProgramPrescriptionType(
  mode: ExerciseProgramPrescriptionMode
): ExercisePrescriptionType {
  return allowedProgramPrescriptionTypes(mode)[0] ?? "sets_reps";
}

export function isProgramPrescriptionTypeAllowed(
  mode: ExerciseProgramPrescriptionMode,
  type: ExercisePrescriptionType
): boolean {
  return allowedProgramPrescriptionTypes(mode).includes(type);
}

/** Pick a valid prescription type for the exercise, preferring the requested one. */
export function clampProgramPrescriptionType(
  mode: ExerciseProgramPrescriptionMode,
  preferred: ExercisePrescriptionType
): ExercisePrescriptionType {
  if (isProgramPrescriptionTypeAllowed(mode, preferred)) return preferred;
  return defaultProgramPrescriptionType(mode);
}

export function programPrescriptionModeLabel(mode: ExerciseProgramPrescriptionMode): string {
  return EXERCISE_PROGRAM_PRESCRIPTION_MODE_OPTIONS.find((o) => o.id === mode)?.label ?? "All modes";
}
