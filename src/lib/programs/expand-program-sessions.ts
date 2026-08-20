import {
  applyWeeklyProgressionToExercise,
  type ProgressableExercise,
  type WeeklyProgressionOptions,
} from "@/lib/programs/apply-weekly-progression";
import type { OnboardingLevel } from "@/lib/member/onboarding";

export type ExpandableSession<T> = {
  name: string;
  description?: string | null;
  duration_minutes?: number | null;
  exercises: T[];
};

export type ExpandSessionsOptions = {
  /** Sessions per training week (defaults to template count). */
  sessionsPerWeek?: number;
  /** Apply level-aware progression when repeating templates across weeks. Default true. */
  applyWeeklyProgression?: boolean;
  trainingLevel?: OnboardingLevel | null;
};

/**
 * Resolve a full multi-week schedule from AI output.
 * Prefer an AI-authored full schedule when present; only expand week-1 templates as a fallback.
 */
export function expandSessionsToTarget<T extends ProgressableExercise>(
  sessions: ExpandableSession<T>[],
  targetCount: number,
  options?: ExpandSessionsOptions
): { sessions: ExpandableSession<T>[]; warnings: string[] } {
  if (targetCount <= 0 || sessions.length === 0) {
    return { sessions, warnings: [] };
  }

  const sessionsPerWeek = Math.max(1, options?.sessionsPerWeek ?? sessions.length);
  const warnings: string[] = [];

  // AI already returned a full (or oversized) multi-week schedule — keep it as authored.
  if (sessions.length >= targetCount) {
    if (sessions.length > targetCount) {
      warnings.push(
        `AI returned ${sessions.length} sessions; using the first ${targetCount} to match duration_weeks × sessions_per_week.`
      );
    } else {
      warnings.push("Using AI-authored full multi-week schedule (no week-1 template expansion).");
    }
    return { sessions: sessions.slice(0, targetCount), warnings };
  }

  const applyProgression = options?.applyWeeklyProgression !== false;
  const progressionOpts: WeeklyProgressionOptions = {
    trainingLevel: options?.trainingLevel ?? "beginner",
  };

  const template = sessions.slice(0, Math.min(sessionsPerWeek, sessions.length));
  if (template.length === 0) {
    return { sessions, warnings: [] };
  }

  if (sessions.length > template.length) {
    warnings.push(
      `AI returned a partial schedule (${sessions.length} sessions); expanding from the first ${template.length} as a week template.`
    );
  } else {
    warnings.push(
      `Built ${targetCount} sessions from a week-1 template with automatic weekly progression (fallback).`
    );
  }

  const out: ExpandableSession<T>[] = [];

  for (let i = 0; i < targetCount; i++) {
    const src = template[i % template.length]!;
    const weekIndex = Math.floor(i / sessionsPerWeek);
    const dayInWeek = (i % sessionsPerWeek) + 1;
    const weekNumber = weekIndex + 1;

    const name =
      targetCount <= sessionsPerWeek && i < template.length
        ? src.name
        : `Week ${weekNumber} — Day ${dayInWeek}`;

    out.push({
      name,
      description: src.description,
      duration_minutes: src.duration_minutes,
      exercises: src.exercises.map((ex) => {
        const copy = { ...ex };
        return applyProgression
          ? applyWeeklyProgressionToExercise(copy, weekIndex, progressionOpts)
          : copy;
      }),
    });
  }

  return { sessions: out, warnings };
}
