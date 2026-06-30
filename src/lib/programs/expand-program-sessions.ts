export type ExpandableSession<T> = {
  name: string;
  description?: string | null;
  duration_minutes?: number | null;
  exercises: T[];
};

/** Repeat a weekly session template until the target count is reached. */
export function expandSessionsToTarget<T>(
  sessions: ExpandableSession<T>[],
  targetCount: number
): { sessions: ExpandableSession<T>[]; warnings: string[] } {
  if (targetCount <= 0 || sessions.length === 0 || sessions.length >= targetCount) {
    return { sessions, warnings: [] };
  }

  const warnings = [
    `AI returned ${sessions.length} session(s) but ${targetCount} were required — repeated the weekly template to fill the schedule.`,
  ];
  const template = sessions;
  const out: ExpandableSession<T>[] = [];

  for (let i = 0; i < targetCount; i++) {
    const src = template[i % template.length]!;
    const cycle = Math.floor(i / template.length) + 1;
    const name =
      i < template.length
        ? src.name
        : template.length === 1
          ? `Day ${i + 1}`
          : `${src.name} — Week ${cycle}`;
    out.push({
      name,
      description: src.description,
      duration_minutes: src.duration_minutes,
      exercises: src.exercises.map((ex) => ({ ...ex })),
    });
  }

  return { sessions: out, warnings };
}
