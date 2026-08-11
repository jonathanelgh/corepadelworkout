import type { OnboardingLevel } from "@/lib/member/onboarding";
import { parseSessionPhase, type SessionPhase } from "@/lib/programs/session-phase";
import { WARMUP_DURATION_SECONDS } from "@/lib/programs/warmup-prescription";

export type ProgressableExercise = {
  phase?: SessionPhase | string;
  duration_seconds?: number | null;
  duration_minutes?: number | null;
  sets?: number | null;
  reps?: number | null;
  load_prescription?: string | null;
  note?: string | null;
};

export type WeeklyProgressionOptions = {
  trainingLevel?: OnboardingLevel | null;
  /** Cap for beginner/int-adv rep increases (optional). */
  maxReps?: number | null;
};

/**
 * Beginner reps-only offsets from week-1 baseline (weekIndex 0 = week 1).
 * Matches: hold / hold / +1 / hold / +2 / hold / +3 / +4
 * Timed main work uses the same offsets in **seconds** (× SECONDS_PER_PROGRESS_STEP).
 */
const BEGINNER_REP_OFFSETS = [0, 0, 1, 1, 2, 2, 3, 4] as const;

/** Each progression step adds this many seconds to timed main work (mirrors +1 rep). */
const SECONDS_PER_PROGRESS_STEP = 5;

/** Soft cap so short drills don't balloon (e.g. 30s → max ~90s over the block). */
const MAX_TIMED_DURATION_MULTIPLIER = 3;

/**
 * Intermediate/Advanced: +1 rep (or +1 timed step) each week from week-1 baseline.
 * Never resets — load bumps (when set) are additive, not a replacement for reps.
 */
function intermediateRepOffset(weekIndex: number): number {
  if (weekIndex <= 0) return 0;
  return weekIndex;
}

function timedWorkSeconds(ex: ProgressableExercise): number | null {
  if (ex.duration_seconds != null && ex.duration_seconds > 0) return Math.ceil(ex.duration_seconds);
  if (ex.duration_minutes != null && ex.duration_minutes > 0) return Math.ceil(ex.duration_minutes) * 60;
  return null;
}

function isStrengthSetsRepsExercise(ex: ProgressableExercise): boolean {
  const timed = timedWorkSeconds(ex);
  const hasReps = ex.reps != null && ex.reps > 0;
  const hasSets = ex.sets != null && ex.sets > 0;
  return timed == null && (hasReps || hasSets);
}

function isTimedMainExercise(ex: ProgressableExercise): boolean {
  return timedWorkSeconds(ex) != null;
}

function applyTimedDurationOffset(baselineSeconds: number, offsetSteps: number): number {
  if (offsetSteps <= 0) return baselineSeconds;
  const next = baselineSeconds + offsetSteps * SECONDS_PER_PROGRESS_STEP;
  const cap = Math.max(baselineSeconds, baselineSeconds * MAX_TIMED_DURATION_MULTIPLIER);
  return Math.min(cap, Math.max(baselineSeconds, next));
}

function parseLoadNumber(value: string): {
  amount: number;
  unit: string;
  prefix: string;
  suffix: string;
  matchIndex: number;
  matchLength: number;
} | null {
  const match = value.match(/(\d+(?:\.\d+)?)(\s*(?:kg|kilo|lb|lbs))?/i);
  if (!match) return null;
  const amount = Number.parseFloat(match[1]!);
  if (!Number.isFinite(amount) || amount <= 0) return null;
  return {
    amount,
    unit: match[2]?.trim() ?? "",
    prefix: value.slice(0, match.index ?? 0),
    suffix: value.slice((match.index ?? 0) + match[0].length),
    matchIndex: match.index ?? 0,
    matchLength: match[0].length,
  };
}

function formatLoad(amount: number, unit: string, prefix: string, suffix: string): string {
  const rounded = Math.round(amount * 10) / 10;
  const core = unit ? `${rounded} ${unit}` : String(rounded);
  return `${prefix}${core}${suffix}`.trim();
}

/**
 * Smallest equipment-friendly bump in the 2.5–5% band (prefer ~3.75%).
 * Steps: 0.5 / 1 / 2.5 depending on unit size.
 */
export function bumpLoadByPercent(
  value: string | null | undefined,
  percent = 0.0375
): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return trimmed ?? null;
  const parsed = parseLoadNumber(trimmed);
  if (!parsed) return trimmed;

  const target = parsed.amount * (1 + percent);
  const unitLower = parsed.unit.toLowerCase();
  let step = 1;
  if (unitLower.includes("kg") || unitLower.includes("kilo")) {
    step = parsed.amount < 10 ? 0.5 : 1;
  } else if (unitLower.includes("lb")) {
    step = parsed.amount < 20 ? 1 : 2.5;
  } else {
    step = parsed.amount < 10 ? 0.5 : 1;
  }

  let next = Math.ceil(target / step) * step;
  const minBump = parsed.amount * 1.025;
  const maxBump = parsed.amount * 1.05;
  if (next < minBump) next = Math.ceil(minBump / step) * step;
  if (next > maxBump && next - step >= parsed.amount) {
    const alt = next - step;
    if (alt >= minBump) next = alt;
  }
  if (next <= parsed.amount) next = parsed.amount + step;

  return formatLoad(next, parsed.unit, parsed.prefix, parsed.suffix);
}

/** @deprecated Prefer bumpLoadByPercent / level-aware progression. Kept for callers. */
export function scaleLoadPrescription(
  value: string | null | undefined,
  weekIndex: number
): string | null {
  const trimmed = value?.trim();
  if (!trimmed || weekIndex <= 0) return trimmed ?? null;
  let out = trimmed;
  for (let i = 0; i < weekIndex; i++) {
    out = bumpLoadByPercent(out) ?? out;
  }
  return out;
}

function applyBeginnerReps(
  baselineReps: number,
  weekIndex: number,
  maxReps?: number | null
): number {
  const offset = BEGINNER_REP_OFFSETS[Math.min(weekIndex, BEGINNER_REP_OFFSETS.length - 1)] ?? 0;
  let next = baselineReps + offset;
  if (maxReps != null && maxReps > 0) next = Math.min(next, maxReps);
  return Math.max(baselineReps, next);
}

function applyIntermediateReps(
  baselineReps: number,
  weekIndex: number,
  maxReps?: number | null
): number {
  const offset = intermediateRepOffset(weekIndex);
  let next = baselineReps + offset;
  if (maxReps != null && maxReps > 0) next = Math.min(next, maxReps);
  return Math.max(baselineReps, next);
}

/**
 * Optional load bumps when an admin set a numeric load_prescription.
 * Starts at week index 4 (calendar week 5) and stacks on top of continued rep progression.
 */
function applyIntermediateLoad(
  baselineLoad: string | null | undefined,
  weekIndex: number
): string | null {
  const trimmed = baselineLoad?.trim();
  if (!trimmed) return trimmed ?? null;
  if (weekIndex < 4) return trimmed;

  let out = trimmed;
  const loadSteps = weekIndex - 3; // week5 → 1, week6 → 2, ...
  for (let i = 0; i < loadSteps; i++) {
    out = bumpLoadByPercent(out) ?? out;
  }
  return out;
}

/**
 * Apply Core Padel weekly progression from the week-1 template.
 * Week index 0 = week 1 baseline.
 * Sets (and timed rounds) are never auto-progressed. Warm-up / cool-down are never progressed.
 * Main timed work progresses **duration_seconds** with the same step pattern as reps.
 */
export function applyWeeklyProgressionToExercise<T extends ProgressableExercise>(
  exercise: T,
  weekIndex: number,
  options?: WeeklyProgressionOptions
): T {
  if (weekIndex <= 0) return { ...exercise };

  const phase = parseSessionPhase(exercise.phase);
  const ex: T = { ...exercise };
  const level: OnboardingLevel = options?.trainingLevel ?? "beginner";

  if (phase === "warmup") {
    return {
      ...ex,
      duration_seconds: WARMUP_DURATION_SECONDS,
      duration_minutes: null,
      sets: null,
      reps: null,
    };
  }

  // Cool-down: no progressive overload — keep week-1 prescription.
  if (phase === "cooldown") {
    return ex;
  }

  if (isTimedMainExercise(ex)) {
    const baseline = timedWorkSeconds(ex);
    if (baseline == null) return ex;

    const offsetSteps =
      level === "beginner"
        ? (BEGINNER_REP_OFFSETS[Math.min(weekIndex, BEGINNER_REP_OFFSETS.length - 1)] ?? 0)
        : intermediateRepOffset(weekIndex);

    const nextSeconds = applyTimedDurationOffset(baseline, offsetSteps);
    ex.duration_seconds = nextSeconds;
    ex.duration_minutes = null;
    return ex;
  }

  if (!isStrengthSetsRepsExercise(ex)) {
    return ex;
  }

  const baselineReps = ex.reps != null && ex.reps > 0 ? ex.reps : null;
  // Sets stay fixed for the 8-week block.
  if (baselineReps != null) {
    if (level === "beginner") {
      ex.reps = applyBeginnerReps(baselineReps, weekIndex, options?.maxReps);
      // Load unchanged for beginners.
    } else {
      ex.reps = applyIntermediateReps(baselineReps, weekIndex, options?.maxReps);
      if (ex.load_prescription?.trim()) {
        ex.load_prescription = applyIntermediateLoad(ex.load_prescription, weekIndex);
      }
    }
  } else if (level !== "beginner" && ex.load_prescription?.trim() && weekIndex >= 4) {
    ex.load_prescription = applyIntermediateLoad(ex.load_prescription, weekIndex);
  }

  return ex;
}

export const AI_COACH_WEEKLY_PROGRESSION_BLOCK = `### Weekly progression (automatic on save — app-owned)

- Programs default to **8 weeks**, or the requested \`duration_weeks\` (e.g. 2 or 3). Return **week-1 templates only** (\`sessions_per_week\` entries). The app expands to \`duration_weeks\` and writes each week's prescription.
- Never return all sessions for every week in the block.
- **Sets / timed rounds never auto-progress** — keep sets fixed across the block.
- **Sets×reps (main):**
  - **Beginner:** progress **reps only** (hold / +1 pattern). Sets stay fixed. Leave \`load_prescription\` blank.
  - **Intermediate / Advanced:** **+1 rep each week** from week-1 baseline through the last week — never reset. If an admin set a numeric \`load_prescription\`, also bump load from week 5 onward when the block is long enough (reps keep climbing).
- **Timed main work** (duration + rounds): progress **duration_seconds** with the **same weekly step pattern** as reps (+5 seconds per step). Rounds (\`sets\`) stay fixed. Warm-up and cool-down: no duration progression.
- Leave \`load_prescription\` **blank** — athletes choose a weight that fits their strength. Never invent kg/lb values.
- Warm-up and cool-down: **no** progressive overload.
- Never put progression instructions in \`note\`.`.trim();
