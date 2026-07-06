import type { ExerciseCatalogEntry } from "@/lib/programs/exercise-catalog";
import type { ProgramProposal, WorkoutProposal, WorkoutProposalExercise } from "@/lib/programs/ai-coach-gemini";
import type { GeminiProgramDraft } from "@/lib/programs/gemini-generate-program";
import { normalizeAiExerciseRest } from "@/lib/programs/normalize-ai-exercise-prescription";
import type { SessionPhase } from "@/lib/programs/session-phase";
import {
  MIN_WARMUP_EXERCISES_PER_SESSION,
  WARMUP_DURATION_SECONDS,
  WARMUP_REST_AFTER_SECONDS,
} from "@/lib/programs/warmup-prescription";

const PHASE_ORDER: Record<SessionPhase, number> = {
  warmup: 0,
  main: 1,
  cooldown: 2,
};

export function defaultWarmupExerciseFields(): Pick<
  WorkoutProposalExercise,
  "phase" | "duration_seconds" | "rest_after_seconds"
> {
  return {
    phase: "warmup",
    duration_seconds: WARMUP_DURATION_SECONDS,
    rest_after_seconds: WARMUP_REST_AFTER_SECONDS,
  };
}

/** Force 60s timed warm-up prescription; strip sets/reps from warm-up moves. */
export function normalizeWarmupPrescription<T extends WorkoutProposalExercise>(ex: T): T {
  if (ex.phase !== "warmup") return ex;
  return {
    ...ex,
    duration_seconds: WARMUP_DURATION_SECONDS,
    duration_minutes: undefined,
    sets: undefined,
    reps: undefined,
    rest_between_sets_seconds: undefined,
    rest_after_seconds: WARMUP_REST_AFTER_SECONDS,
  };
}

function exerciseMatchesLocation(entry: ExerciseCatalogEntry, locationSlug?: string): boolean {
  if (!locationSlug?.trim()) return true;
  const slug = locationSlug.trim().toLowerCase();
  return entry.locationSlugs.some((s) => s.toLowerCase() === slug);
}

function warmupCandidateScore(entry: ExerciseCatalogEntry): number {
  let score = 100;
  const blob = [entry.title, ...entry.categoryTypes, ...entry.movementPatterns, ...entry.bodyRegions]
    .join(" ")
    .toLowerCase();

  const boosts: [string, number][] = [
    ["mobility", -45],
    ["activation", -35],
    ["dynamic", -30],
    ["warm", -40],
    ["stretch", -12],
    ["footwork", -22],
    ["hip", -10],
    ["shoulder", -10],
    ["ankle", -10],
    ["thoracic", -15],
  ];
  for (const [term, delta] of boosts) {
    if (blob.includes(term)) score += delta;
  }
  if (entry.programPrescriptionMode === "sets_reps_only") score += 80;
  if (entry.programPrescriptionMode === "time_only") score -= 15;
  return score;
}

function pickWarmupExercises(
  catalog: ExerciseCatalogEntry[],
  excludeIds: Set<string>,
  count: number,
  locationSlug?: string
): ExerciseCatalogEntry[] {
  if (count <= 0) return [];
  const pool = catalog
    .filter(
      (e) =>
        e.status === "published" &&
        !excludeIds.has(e.id) &&
        exerciseMatchesLocation(e, locationSlug)
    )
    .sort((a, b) => warmupCandidateScore(a) - warmupCandidateScore(b));
  return pool.slice(0, count);
}

function sortExercisesByPhase(exercises: WorkoutProposalExercise[]): WorkoutProposalExercise[] {
  return [...exercises].sort((a, b) => PHASE_ORDER[a.phase] - PHASE_ORDER[b.phase]);
}

export function ensureSessionExerciseStructure(
  exercises: WorkoutProposalExercise[],
  catalog: ExerciseCatalogEntry[],
  options?: { locationSlug?: string; sessionLabel?: string }
): { exercises: WorkoutProposalExercise[]; warnings: string[] } {
  const warnings: string[] = [];
  const sessionLabel = options?.sessionLabel?.trim();

  const warmups = exercises.filter((e) => e.phase === "warmup").map(normalizeWarmupPrescription);
  const cooldowns = exercises.filter((e) => e.phase === "cooldown");
  const mains = exercises.filter((e) => e.phase !== "warmup" && e.phase !== "cooldown");

  let out = [...warmups, ...mains, ...cooldowns];
  const usedIds = new Set(out.map((e) => e.exercise_id));
  const warmupCount = warmups.length;
  const needed = Math.max(0, MIN_WARMUP_EXERCISES_PER_SESSION - warmupCount);

  if (needed > 0) {
    const picks = pickWarmupExercises(catalog, usedIds, needed, options?.locationSlug);
    if (picks.length === 0) {
      warnings.push(
        sessionLabel
          ? `${sessionLabel}: Could not add warm-up exercises — no suitable catalog moves for this location.`
          : "Could not add warm-up exercises — no suitable catalog moves for this location."
      );
    } else {
      const prefix = picks.map((pick) => ({
        exercise_id: pick.id,
        title: pick.title,
        ...defaultWarmupExerciseFields(),
      }));
      for (const ex of prefix) usedIds.add(ex.exercise_id);
      out = [...prefix, ...out];
      warnings.push(
        sessionLabel
          ? `${sessionLabel}: Added ${prefix.length} warm-up exercise(s) at 60s each.`
          : `Added ${prefix.length} warm-up exercise(s) at 60s each.`
      );
    }
  }

  out = sortExercisesByPhase(out.map(normalizeWarmupPrescription));
  out = normalizeAiExerciseRest(out);
  return { exercises: out, warnings };
}

export function ensureWorkoutProposalStructure(
  proposal: WorkoutProposal,
  catalog: ExerciseCatalogEntry[],
  options?: { locationSlug?: string }
): { proposal: WorkoutProposal; warnings: string[] } {
  const { exercises, warnings } = ensureSessionExerciseStructure(proposal.exercises, catalog, {
    locationSlug: options?.locationSlug,
  });
  return { proposal: { ...proposal, exercises }, warnings };
}

export function ensureProgramProposalStructure(
  proposal: ProgramProposal,
  catalog: ExerciseCatalogEntry[]
): { proposal: ProgramProposal; warnings: string[] } {
  const warnings: string[] = [];
  const locationSlug = proposal.location_slug;
  const sessions = proposal.sessions.map((session) => {
    const result = ensureSessionExerciseStructure(session.exercises, catalog, {
      locationSlug,
      sessionLabel: session.name,
    });
    warnings.push(...result.warnings);
    return { ...session, exercises: result.exercises };
  });
  return { proposal: { ...proposal, sessions }, warnings };
}

export function ensureGeminiDraftStructure(
  draft: GeminiProgramDraft,
  catalog: ExerciseCatalogEntry[]
): { draft: GeminiProgramDraft; warnings: string[] } {
  const warnings: string[] = [];
  const tracks = draft.tracks.map((track) => {
    const sessions = track.sessions.map((session) => {
      const proposalExercises: WorkoutProposalExercise[] = session.exercises.map((ex) => ({
        exercise_id: ex.exercise_id,
        title: catalog.find((c) => c.id === ex.exercise_id)?.title ?? ex.exercise_id,
        phase: ex.phase,
        choice_group: ex.choice_group ?? undefined,
        duration_seconds:
          ex.duration_seconds != null && ex.duration_seconds > 0 ? ex.duration_seconds : undefined,
        duration_minutes: ex.duration_minutes ?? undefined,
        sets: ex.sets ?? undefined,
        reps: ex.reps ?? undefined,
        rest_after_seconds: ex.rest_after_seconds ?? 0,
        rest_between_sets_seconds: ex.rest_between_sets_seconds ?? undefined,
      }));

      const result = ensureSessionExerciseStructure(proposalExercises, catalog, {
        locationSlug: track.location_slug,
        sessionLabel: session.name,
      });
      warnings.push(...result.warnings);

      const exercises = result.exercises.map((ex) => ({
        exercise_id: ex.exercise_id,
        phase: ex.phase,
        choice_group: ex.choice_group ?? null,
        duration_seconds: ex.duration_seconds ?? null,
        duration_minutes: null,
        sets: null,
        reps: null,
        rest_between_sets_seconds: null,
        rest_after_seconds: ex.rest_after_seconds,
      }));

      return { ...session, exercises };
    });
    return { ...track, sessions };
  });

  return { draft: { ...draft, tracks }, warnings };
}
