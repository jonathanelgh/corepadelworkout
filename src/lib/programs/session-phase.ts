import type { ProgramExerciseItem } from "@/lib/programs/program-exercises";

export type SessionPhase = "warmup" | "main" | "cooldown";

export const SESSION_PHASE_LABELS: Record<SessionPhase, string> = {
  warmup: "Warm-up",
  main: "Main workout",
  cooldown: "Cool-down",
};

export function parseSessionPhase(raw: unknown): SessionPhase {
  const s = typeof raw === "string" ? raw.trim().toLowerCase().replace(/_/g, "-") : "";
  if (s === "warmup" || s === "warm-up" || s === "warm up") return "warmup";
  if (s === "cooldown" || s === "cool-down" || s === "cool down") return "cooldown";
  return "main";
}

export function parseChoiceGroup(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const t = raw.trim();
  return t.length > 0 ? t.slice(0, 64) : null;
}

/** Assign phases by position when the model omitted them. */
export function normalizeExercisePhases<T extends { phase?: SessionPhase }>(exercises: T[]): T[] {
  if (exercises.length === 0) return exercises;
  const hasStructure = exercises.some((e) => e.phase === "warmup" || e.phase === "cooldown");
  if (hasStructure) return exercises;

  const n = exercises.length;
  const warmCount = n <= 3 ? 1 : n <= 6 ? 2 : Math.min(3, Math.max(1, Math.floor(n * 0.2)));
  const coolCount = n <= 3 ? 1 : n <= 6 ? 2 : Math.min(3, Math.max(1, Math.floor(n * 0.2)));
  const coolStart = Math.max(warmCount, n - coolCount);

  return exercises.map((ex, i) => ({
    ...ex,
    phase: (i < warmCount ? "warmup" : i >= coolStart ? "cooldown" : "main") as SessionPhase,
  }));
}

export type WorkoutChoiceGroup = {
  id: string;
  phase: SessionPhase;
  options: ProgramExerciseItem[];
};

export function listChoiceGroups(exercises: ProgramExerciseItem[]): WorkoutChoiceGroup[] {
  const groups: WorkoutChoiceGroup[] = [];
  const seen = new Set<string>();

  for (const ex of exercises) {
    if (!ex.choiceGroup || seen.has(ex.choiceGroup)) continue;
    seen.add(ex.choiceGroup);
    groups.push({
      id: ex.choiceGroup,
      phase: ex.sessionPhase,
      options: exercises.filter((e) => e.choiceGroup === ex.choiceGroup),
    });
  }

  return groups;
}

export function defaultChoiceSelections(groups: WorkoutChoiceGroup[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const g of groups) {
    if (g.options[0]?.id) out[g.id] = g.options[0].id;
  }
  return out;
}

/** Collapse OR-alternatives to one exercise per choice_group. */
export function resolveWorkoutPlaylist(
  exercises: ProgramExerciseItem[],
  selections: Record<string, string>
): ProgramExerciseItem[] {
  const resolved: ProgramExerciseItem[] = [];
  const pickedGroups = new Set<string>();

  for (const ex of exercises) {
    if (!ex.choiceGroup) {
      resolved.push(ex);
      continue;
    }
    if (pickedGroups.has(ex.choiceGroup)) continue;
    pickedGroups.add(ex.choiceGroup);

    const group = exercises.filter((e) => e.choiceGroup === ex.choiceGroup);
    const selectedId = selections[ex.choiceGroup];
    const chosen = group.find((e) => e.id === selectedId) ?? group[0];
    if (chosen) resolved.push(chosen);
  }

  return resolved;
}

export function groupExercisesByPhase<T extends { sessionPhase: SessionPhase }>(
  exercises: T[]
): { phase: SessionPhase; items: T[] }[] {
  const order: SessionPhase[] = ["warmup", "main", "cooldown"];
  const buckets = new Map<SessionPhase, T[]>();
  for (const ex of exercises) {
    const list = buckets.get(ex.sessionPhase) ?? [];
    list.push(ex);
    buckets.set(ex.sessionPhase, list);
  }
  return order
    .filter((phase) => (buckets.get(phase)?.length ?? 0) > 0)
    .map((phase) => ({ phase, items: buckets.get(phase)! }));
}
