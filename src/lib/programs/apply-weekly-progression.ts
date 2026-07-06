import { parseSessionPhase, type SessionPhase } from "@/lib/programs/session-phase";
import { WARMUP_DURATION_SECONDS } from "@/lib/programs/warmup-prescription";

export const LOAD_PROGRESSION_NOTE =
  "Increase load by 5–10% from last week when you complete all prescribed sets and reps with good form.";

export type ProgressableExercise = {
  phase?: SessionPhase | string;
  duration_seconds?: number | null;
  duration_minutes?: number | null;
  sets?: number | null;
  reps?: number | null;
  note?: string | null;
};

function hasSetsReps(ex: ProgressableExercise): boolean {
  return (ex.sets != null && ex.sets > 0) || (ex.reps != null && ex.reps > 0);
}

function timedWorkSeconds(ex: ProgressableExercise): number | null {
  if (ex.duration_seconds != null && ex.duration_seconds > 0) return Math.ceil(ex.duration_seconds);
  if (ex.duration_minutes != null && ex.duration_minutes > 0) return Math.ceil(ex.duration_minutes) * 60;
  return null;
}

function bumpTimedWork(ex: ProgressableExercise, addSeconds: number): void {
  const current = timedWorkSeconds(ex);
  if (current == null) return;
  const next = current + addSeconds;
  if (ex.duration_seconds != null && ex.duration_seconds > 0) {
    ex.duration_seconds = next;
    ex.duration_minutes = null;
  } else {
    ex.duration_minutes = Math.ceil(next / 60);
    ex.duration_seconds = null;
  }
}

function mergeCoachNote(existing: string | null | undefined, addition: string): string {
  const base = existing?.trim() ?? "";
  if (!base) return addition;
  if (base.includes(addition)) return base;
  return `${base} ${addition}`;
}

/**
 * Apply cumulative week-over-week progression (one lever per week: reps → sets → load/time).
 * Week index 0 is the baseline template; week 1 = second calendar week, etc.
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
    for (let w = 1; w <= weekIndex; w++) {
      if ((w - 1) % 3 === 2) bumpTimedWork(ex, 5);
    }
    return ex;
  }

  for (let w = 1; w <= weekIndex; w++) {
    const lever = (w - 1) % 3;
    if (lever === 0) {
      if (ex.reps != null && ex.reps > 0) {
        ex.reps = ex.reps + 1;
      } else if (!hasSetsReps(ex)) {
        bumpTimedWork(ex, 5);
      }
    } else if (lever === 1) {
      if (ex.sets != null && ex.sets > 0) {
        ex.sets = Math.min(ex.sets + 1, 6);
      }
    } else if (hasSetsReps(ex)) {
      ex.note = mergeCoachNote(ex.note, LOAD_PROGRESSION_NOTE);
    } else {
      bumpTimedWork(ex, 10);
    }
  }

  return ex;
}

export const AI_COACH_WEEKLY_PROGRESSION_BLOCK = `### Weekly progression (automatic on save)

- Return **week-1 session templates only** (\`sessions_per_week\` entries). The app repeats them for \`duration_weeks\` and **applies progression each week** — you do not need duplicate sessions in \`sessions[]\`.
- Week 1 = your template as written. Later weeks auto-adjust in the app:
  - **Rep weeks:** +1 rep on main strength exercises (sets/reps).
  - **Set weeks:** +1 set on main strength exercises (max 6 sets).
  - **Load / time weeks:** coach note to increase load 5–10%, or +10s on timed main work.
- Warm-up stays **60s per exercise every week** — do not progress warm-up duration.
- Keep the **same core exercises** across the block; progression changes prescription, not exercise selection.`.trim();
