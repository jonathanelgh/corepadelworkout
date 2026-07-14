import type { ExerciseCatalogEntry } from "@/lib/programs/exercise-catalog";
import type { OnboardingLevel } from "@/lib/member/onboarding";
import { isOnboardingLevel } from "@/lib/programs/profile-ai-context";
import { parseTrainingLevelFromAthleteContext } from "@/lib/programs/program-prescription-rules";
import type { ProgramProposal, WorkoutProposal, WorkoutProposalExercise } from "@/lib/programs/ai-coach-gemini";
import type { GeminiProgramDraft } from "@/lib/programs/gemini-generate-program";
import { applyProgramRulesToSession, type ProgramRulesContext } from "@/lib/programs/ensure-program-rules";
import { normalizeAiExerciseRest } from "@/lib/programs/normalize-ai-exercise-prescription";
import type { SessionPhase } from "@/lib/programs/session-phase";
import {
  COOLDOWN_DURATION_SECONDS,
  COOLDOWN_REST_AFTER_SECONDS,
  MIN_COOLDOWN_EXERCISES_PER_SESSION,
  MIN_WARMUP_EXERCISES_PER_SESSION,
  WARMUP_DURATION_SECONDS,
  WARMUP_REST_AFTER_SECONDS,
} from "@/lib/programs/warmup-prescription";

const PHASE_ORDER: Record<SessionPhase, number> = {
  warmup: 0,
  main: 1,
  cooldown: 2,
};

export type SessionStructureOptions = {
  locationSlug?: string;
  sessionLabel?: string;
  trainingLevel?: OnboardingLevel | null;
  programContext?: ProgramRulesContext;
};

export function resolveSessionEnforcementOptions(input: {
  locationSlug?: string;
  trainingLevel?: string | null;
  athleteContext?: string | null;
  goal?: string;
}): Pick<SessionStructureOptions, "locationSlug" | "trainingLevel" | "programContext"> {
  const trainingLevel = isOnboardingLevel(input.trainingLevel)
    ? input.trainingLevel
    : parseTrainingLevelFromAthleteContext(input.athleteContext);
  return {
    locationSlug: input.locationSlug,
    trainingLevel,
    programContext: input.goal ? { goal: input.goal } : undefined,
  };
}

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

export function defaultCooldownExerciseFields(): Pick<
  WorkoutProposalExercise,
  "phase" | "duration_seconds" | "rest_after_seconds"
> {
  return {
    phase: "cooldown",
    duration_seconds: COOLDOWN_DURATION_SECONDS,
    rest_after_seconds: COOLDOWN_REST_AFTER_SECONDS,
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

/** Force 60s timed cool-down prescription; strip sets/reps from cool-down moves. */
export function normalizeCooldownPrescription<T extends WorkoutProposalExercise>(ex: T): T {
  if (ex.phase !== "cooldown") return ex;
  return {
    ...ex,
    duration_seconds: COOLDOWN_DURATION_SECONDS,
    duration_minutes: undefined,
    sets: undefined,
    reps: undefined,
    rest_between_sets_seconds: undefined,
    rest_after_seconds: COOLDOWN_REST_AFTER_SECONDS,
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

function cooldownCandidateScore(entry: ExerciseCatalogEntry): number {
  let score = 100;
  const blob = [entry.title, ...entry.categoryTypes, ...entry.movementPatterns, ...entry.bodyRegions]
    .join(" ")
    .toLowerCase();
  if (blob.includes("mobility")) score -= 45;
  if (blob.includes("stretch")) score -= 25;
  if (blob.includes("recovery")) score -= 20;
  if (entry.programPrescriptionMode === "sets_reps_only") score += 60;
  if (entry.programPrescriptionMode === "time_only") score -= 15;
  return score;
}

function pickCatalogExercises(
  catalog: ExerciseCatalogEntry[],
  excludeIds: Set<string>,
  count: number,
  score: (entry: ExerciseCatalogEntry) => number,
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
    .sort((a, b) => score(a) - score(b));
  return pool.slice(0, count);
}

function sortExercisesByPhase(exercises: WorkoutProposalExercise[]): WorkoutProposalExercise[] {
  return [...exercises].sort((a, b) => PHASE_ORDER[a.phase] - PHASE_ORDER[b.phase]);
}

export function ensureSessionExerciseStructure(
  exercises: WorkoutProposalExercise[],
  catalog: ExerciseCatalogEntry[],
  options?: SessionStructureOptions
): { exercises: WorkoutProposalExercise[]; warnings: string[] } {
  const warnings: string[] = [];
  const sessionLabel = options?.sessionLabel?.trim();

  const warmups = exercises.filter((e) => e.phase === "warmup").map(normalizeWarmupPrescription);
  const cooldowns = exercises.filter((e) => e.phase === "cooldown").map(normalizeCooldownPrescription);
  const mains = exercises.filter((e) => e.phase !== "warmup" && e.phase !== "cooldown");

  let out = [...warmups, ...mains, ...cooldowns];
  const usedIds = new Set(out.map((e) => e.exercise_id));

  const warmupNeeded = Math.max(0, MIN_WARMUP_EXERCISES_PER_SESSION - warmups.length);
  if (warmupNeeded > 0) {
    const picks = pickCatalogExercises(
      catalog,
      usedIds,
      warmupNeeded,
      warmupCandidateScore,
      options?.locationSlug
    );
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

  const cooldownCount = cooldowns.length;
  const cooldownNeeded = Math.max(0, MIN_COOLDOWN_EXERCISES_PER_SESSION - cooldownCount);
  if (cooldownNeeded > 0) {
    const picks = pickCatalogExercises(
      catalog,
      usedIds,
      cooldownNeeded,
      cooldownCandidateScore,
      options?.locationSlug
    );
    if (picks.length === 0) {
      warnings.push(
        sessionLabel
          ? `${sessionLabel}: Could not add cool-down exercises — no suitable catalog moves for this location.`
          : "Could not add cool-down exercises — no suitable catalog moves for this location."
      );
    } else {
      const suffix = picks.map((pick) => ({
        exercise_id: pick.id,
        title: pick.title,
        ...defaultCooldownExerciseFields(),
      }));
      for (const ex of suffix) usedIds.add(ex.exercise_id);
      out = [...out, ...suffix];
      warnings.push(
        sessionLabel
          ? `${sessionLabel}: Added ${suffix.length} cool-down exercise(s) at 60s each.`
          : `Added ${suffix.length} cool-down exercise(s) at 60s each.`
      );
    }
  }

  out = sortExercisesByPhase(out.map((ex) => normalizeCooldownPrescription(normalizeWarmupPrescription(ex))));

  const rulesResult = applyProgramRulesToSession(out, catalog, {
    locationSlug: options?.locationSlug,
    sessionLabel,
    trainingLevel: options?.trainingLevel,
    programContext: options?.programContext,
  });
  out = rulesResult.exercises;
  warnings.push(...rulesResult.warnings);

  out = sortExercisesByPhase(out.map((ex) => normalizeCooldownPrescription(normalizeWarmupPrescription(ex))));
  const bothSidesByExerciseId = new Map(catalog.map((entry) => [entry.id, entry.bothSides]));
  out = normalizeAiExerciseRest(out, { bothSidesByExerciseId });
  return { exercises: out, warnings };
}

export function ensureWorkoutProposalStructure(
  proposal: WorkoutProposal,
  catalog: ExerciseCatalogEntry[],
  options?: SessionStructureOptions
): { proposal: WorkoutProposal; warnings: string[] } {
  const { exercises, warnings } = ensureSessionExerciseStructure(proposal.exercises, catalog, {
    ...options,
    programContext: {
      ...options?.programContext,
      title: proposal.title,
      description: proposal.description,
      goal: options?.programContext?.goal,
    },
  });
  return { proposal: { ...proposal, exercises }, warnings };
}

export function ensureProgramProposalStructure(
  proposal: ProgramProposal,
  catalog: ExerciseCatalogEntry[],
  options?: Omit<SessionStructureOptions, "sessionLabel" | "programContext"> & {
    programContext?: ProgramRulesContext;
  }
): { proposal: ProgramProposal; warnings: string[] } {
  const warnings: string[] = [];
  const locationSlug = proposal.location_slug;
  const programContext: ProgramRulesContext = {
    title: proposal.title,
    description: proposal.description,
    ...options?.programContext,
  };
  const sessions = proposal.sessions.map((session) => {
    const result = ensureSessionExerciseStructure(session.exercises, catalog, {
      locationSlug,
      sessionLabel: session.name,
      trainingLevel: options?.trainingLevel,
      programContext,
    });
    warnings.push(...result.warnings);
    return { ...session, exercises: result.exercises };
  });
  return { proposal: { ...proposal, sessions }, warnings };
}

export function ensureGeminiDraftStructure(
  draft: GeminiProgramDraft,
  catalog: ExerciseCatalogEntry[],
  options?: Omit<SessionStructureOptions, "sessionLabel">
): { draft: GeminiProgramDraft; warnings: string[] } {
  const warnings: string[] = [];
  const programContext: ProgramRulesContext = {
    title: draft.title,
    description: draft.description,
    ...options?.programContext,
  };
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
        trainingLevel: options?.trainingLevel,
        programContext,
      });
      warnings.push(...result.warnings);

      const exercises = result.exercises.map((ex) => ({
        exercise_id: ex.exercise_id,
        phase: ex.phase,
        choice_group: ex.choice_group ?? null,
        duration_seconds: ex.duration_seconds ?? null,
        duration_minutes: ex.duration_minutes ?? null,
        sets: ex.sets ?? null,
        reps: ex.reps ?? null,
        rest_between_sets_seconds: ex.rest_between_sets_seconds ?? null,
        rest_after_seconds: ex.rest_after_seconds,
      }));

      return { ...session, exercises };
    });
    return { ...track, sessions };
  });

  return { draft: { ...draft, tracks }, warnings };
}
