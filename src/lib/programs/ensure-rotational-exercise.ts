import type { ExerciseCatalogEntry } from "@/lib/programs/exercise-catalog";
import type { GeminiProgramDraft } from "@/lib/programs/gemini-generate-program";
import type { ProgramProposal, WorkoutProposal, WorkoutProposalExercise } from "@/lib/programs/ai-coach-gemini";
import type { SessionPhase } from "@/lib/programs/session-phase";

/** Movement-pattern labels that count as rotational / anti-rotational work. */
export function isRotationalMovementLabel(label: string): boolean {
  const s = label.trim().toLowerCase().replace(/_/g, "-");
  return (
    s.includes("anti-rotation") ||
    s.includes("anti rotation") ||
    s === "rotation" ||
    s.startsWith("rotation/") ||
    s.includes("rotational")
  );
}

export function exerciseHasRotationalPattern(entry: ExerciseCatalogEntry): boolean {
  return entry.movementPatterns.some(isRotationalMovementLabel);
}

function catalogEntryById(
  catalog: ExerciseCatalogEntry[],
  id: string
): ExerciseCatalogEntry | undefined {
  return catalog.find((e) => e.id === id);
}

function listHasRotationalExercise(
  exerciseIds: string[],
  catalog: ExerciseCatalogEntry[]
): boolean {
  return exerciseIds.some((id) => {
    const entry = catalogEntryById(catalog, id);
    return entry != null && exerciseHasRotationalPattern(entry);
  });
}

function pickRotationalExercise(
  catalog: ExerciseCatalogEntry[],
  usedIds: Set<string>,
  options?: { locationIds?: Set<string> }
): ExerciseCatalogEntry | null {
  const pool = catalog.filter((e) => {
    if (usedIds.has(e.id) || e.status !== "published") return false;
    if (!exerciseHasRotationalPattern(e)) return false;
    if (options?.locationIds?.size) {
      return e.locationIds.some((id) => options.locationIds!.has(id));
    }
    return true;
  });

  if (pool.length === 0) return null;

  pool.sort((a, b) => rotationalPickScore(a) - rotationalPickScore(b));
  return pool[0] ?? null;
}

function rotationalPickScore(entry: ExerciseCatalogEntry): number {
  const joined = entry.movementPatterns.join(" ").toLowerCase();
  if (joined.includes("anti")) return 0;
  if (joined.includes("rotation")) return 1;
  return 2;
}

function defaultRotationalExercise(pick: ExerciseCatalogEntry): WorkoutProposalExercise {
  return {
    exercise_id: pick.id,
    title: pick.title,
    phase: "main",
    sets: 3,
    reps: 10,
    rest_after_seconds: 45,
  };
}

function insertRotationalExercise(
  exercises: WorkoutProposalExercise[],
  pick: ExerciseCatalogEntry
): WorkoutProposalExercise[] {
  const entry = defaultRotationalExercise(pick);
  const mainIndex = exercises.findIndex((e) => e.phase === "main");
  const insertAt = mainIndex >= 0 ? mainIndex : exercises.length;
  const out = [...exercises];
  out.splice(insertAt, 0, entry);
  return out;
}

function ensureListHasRotation(
  exercises: WorkoutProposalExercise[],
  catalog: ExerciseCatalogEntry[],
  options?: { locationIds?: Set<string> }
): { exercises: WorkoutProposalExercise[]; warnings: string[] } {
  const warnings: string[] = [];
  const usedIds = new Set(exercises.map((e) => e.exercise_id));

  if (listHasRotationalExercise([...usedIds], catalog)) {
    return { exercises, warnings };
  }

  const pick = pickRotationalExercise(catalog, usedIds, options);
  if (!pick) {
    warnings.push(
      "No rotational/anti-rotational exercise could be added — publish exercises tagged with Rotation or Anti-rotation movement patterns."
    );
    return { exercises, warnings };
  }

  warnings.push(`Added ${pick.title} — every workout must include rotation or anti-rotation.`);
  return { exercises: insertRotationalExercise(exercises, pick), warnings };
}

export function ensureWorkoutProposalRotation(
  proposal: WorkoutProposal,
  catalog: ExerciseCatalogEntry[]
): { proposal: WorkoutProposal; warnings: string[] } {
  const { exercises, warnings } = ensureListHasRotation(proposal.exercises, catalog);
  return { proposal: { ...proposal, exercises }, warnings };
}

export function ensureProgramProposalRotation(
  proposal: ProgramProposal,
  catalog: ExerciseCatalogEntry[]
): { proposal: ProgramProposal; warnings: string[] } {
  const warnings: string[] = [];
  const sessions = proposal.sessions.map((session) => {
    const locationIds = new Set<string>();
    if (proposal.location_slug) {
      const slug = proposal.location_slug.trim().toLowerCase();
      for (const e of catalog) {
        if (e.locationSlugs.some((s) => s.toLowerCase() === slug)) {
          e.locationIds.forEach((id) => locationIds.add(id));
        }
      }
    }
    const result = ensureListHasRotation(session.exercises, catalog, {
      locationIds: locationIds.size > 0 ? locationIds : undefined,
    });
    warnings.push(...result.warnings.map((w) => `${session.name}: ${w}`));
    return { ...session, exercises: result.exercises };
  });

  return { proposal: { ...proposal, sessions }, warnings };
}

export function ensureGeminiDraftRotation(
  draft: GeminiProgramDraft,
  catalog: ExerciseCatalogEntry[],
  ctxLocations: { id: string; slug: string }[]
): { draft: GeminiProgramDraft; warnings: string[] } {
  const warnings: string[] = [];
  const slugToId = new Map(ctxLocations.map((l) => [l.slug.toLowerCase(), l.id]));

  const tracks = draft.tracks.map((track) => {
    const locationId = slugToId.get(track.location_slug.toLowerCase());
    const locationIds = locationId ? new Set([locationId]) : undefined;

    const sessions = track.sessions.map((session) => {
      const proposalExercises: WorkoutProposalExercise[] = session.exercises.map((ex) => ({
        exercise_id: ex.exercise_id,
        title: catalogEntryById(catalog, ex.exercise_id)?.title ?? ex.exercise_id,
        phase: ex.phase,
        choice_group: ex.choice_group ?? undefined,
        duration_minutes: ex.duration_minutes ?? undefined,
        sets: ex.sets ?? undefined,
        reps: ex.reps ?? undefined,
        rest_after_seconds: ex.rest_after_seconds ?? 0,
      }));

      const result = ensureListHasRotation(proposalExercises, catalog, { locationIds });
      warnings.push(...result.warnings.map((w) => `${session.name}: ${w}`));

      const exercises = result.exercises.map((ex) => ({
        exercise_id: ex.exercise_id,
        phase: ex.phase as SessionPhase,
        choice_group: ex.choice_group ?? null,
        duration_minutes: ex.duration_minutes ?? null,
        sets: ex.sets ?? null,
        reps: ex.reps ?? null,
        rest_between_sets_seconds: null,
        rest_after_seconds: ex.rest_after_seconds,
      }));

      return { ...session, exercises };
    });

    return { ...track, sessions };
  });

  return { draft: { ...draft, tracks }, warnings };
}
