/** Default when the athlete/admin does not specify a length. */
export const DEFAULT_PROGRAM_DURATION_WEEKS = 8;
export const MIN_PROGRAM_DURATION_WEEKS = 1;
export const MAX_PROGRAM_DURATION_WEEKS = 16;

/**
 * Resolve program length in weeks.
 * Defaults to 8 when missing/invalid; honors explicit requests (e.g. 2 or 3 weeks).
 */
export function resolveProgramDurationWeeks(
  value: unknown,
  fallback: number = DEFAULT_PROGRAM_DURATION_WEEKS
): number {
  let n: number | null = null;
  if (typeof value === "number" && Number.isFinite(value)) {
    n = Math.floor(value);
  } else if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number.parseInt(value.trim(), 10);
    if (Number.isFinite(parsed)) n = parsed;
  }

  const base =
    n != null && n >= MIN_PROGRAM_DURATION_WEEKS
      ? n
      : Number.isFinite(fallback) && fallback >= MIN_PROGRAM_DURATION_WEEKS
        ? Math.floor(fallback)
        : DEFAULT_PROGRAM_DURATION_WEEKS;

  return Math.min(MAX_PROGRAM_DURATION_WEEKS, Math.max(MIN_PROGRAM_DURATION_WEEKS, base));
}
