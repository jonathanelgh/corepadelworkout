import { parseSessionPhase, type SessionPhase } from "@/lib/programs/session-phase";
import { WARMUP_DURATION_SECONDS } from "@/lib/programs/warmup-prescription";

/** Week-over-week increase applied to reps, timed work, sets, and numeric load values. */
export const WEEKLY_PROGRESSION_RATE = 0.1;

export type ProgressableExercise = {
  phase?: SessionPhase | string;
  duration_seconds?: number | null;
  duration_minutes?: number | null;
  sets?: number | null;
  reps?: number | null;
  load_prescription?: string | null;
  note?: string | null;
};

export function weeklyProgressionMultiplier(weekIndex: number): number {
  if (weekIndex <= 0) return 1;
  return Math.pow(1 + WEEKLY_PROGRESSION_RATE, weekIndex);
}

function timedWorkSeconds(ex: ProgressableExercise): number | null {
  if (ex.duration_seconds != null && ex.duration_seconds > 0) return Math.ceil(ex.duration_seconds);
  if (ex.duration_minutes != null && ex.duration_minutes > 0) return Math.ceil(ex.duration_minutes) * 60;
  return null;
}

function setTimedWorkSeconds(ex: ProgressableExercise, seconds: number): void {
  const next = Math.max(5, Math.round(seconds));
  if (ex.duration_seconds != null && ex.duration_seconds > 0) {
    ex.duration_seconds = next;
    ex.duration_minutes = null;
  } else {
    ex.duration_minutes = Math.max(1, Math.ceil(next / 60));
    ex.duration_seconds = null;
  }
}

function scaleCount(base: number, weekIndex: number, max?: number): number {
  const scaled = Math.round(base * weeklyProgressionMultiplier(weekIndex));
  const next = Math.max(base, scaled);
  return max != null ? Math.min(next, max) : next;
}

function isStrengthSetsRepsExercise(ex: ProgressableExercise): boolean {
  const timed = timedWorkSeconds(ex);
  const hasReps = ex.reps != null && ex.reps > 0;
  const hasSets = ex.sets != null && ex.sets > 0;
  return timed == null && (hasReps || hasSets);
}

/** Which strength lever progresses this week: 0 = reps, 1 = sets, 2 = load. */
function strengthProgressionAxis(weekIndex: number): 0 | 1 | 2 {
  return ((weekIndex - 1) % 3) as 0 | 1 | 2;
}

function scaleTimedSeconds(baseSeconds: number, weekIndex: number): number {
  const scaled = baseSeconds * weeklyProgressionMultiplier(weekIndex);
  const rounded = Math.round(scaled / 5) * 5;
  return Math.max(baseSeconds, Math.max(5, rounded));
}

function applyStrengthWeeklyProgression<T extends ProgressableExercise>(
  exercise: T,
  weekIndex: number
): T {
  const ex: T = { ...exercise };
  const baselineReps = ex.reps != null && ex.reps > 0 ? ex.reps : null;
  const baselineSets = ex.sets != null && ex.sets > 0 ? ex.sets : null;
  const hasLoad = Boolean(ex.load_prescription?.trim());

  const axis = strengthProgressionAxis(weekIndex);
  if (axis === 0 && baselineReps != null) {
    ex.reps = scaleCount(baselineReps, weekIndex);
    return ex;
  }
  if (axis === 1 && baselineSets != null) {
    ex.sets = scaleCount(baselineSets, weekIndex, 6);
    return ex;
  }
  if (axis === 2 && hasLoad) {
    ex.load_prescription = scaleLoadPrescription(ex.load_prescription, weekIndex);
    return ex;
  }
  if (baselineReps != null) {
    ex.reps = scaleCount(baselineReps, weekIndex);
  } else if (baselineSets != null) {
    ex.sets = scaleCount(baselineSets, weekIndex, 6);
  } else if (hasLoad) {
    ex.load_prescription = scaleLoadPrescription(ex.load_prescription, weekIndex);
  }
  return ex;
}

/** Scale a numeric load string like "12 kg" or "25lb" for later weeks. */
export function scaleLoadPrescription(
  value: string | null | undefined,
  weekIndex: number
): string | null {
  const trimmed = value?.trim();
  if (!trimmed || weekIndex <= 0) return trimmed ?? null;

  const match = trimmed.match(/(\d+(?:\.\d+)?)(\s*(?:kg|kilo|lb|lbs))?/i);
  if (!match) return trimmed;

  const base = Number.parseFloat(match[1]!);
  if (!Number.isFinite(base) || base <= 0) return trimmed;

  const scaled = base * weeklyProgressionMultiplier(weekIndex);
  const rounded = Math.round(scaled * 10) / 10;
  const unit = match[2]?.trim() ?? "";
  const prefix = trimmed.slice(0, match.index ?? 0);
  const suffix = trimmed.slice((match.index ?? 0) + match[0].length);
  const core = unit ? `${rounded} ${unit}` : String(rounded);
  return `${prefix}${core}${suffix}`.trim();
}

/**
 * Apply cumulative week-over-week progression from the week-1 template.
 * Week index 0 = baseline; week index 1 = second calendar week (~+10%), etc.
 */
export function applyWeeklyProgressionToExercise<T extends ProgressableExercise>(
  exercise: T,
  weekIndex: number
): T {
  if (weekIndex <= 0) return { ...exercise };

  const phase = parseSessionPhase(exercise.phase);
  const ex: T = { ...exercise };

  if (phase === "warmup") {
    return {
      ...ex,
      duration_seconds: WARMUP_DURATION_SECONDS,
      duration_minutes: null,
      sets: null,
      reps: null,
    };
  }

  if (phase === "cooldown") {
    const timed = timedWorkSeconds(ex);
    if (timed != null) {
      setTimedWorkSeconds(ex, scaleTimedSeconds(timed, weekIndex));
    }
    return ex;
  }

  const baselineReps = ex.reps != null && ex.reps > 0 ? ex.reps : null;
  const baselineSets = ex.sets != null && ex.sets > 0 ? ex.sets : null;
  const baselineTimed = timedWorkSeconds(ex);

  if (isStrengthSetsRepsExercise(ex)) {
    return applyStrengthWeeklyProgression(ex, weekIndex);
  }

  if (baselineReps != null) {
    ex.reps = scaleCount(baselineReps, weekIndex);
  }

  if (baselineSets != null) {
    ex.sets = scaleCount(baselineSets, weekIndex, 6);
  }

  if (baselineTimed != null) {
    setTimedWorkSeconds(ex, scaleTimedSeconds(baselineTimed, weekIndex));
  }

  if (ex.load_prescription?.trim()) {
    ex.load_prescription = scaleLoadPrescription(ex.load_prescription, weekIndex);
  }

  return ex;
}

export const AI_COACH_WEEKLY_PROGRESSION_BLOCK = `### Weekly progression (automatic on save)

- Return **week-1 session templates only** (\`sessions_per_week\` entries). The app repeats them for \`duration_weeks\` and **writes progressed prescriptions into each week's sessions** — do not duplicate sessions in \`sessions[]\`.
- Week 1 = your template as written. Each later week auto-applies **~10% progression** on the same exercises.
- **Strength (sets/reps):** progress **one lever per week** — reps **or** sets **or** load_prescription, never all three in the same week. Set week-1 \`load_prescription\` for weighted moves (e.g. \`"12 kg"\`); the app scales numeric loads on load weeks.
- **Timed main/cool-down work:** duration increases ~10% per week (rounded to 5s).
- Do **not** tell the athlete to increase load in \`note\` — the app handles load/reps/time in the prescription.
- Warm-up stays **60s per exercise every week** — do not progress warm-up duration.
- Keep the **same core exercises** across the block; progression changes prescription, not exercise selection.`.trim();
