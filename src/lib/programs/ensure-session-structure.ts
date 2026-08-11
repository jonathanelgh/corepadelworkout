import type { ExerciseCatalogEntry } from "@/lib/programs/exercise-catalog";
import type { OnboardingLevel } from "@/lib/member/onboarding";
import { isOnboardingLevel } from "@/lib/programs/profile-ai-context";
import { parseTrainingLevelFromAthleteContext, detectFootworkSpecialtyFocus, resolveMinFootworkPerSession, parseTrainingLevelFromBrief } from "@/lib/programs/program-prescription-rules";
import type { ProgramProposal, WorkoutProposal, WorkoutProposalExercise } from "@/lib/programs/ai-coach-gemini";
import type { GeminiProgramDraft } from "@/lib/programs/gemini-generate-program";
import { applyProgramRulesToSession, type ProgramRulesContext } from "@/lib/programs/ensure-program-rules";
import { exerciseEligibleForTrainingLevel } from "@/lib/programs/exercise-level-eligibility";
import { ensureWeeklyExerciseVariety } from "@/lib/programs/ensure-weekly-exercise-variety";
import { normalizeAiExerciseRest } from "@/lib/programs/normalize-ai-exercise-prescription";
import type { SessionPhase } from "@/lib/programs/session-phase";
import { resolveProgramDurationWeeks } from "@/lib/programs/program-duration";
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

function enrichProgramContext(
  ctx: ProgramRulesContext | undefined,
  sessionCount: number,
  sessionIndex: number
): ProgramRulesContext {
  const base: ProgramRulesContext = { ...ctx };
  const specialty =
    base.specialtyFootwork === true ||
    detectFootworkSpecialtyFocus([base.title, base.description, base.goal].filter(Boolean).join(" "));
  return {
    ...base,
    specialtyFootwork: specialty,
    minFootworkPerSession: resolveMinFootworkPerSession({
      sessionCount,
      sessionIndex,
      specialtyFootwork: specialty,
    }),
  };
}

export function resolveSessionEnforcementOptions(input: {
  locationSlug?: string;
  trainingLevel?: string | null;
  athleteContext?: string | null;
  goal?: string;
}): Pick<SessionStructureOptions, "locationSlug" | "trainingLevel" | "programContext"> {
  const fromDropdown = isOnboardingLevel(input.trainingLevel) ? input.trainingLevel : null;
  const fromProfile = parseTrainingLevelFromAthleteContext(input.athleteContext);
  const fromBrief = parseTrainingLevelFromBrief(input.goal);
  const trainingLevel = fromDropdown ?? fromProfile ?? fromBrief;
  const specialtyFootwork = detectFootworkSpecialtyFocus(input.goal);
  return {
    locationSlug: input.locationSlug,
    trainingLevel,
    programContext: input.goal
      ? {
          goal: input.goal,
          specialtyFootwork,
          minFootworkPerSession: resolveMinFootworkPerSession({
            sessionCount: 1,
            sessionIndex: 0,
            specialtyFootwork,
          }),
        }
      : undefined,
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
  locationSlug?: string,
  trainingLevel?: OnboardingLevel | null,
  preferAvoidIds?: ReadonlySet<string>
): ExerciseCatalogEntry[] {
  if (count <= 0) return [];
  const level = trainingLevel ?? "beginner";
  const eligible = catalog.filter(
    (e) =>
      e.status === "published" &&
      !excludeIds.has(e.id) &&
      exerciseMatchesLocation(e, locationSlug) &&
      exerciseEligibleForTrainingLevel(e, level)
  );
  const fresh = preferAvoidIds
    ? eligible.filter((e) => !preferAvoidIds.has(e.id))
    : eligible;
  const pool = (fresh.length >= count ? fresh : eligible).sort((a, b) => {
    const sa = score(a) + (preferAvoidIds?.has(a.id) ? 500 : 0);
    const sb = score(b) + (preferAvoidIds?.has(b.id) ? 500 : 0);
    return sa - sb;
  });
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
  const level = options?.trainingLevel ?? "beginner";

  const eligibleExercises = exercises.filter((ex) => {
    const entry = catalog.find((c) => c.id === ex.exercise_id);
    if (!entry) {
      // Catalog is already level-filtered — drop IDs outside it (e.g. beginner picks).
      warnings.push(
        sessionLabel
          ? `${sessionLabel}: Removed unknown exercise ${ex.exercise_id} — not in allowed catalog.`
          : `Removed unknown exercise ${ex.exercise_id} — not in allowed catalog.`
      );
      return false;
    }
    if (exerciseEligibleForTrainingLevel(entry, level)) return true;
    warnings.push(
      sessionLabel
        ? `${sessionLabel}: Removed ${entry.title} — not eligible for ${level} exercise level.`
        : `Removed ${entry.title} — not eligible for ${level} exercise level.`
    );
    return false;
  });

  const warmups = eligibleExercises.filter((e) => e.phase === "warmup").map(normalizeWarmupPrescription);
  const cooldowns = eligibleExercises.filter((e) => e.phase === "cooldown").map(normalizeCooldownPrescription);
  const mains = eligibleExercises.filter((e) => e.phase !== "warmup" && e.phase !== "cooldown");

  let out = [...warmups, ...mains, ...cooldowns];
  const usedIds = new Set(out.map((e) => e.exercise_id));
  const preferAvoidIds = (() => {
    const raw = options?.programContext?.avoidExerciseIds;
    if (!raw) return undefined;
    return raw instanceof Set ? raw : new Set(raw);
  })();

  const warmupNeeded = Math.max(0, MIN_WARMUP_EXERCISES_PER_SESSION - warmups.length);
  if (warmupNeeded > 0) {
    const picks = pickCatalogExercises(
      catalog,
      usedIds,
      warmupNeeded,
      warmupCandidateScore,
      options?.locationSlug,
      level,
      preferAvoidIds
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
      options?.locationSlug,
      level,
      preferAvoidIds
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
  const baseContext: ProgramRulesContext = {
    title: proposal.title,
    description: proposal.description,
    ...options?.programContext,
  };

  // Build days sequentially so fillers avoid mains already used earlier in the week.
  const weekMainUsed = new Set<string>();
  const sessionsAfterRules = proposal.sessions.map((session, index) => {
    const programContext = {
      ...enrichProgramContext(baseContext, proposal.sessions.length, index),
      avoidExerciseIds: new Set(weekMainUsed),
    };
    const result = ensureSessionExerciseStructure(session.exercises, catalog, {
      locationSlug,
      sessionLabel: session.name,
      trainingLevel: options?.trainingLevel,
      programContext,
    });
    warnings.push(...result.warnings);
    for (const ex of result.exercises) {
      if (ex.phase === "warmup" || ex.phase === "cooldown") continue;
      weekMainUsed.add(ex.exercise_id);
    }
    return { ...session, exercises: result.exercises };
  });

  const variety = ensureWeeklyExerciseVariety(sessionsAfterRules, catalog, {
    locationSlug,
    trainingLevel: options?.trainingLevel,
  });
  warnings.push(...variety.warnings);

  // Variety can disturb required tags — re-apply structure with cross-day avoid sets.
  const sessions = variety.sessions.map((session, index) => {
    const avoidFromOthers = new Set<string>();
    for (let i = 0; i < variety.sessions.length; i++) {
      if (i === index) continue;
      for (const ex of variety.sessions[i]!.exercises) {
        if (ex.phase === "warmup" || ex.phase === "cooldown") continue;
        avoidFromOthers.add(ex.exercise_id);
      }
    }
    const programContext = {
      ...enrichProgramContext(baseContext, variety.sessions.length, index),
      avoidExerciseIds: avoidFromOthers,
    };
    const result = ensureSessionExerciseStructure(session.exercises, catalog, {
      locationSlug,
      sessionLabel: session.name,
      trainingLevel: options?.trainingLevel,
      programContext,
    });
    warnings.push(...result.warnings);
    return { ...session, exercises: result.exercises };
  });

  // Final variety pass after repair so structure fillers don't re-clone days.
  const varietyFinal = ensureWeeklyExerciseVariety(sessions, catalog, {
    locationSlug,
    trainingLevel: options?.trainingLevel,
  });
  warnings.push(...varietyFinal.warnings);

  // Honor requested length (default 8 when unset); do not force a minimum of 8.
  const duration_weeks = resolveProgramDurationWeeks(proposal.duration_weeks);

  return {
    proposal: { ...proposal, sessions: varietyFinal.sessions, duration_weeks },
    warnings,
  };
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
    const weekMainUsed = new Set<string>();
    const structuredSessions = track.sessions.map((session, index) => {
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
        load_prescription: ex.load_prescription ?? undefined,
        note: ex.note ?? undefined,
      }));

      const dayContext = {
        ...enrichProgramContext(programContext, track.sessions.length, index),
        avoidExerciseIds: new Set(weekMainUsed),
      };
      const result = ensureSessionExerciseStructure(proposalExercises, catalog, {
        locationSlug: track.location_slug,
        sessionLabel: session.name,
        trainingLevel: options?.trainingLevel,
        programContext: dayContext,
      });
      warnings.push(...result.warnings);
      for (const ex of result.exercises) {
        if (ex.phase === "warmup" || ex.phase === "cooldown") continue;
        weekMainUsed.add(ex.exercise_id);
      }

      return { name: session.name, exercises: result.exercises, source: session };
    });

    const variety = ensureWeeklyExerciseVariety(
      structuredSessions.map((s) => ({ name: s.name, exercises: s.exercises })),
      catalog,
      {
        locationSlug: track.location_slug,
        trainingLevel: options?.trainingLevel,
      }
    );
    warnings.push(...variety.warnings);

    const repairedSessions = variety.sessions.map((session, index) => {
      const avoidFromOthers = new Set<string>();
      for (let i = 0; i < variety.sessions.length; i++) {
        if (i === index) continue;
        for (const ex of variety.sessions[i]!.exercises) {
          if (ex.phase === "warmup" || ex.phase === "cooldown") continue;
          avoidFromOthers.add(ex.exercise_id);
        }
      }
      const programContextForDay = {
        ...enrichProgramContext(programContext, variety.sessions.length, index),
        avoidExerciseIds: avoidFromOthers,
      };
      const result = ensureSessionExerciseStructure(session.exercises, catalog, {
        locationSlug: track.location_slug,
        sessionLabel: session.name,
        trainingLevel: options?.trainingLevel,
        programContext: programContextForDay,
      });
      warnings.push(...result.warnings);
      return { name: session.name, exercises: result.exercises };
    });

    const varietyFinal = ensureWeeklyExerciseVariety(repairedSessions, catalog, {
      locationSlug: track.location_slug,
      trainingLevel: options?.trainingLevel,
    });
    warnings.push(...varietyFinal.warnings);

    // Final structure pass: variety swaps can leave incomplete prescriptions; normalize again.
    const finalizedSessions = varietyFinal.sessions.map((session, index) => {
      const avoidFromOthers = new Set<string>();
      for (let i = 0; i < varietyFinal.sessions.length; i++) {
        if (i === index) continue;
        for (const ex of varietyFinal.sessions[i]!.exercises) {
          if (ex.phase === "warmup" || ex.phase === "cooldown") continue;
          avoidFromOthers.add(ex.exercise_id);
        }
      }
      const result = ensureSessionExerciseStructure(session.exercises, catalog, {
        locationSlug: track.location_slug,
        sessionLabel: session.name,
        trainingLevel: options?.trainingLevel,
        programContext: {
          ...enrichProgramContext(programContext, varietyFinal.sessions.length, index),
          avoidExerciseIds: avoidFromOthers,
        },
      });
      warnings.push(...result.warnings);
      return { name: session.name, exercises: result.exercises };
    });

    const sessions = finalizedSessions.map((session, index) => {
      const source = structuredSessions[index]?.source ?? track.sessions[index]!;
      const exercises = session.exercises.map((ex) => ({
        exercise_id: ex.exercise_id,
        phase: ex.phase,
        choice_group: ex.choice_group ?? null,
        duration_seconds: ex.duration_seconds ?? null,
        duration_minutes: ex.duration_minutes ?? null,
        sets: ex.sets ?? null,
        reps: ex.reps ?? null,
        rest_between_sets_seconds: ex.rest_between_sets_seconds ?? null,
        rest_after_seconds: ex.rest_after_seconds,
        load_prescription: ex.load_prescription ?? null,
        note: ex.note ?? null,
      }));
      return { ...source, exercises };
    });

    return { ...track, sessions };
  });

  return { draft: { ...draft, tracks }, warnings };
}
