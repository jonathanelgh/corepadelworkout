export const PROGRAM_FORMATS = ["training_plan", "single_workout"] as const;

export type ProgramFormat = (typeof PROGRAM_FORMATS)[number];

export function parseProgramFormat(value: unknown): ProgramFormat {
  if (value === "single_workout") return "single_workout";
  return "training_plan";
}

export function usesProgramProgress(format: ProgramFormat): boolean {
  return format === "training_plan";
}

export function formatLabel(format: ProgramFormat): string {
  return format === "single_workout" ? "Single workout" : "Training plan";
}

export function startCtaLabel(format: ProgramFormat, opts?: { sessionName?: string | null }): string {
  if (format === "single_workout") return "Start workout";
  if (opts?.sessionName) return `Continue · ${opts.sessionName}`;
  return "Start program";
}
