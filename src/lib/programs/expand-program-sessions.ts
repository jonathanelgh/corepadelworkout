import {
  applyWeeklyProgressionToExercise,
  type ProgressableExercise,
} from "@/lib/programs/apply-weekly-progression";

export type ExpandableSession<T> = {
  name: string;
  description?: string | null;
  duration_minutes?: number | null;
  exercises: T[];
};

export type ExpandSessionsOptions = {
  /** Sessions per training week (defaults to template count). */
  sessionsPerWeek?: number;
  /** Apply reps/sets/load progression when repeating templates across weeks. Default true. */
  applyWeeklyProgression?: boolean;
};

/**
 * Build a full multi-week schedule from week-1 session templates.
 * Uses the first `sessionsPerWeek` entries as the repeating template and applies weekly progression.
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
  const applyProgression = options?.applyWeeklyProgression !== false;
  const warnings: string[] = [];

  const template = sessions.slice(0, Math.min(sessionsPerWeek, sessions.length));
  if (template.length === 0) {
    return { sessions, warnings: [] };
  }

  if (sessions.length > template.length) {
    warnings.push(
      `Used the first ${template.length} session(s) as the week-1 template; extra AI sessions were ignored.`
    );
  }

  const needsRepeat = targetCount > template.length;
  if (needsRepeat) {
    warnings.push(
      `Built ${targetCount} sessions from the week-1 template with automatic weekly progression.`
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
          ? applyWeeklyProgressionToExercise(copy, weekIndex)
          : copy;
      }),
    });
  }

  return { sessions: out, warnings };
}
