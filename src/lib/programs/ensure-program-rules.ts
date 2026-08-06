import type { ExerciseCatalogEntry } from "@/lib/programs/exercise-catalog";
import type { OnboardingLevel } from "@/lib/member/onboarding";
import type { WorkoutProposalExercise } from "@/lib/programs/ai-coach-gemini";
import {
  catalogEntryHasTag,
  clampRestToBand,
  defaultRestForEntry,
  defaultStrengthSetsRepsForEntry,
  detectFootworkSpecialtyFocus,
  detectRehabFocus,
  exerciseIsHighIntensityStart,
  exerciseIsStrength,
  exerciseMatchesBodyPart,
  exerciseMatchesLocation,
  exerciseNeedsMainBlockRest,
  kineticChainBodyParts,
  resolveMinFootworkPerSession,
  resolveRestBand,
  sessionHasCoreBlock,
  type RehabFocus,
} from "@/lib/programs/program-prescription-rules";
import { exerciseEligibleForTrainingLevel } from "@/lib/programs/exercise-level-eligibility";

export type ProgramRulesContext = {
  trainingLevel?: OnboardingLevel | null;
  title?: string;
  description?: string;
  goal?: string;
  /** Override per-session footwork floor (default 1). Weekly 2/1/2 uses 2,1,2. Specialty footwork uses 4+. */
  minFootworkPerSession?: number;
  /** When true, main block is biased toward footwork/agility density. */
  specialtyFootwork?: boolean;
  /**
   * Main-block exercise IDs already used earlier in the week.
   * Prefer not to re-pick these when filling gaps (still allowed if catalog is exhausted).
   */
  avoidExerciseIds?: ReadonlySet<string> | string[];
};

function contextSpecialtyFootwork(ctx?: ProgramRulesContext): boolean {
  if (ctx?.specialtyFootwork) return true;
  return detectFootworkSpecialtyFocus(
    [ctx?.title, ctx?.description, ctx?.goal].filter(Boolean).join(" ")
  );
}

function contextMinFootwork(
  ctx: ProgramRulesContext | undefined,
  opts?: { sessionCount?: number; sessionIndex?: number }
): number {
  if (ctx?.minFootworkPerSession != null && ctx.minFootworkPerSession > 0) {
    return ctx.minFootworkPerSession;
  }
  return resolveMinFootworkPerSession({
    sessionCount: opts?.sessionCount ?? 1,
    sessionIndex: opts?.sessionIndex ?? 0,
    specialtyFootwork: contextSpecialtyFootwork(ctx),
  });
}

function catalogById(
  catalog: ExerciseCatalogEntry[],
  id: string
): ExerciseCatalogEntry | undefined {
  return catalog.find((e) => e.id === id);
}

function avoidIdSet(ctx?: ProgramRulesContext): Set<string> {
  const raw = ctx?.avoidExerciseIds;
  if (!raw) return new Set();
  return raw instanceof Set ? new Set(raw) : new Set(raw);
}

function pickFromCatalog(
  catalog: ExerciseCatalogEntry[],
  excludeIds: Set<string>,
  score: (entry: ExerciseCatalogEntry) => number,
  count: number,
  locationSlug?: string,
  trainingLevel?: OnboardingLevel | null,
  opts?: {
    require?: (entry: ExerciseCatalogEntry) => boolean;
    /** Soft-avoid: only used if a fresh pick exists; otherwise may reuse. */
    preferAvoidIds?: ReadonlySet<string>;
  }
): ExerciseCatalogEntry[] {
  const level = trainingLevel ?? "beginner";
  const preferAvoid = opts?.preferAvoidIds;
  const eligible = catalog.filter(
    (e) =>
      e.status === "published" &&
      !excludeIds.has(e.id) &&
      exerciseMatchesLocation(e, locationSlug) &&
      exerciseEligibleForTrainingLevel(e, level) &&
      (opts?.require ? opts.require(e) : true)
  );

  const fresh = preferAvoid
    ? eligible.filter((e) => !preferAvoid.has(e.id))
    : eligible;
  const pool = (fresh.length >= count ? fresh : eligible).sort((a, b) => {
    const sa = score(a) + (preferAvoid?.has(a.id) ? 500 : 0);
    const sb = score(b) + (preferAvoid?.has(b.id) ? 500 : 0);
    return sa - sb;
  });
  return pool.slice(0, count);
}

function cooldownScore(entry: ExerciseCatalogEntry): number {
  let score = 100;
  if (catalogEntryHasTag(entry, "mobility")) score -= 50;
  if (entry.programPrescriptionMode === "time_only") score -= 20;
  if (entry.programPrescriptionMode === "sets_reps_only") score += 40;
  return score;
}

function mainBlockScore(entry: ExerciseCatalogEntry, specialtyFootwork = false): number {
  let score = 100;
  // Prefer real training moves over pure mobility for the main ("core") block.
  if (catalogEntryHasTag(entry, "mobility")) score += 40;
  if (catalogEntryHasTag(entry, "footwork")) score -= specialtyFootwork ? 55 : 20;
  if (catalogEntryHasTag(entry, "agility")) score -= specialtyFootwork ? 30 : 5;
  if (exerciseIsStrength(entry)) score -= specialtyFootwork ? 5 : 25;
  if (entry.programPrescriptionMode === "sets_reps_only") score -= specialtyFootwork ? 5 : 15;
  if (entry.programPrescriptionMode === "time_only") score += specialtyFootwork ? -10 : 10;
  return score;
}

function footworkScore(entry: ExerciseCatalogEntry): number {
  let score = 100;
  if (catalogEntryHasTag(entry, "footwork")) score -= 60;
  if (catalogEntryHasTag(entry, "agility")) score -= 20;
  return score;
}

function kineticChainScore(entry: ExerciseCatalogEntry, part: string): number {
  let score = 100;
  if (exerciseMatchesBodyPart(entry, part)) score -= 50;
  if (catalogEntryHasTag(entry, "prehab")) score -= 25;
  if (catalogEntryHasTag(entry, "mobility")) score -= 10;
  return score;
}

function safeMainStartScore(entry: ExerciseCatalogEntry): number {
  let score = 100;
  if (exerciseIsHighIntensityStart(entry)) score += 200;
  if (catalogEntryHasTag(entry, "mobility")) score -= 30;
  if (catalogEntryHasTag(entry, "strength")) score -= 15;
  return score;
}

function defaultMainExercise(
  pick: ExerciseCatalogEntry,
  level: OnboardingLevel = "beginner"
): WorkoutProposalExercise {
  const band = resolveRestBand(pick, "main");
  if (exerciseIsStrength(pick)) {
    return {
      exercise_id: pick.id,
      title: pick.title,
      phase: "main",
      ...defaultStrengthSetsRepsForEntry(pick, level),
      rest_between_sets_seconds: band.default,
      rest_after_seconds: band.default,
    };
  }
  return {
    exercise_id: pick.id,
    title: pick.title,
    phase: "main",
    duration_seconds: 45,
    sets: 3,
    rest_between_sets_seconds: band.default,
    rest_after_seconds: band.default,
  };
}

function defaultCooldownExercise(pick: ExerciseCatalogEntry): WorkoutProposalExercise {
  return {
    exercise_id: pick.id,
    title: pick.title,
    phase: "cooldown",
    duration_seconds: 60,
    rest_after_seconds: 15,
  };
}

function sessionHasTag(
  exercises: WorkoutProposalExercise[],
  catalog: ExerciseCatalogEntry[],
  tag: string,
  phase?: WorkoutProposalExercise["phase"]
): boolean {
  return exercises.some((ex) => {
    if (phase && ex.phase !== phase) return false;
    const entry = catalogById(catalog, ex.exercise_id);
    return entry != null && catalogEntryHasTag(entry, tag);
  });
}

function countTag(
  exercises: WorkoutProposalExercise[],
  catalog: ExerciseCatalogEntry[],
  tag: string,
  phase?: WorkoutProposalExercise["phase"]
): number {
  return exercises.filter((ex) => {
    if (phase && ex.phase !== phase) return false;
    const entry = catalogById(catalog, ex.exercise_id);
    return entry != null && catalogEntryHasTag(entry, tag);
  }).length;
}

function insertIntoMain(
  exercises: WorkoutProposalExercise[],
  additions: WorkoutProposalExercise[]
): WorkoutProposalExercise[] {
  const firstMain = exercises.findIndex((e) => e.phase === "main");
  const insertAt = firstMain >= 0 ? firstMain : exercises.length;
  const out = [...exercises];
  out.splice(insertAt, 0, ...additions);
  return out;
}

function normalizeStrengthExercise(
  ex: WorkoutProposalExercise,
  entry: ExerciseCatalogEntry,
  level: OnboardingLevel = "beginner"
): WorkoutProposalExercise {
  if (ex.phase !== "main" || !exerciseIsStrength(entry)) return ex;
  const defaults = defaultStrengthSetsRepsForEntry(entry, level);
  return {
    ...ex,
    duration_seconds: undefined,
    duration_minutes: undefined,
    sets: ex.sets != null && ex.sets > 0 ? ex.sets : defaults.sets,
    reps: ex.reps != null && ex.reps > 0 ? ex.reps : defaults.reps,
  };
}

/** Main timed work must be timed intervals with 2–3 rounds (not a single continuous timer). */
function normalizeMainTimedRounds(ex: WorkoutProposalExercise): WorkoutProposalExercise {
  if (ex.phase !== "main") return ex;
  const hasDuration =
    (ex.duration_seconds != null && ex.duration_seconds > 0) ||
    (ex.duration_minutes != null && ex.duration_minutes > 0);
  if (!hasDuration) return ex;

  let sets = ex.sets != null && ex.sets > 0 ? Math.ceil(ex.sets) : 3;
  sets = Math.min(3, Math.max(2, sets));
  const restBetween =
    ex.rest_between_sets_seconds != null && ex.rest_between_sets_seconds > 0
      ? ex.rest_between_sets_seconds
      : 30;

  return {
    ...ex,
    sets,
    rest_between_sets_seconds: restBetween,
  };
}

function applyMainRest(
  ex: WorkoutProposalExercise,
  entry: ExerciseCatalogEntry,
  level: OnboardingLevel
): WorkoutProposalExercise {
  if (ex.phase !== "main") {
    const band = resolveRestBand(entry, ex.phase);
    const after =
      ex.rest_after_seconds > 0
        ? clampRestToBand(ex.rest_after_seconds, band)
        : band.default;
    return { ...ex, rest_after_seconds: after };
  }

  if (!exerciseNeedsMainBlockRest(entry) && !exerciseIsStrength(entry)) return ex;

  const band = resolveRestBand(entry, "main");
  const fallback = defaultRestForEntry(entry, "main", level);
  const targetAfter =
    ex.rest_after_seconds > 0 ? clampRestToBand(ex.rest_after_seconds, band) : fallback;

  const hasDuration =
    (ex.duration_seconds != null && ex.duration_seconds > 0) ||
    (ex.duration_minutes != null && ex.duration_minutes > 0);
  const isSetsRepsMulti =
    !hasDuration && ex.sets != null && ex.sets > 1 && ex.reps != null && ex.reps > 0;

  // Sets×reps and timed rounds: rest between from strength-tag matrix.
  const targetBetween =
    ex.sets != null && ex.sets > 1
      ? ex.rest_between_sets_seconds != null && ex.rest_between_sets_seconds > 0
        ? clampRestToBand(ex.rest_between_sets_seconds, band)
        : fallback
      : ex.rest_between_sets_seconds;

  const betweenNote =
    targetBetween != null && targetBetween > 0
      ? `Rest ${Math.round(targetBetween)} sec between sets`
      : null;

  const note =
    isSetsRepsMulti &&
    !entry.bothSides &&
    betweenNote &&
    !(ex.note && /rest\s+\d+\s*sec(?:onds)?\s+between\s+sets/i.test(ex.note))
      ? ex.note?.trim()
        ? `${ex.note.trim()} ${betweenNote}`
        : betweenNote
      : ex.note;

  return {
    ...ex,
    rest_after_seconds: targetAfter,
    rest_between_sets_seconds: targetBetween,
    note,
  };
}

function ensureSafeMainStart(
  exercises: WorkoutProposalExercise[],
  catalog: ExerciseCatalogEntry[],
  usedIds: Set<string>,
  locationSlug: string | undefined,
  sessionLabel: string | undefined,
  warnings: string[],
  trainingLevel?: OnboardingLevel | null,
  preferAvoidIds?: ReadonlySet<string>
): WorkoutProposalExercise[] {
  const mainIndices = exercises
    .map((ex, index) => ({ ex, index }))
    .filter(({ ex }) => ex.phase === "main");
  if (mainIndices.length === 0) return exercises;

  const first = mainIndices[0]!;
  const entry = catalogById(catalog, first.ex.exercise_id);
  if (!entry || !exerciseIsHighIntensityStart(entry)) return exercises;

  const saferMain = mainIndices
    .slice(1)
    .find(({ ex }) => {
      const e = catalogById(catalog, ex.exercise_id);
      return e != null && !exerciseIsHighIntensityStart(e);
    });

  if (saferMain) {
    const out = [...exercises];
    const a = out[first.index]!;
    const b = out[saferMain.index]!;
    out[first.index] = b;
    out[saferMain.index] = a;
    warnings.push(
      sessionLabel
        ? `${sessionLabel}: Moved ${b.title} before ${a.title} — sessions must not start main work with sprint/shuffle/jump.`
        : `Moved ${b.title} before ${a.title} — sessions must not start main work with sprint/shuffle/jump.`
    );
    return out;
  }

  const pick = pickFromCatalog(
    catalog,
    usedIds,
    safeMainStartScore,
    1,
    locationSlug,
    trainingLevel,
    { preferAvoidIds }
  )[0];
  if (!pick) {
    warnings.push(
      sessionLabel
        ? `${sessionLabel}: Main block starts with a high-intensity move and no safer alternative was found.`
        : "Main block starts with a high-intensity move and no safer alternative was found."
    );
    return exercises;
  }

  usedIds.add(pick.id);
  warnings.push(
    sessionLabel
      ? `${sessionLabel}: Added ${pick.title} before main work — never start with sprint/shuffle/jump.`
      : `Added ${pick.title} before main work — never start with sprint/shuffle/jump.`
  );
  return insertIntoMain(exercises, [defaultMainExercise(pick, trainingLevel ?? "beginner")]);
}

function ensureKineticChain(
  exercises: WorkoutProposalExercise[],
  catalog: ExerciseCatalogEntry[],
  focus: RehabFocus,
  usedIds: Set<string>,
  locationSlug: string | undefined,
  sessionLabel: string | undefined,
  warnings: string[],
  trainingLevel?: OnboardingLevel | null,
  preferAvoidIds?: ReadonlySet<string>
): WorkoutProposalExercise[] {
  let out = exercises;
  for (const part of kineticChainBodyParts(focus)) {
    const covered = out.some((ex) => {
      const entry = catalogById(catalog, ex.exercise_id);
      return entry != null && exerciseMatchesBodyPart(entry, part);
    });
    if (covered) continue;

    const pick = pickFromCatalog(
      catalog,
      usedIds,
      (entry) => kineticChainScore(entry, part),
      1,
      locationSlug,
      trainingLevel,
      { preferAvoidIds }
    )[0];
    if (!pick) {
      warnings.push(
        sessionLabel
          ? `${sessionLabel}: Could not add kinetic-chain exercise for ${part}.`
          : `Could not add kinetic-chain exercise for ${part}.`
      );
      continue;
    }

    usedIds.add(pick.id);
    out = insertIntoMain(out, [defaultMainExercise(pick, trainingLevel ?? "beginner")]);
    warnings.push(
      sessionLabel
        ? `${sessionLabel}: Added ${pick.title} for ${part} (rehab kinetic chain).`
        : `Added ${pick.title} for ${part} (rehab kinetic chain).`
    );
  }
  return out;
}

function isProtectedMainForFootworkSpecialty(entry: ExerciseCatalogEntry): boolean {
  if (catalogEntryHasTag(entry, "footwork")) return true;
  if (catalogEntryHasTag(entry, "rotation")) return true;
  if (catalogEntryHasTag(entry, "anti-rotation")) return true;
  if (catalogEntryHasTag(entry, "anti rotation")) return true;
  return false;
}

/**
 * For footwork-specialty programs, replace non-footwork main fillers with footwork
 * until ~60% of main is footwork-tagged (keeps rotation / anti-rotation).
 */
function densifyFootworkSpecialtyMain(
  exercises: WorkoutProposalExercise[],
  catalog: ExerciseCatalogEntry[],
  usedIds: Set<string>,
  locationSlug: string | undefined,
  sessionLabel: string | undefined,
  warnings: string[],
  trainingLevel?: OnboardingLevel | null,
  preferAvoidIds?: ReadonlySet<string>
): WorkoutProposalExercise[] {
  const out = [...exercises];
  const mainIndices = out
    .map((ex, index) => ({ ex, index }))
    .filter(({ ex }) => ex.phase === "main");
  if (mainIndices.length === 0) return out;

  const footworkMain = mainIndices.filter(({ ex }) => {
    const entry = catalogById(catalog, ex.exercise_id);
    return entry != null && catalogEntryHasTag(entry, "footwork");
  }).length;
  const target = Math.max(4, Math.ceil(mainIndices.length * 0.6));
  let need = target - footworkMain;
  if (need <= 0) return out;

  const swapCandidates = mainIndices
    .filter(({ ex }) => {
      const entry = catalogById(catalog, ex.exercise_id);
      return entry != null && !isProtectedMainForFootworkSpecialty(entry);
    })
    .reverse(); // prefer swapping later accessories first

  let swapped = 0;
  for (const candidate of swapCandidates) {
    if (need <= 0) break;
    const pick = pickFromCatalog(
      catalog,
      usedIds,
      footworkScore,
      1,
      locationSlug,
      trainingLevel,
      {
        require: (e) => catalogEntryHasTag(e, "footwork"),
        preferAvoidIds,
      }
    )[0];
    if (!pick) break;

    usedIds.delete(candidate.ex.exercise_id);
    usedIds.add(pick.id);
    out[candidate.index] = {
      ...defaultMainExercise(pick, trainingLevel ?? "beginner"),
      // Preserve position; defaultMainExercise already phase=main
    };
    swapped += 1;
    need -= 1;
  }

  if (swapped > 0) {
    warnings.push(
      sessionLabel
        ? `${sessionLabel}: Swapped ${swapped} main exercise(s) to footwork for specialty focus.`
        : `Swapped ${swapped} main exercise(s) to footwork for specialty focus.`
    );
  }

  return out;
}

export function applyProgramRulesToSession(
  exercises: WorkoutProposalExercise[],
  catalog: ExerciseCatalogEntry[],
  options?: {
    locationSlug?: string;
    sessionLabel?: string;
    trainingLevel?: OnboardingLevel | null;
    programContext?: ProgramRulesContext;
  }
): { exercises: WorkoutProposalExercise[]; warnings: string[] } {
  const warnings: string[] = [];
  const sessionLabel = options?.sessionLabel?.trim();
  const level = options?.trainingLevel ?? "beginner";
  let out = exercises.filter((ex) => {
    const entry = catalogById(catalog, ex.exercise_id);
    if (!entry) {
      // Catalog passed to enforcement is already level/location filtered — drop unknowns
      // so the model cannot keep beginner (or invented) IDs outside the allowed set.
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
  const usedIds = new Set(out.map((e) => e.exercise_id));
  const specialtyFootwork = contextSpecialtyFootwork(options?.programContext);
  const preferAvoidIds = avoidIdSet(options?.programContext);

  // "Core" = main block (not warm-up / cool-down). Ensure at least one main exercise.
  if (!sessionHasCoreBlock(out)) {
    const pick = pickFromCatalog(
      catalog,
      usedIds,
      (entry) => mainBlockScore(entry, specialtyFootwork),
      1,
      options?.locationSlug,
      level,
      {
        preferAvoidIds,
        require: (e) =>
          specialtyFootwork
            ? catalogEntryHasTag(e, "footwork") || catalogEntryHasTag(e, "agility")
            : !catalogEntryHasTag(e, "mobility") ||
              catalogEntryHasTag(e, "footwork") ||
              exerciseIsStrength(e),
      }
    )[0];
    if (pick) {
      usedIds.add(pick.id);
      out = insertIntoMain(out, [defaultMainExercise(pick, level)]);
      warnings.push(
        sessionLabel
          ? `${sessionLabel}: Added ${pick.title} to the main (core) block.`
          : `Added ${pick.title} to the main (core) block.`
      );
    } else {
      warnings.push(
        sessionLabel
          ? `${sessionLabel}: No main-block exercise available in catalog for this level/location.`
          : "No main-block exercise available in catalog for this level/location."
      );
    }
  }

  const footworkCount = countTag(out, catalog, "footwork");
  const minFootwork = contextMinFootwork(options?.programContext);
  const footworkNeeded = Math.max(0, minFootwork - footworkCount);
  if (footworkNeeded > 0) {
    const picks = pickFromCatalog(
      catalog,
      usedIds,
      footworkScore,
      footworkNeeded,
      options?.locationSlug,
      level,
      {
        require: (e) => catalogEntryHasTag(e, "footwork"),
        preferAvoidIds,
      }
    );
    if (picks.length > 0) {
      for (const pick of picks) {
        usedIds.add(pick.id);
        out = insertIntoMain(out, [defaultMainExercise(pick, level)]);
      }
      warnings.push(
        sessionLabel
          ? `${sessionLabel}: Added ${picks.length} footwork exercise(s)${specialtyFootwork ? " (footwork specialty)" : ""}.`
          : `Added ${picks.length} footwork exercise(s)${specialtyFootwork ? " (footwork specialty)" : ""}.`
      );
    } else {
      warnings.push(
        sessionLabel
          ? `${sessionLabel}: Could not add footwork — no footwork-tagged exercises left in catalog.`
          : "Could not add footwork — no footwork-tagged exercises left in catalog."
      );
    }
  }

  if (specialtyFootwork) {
    out = densifyFootworkSpecialtyMain(
      out,
      catalog,
      usedIds,
      options?.locationSlug,
      sessionLabel,
      warnings,
      level,
      preferAvoidIds
    );
  }

  if (!sessionHasTag(out, catalog, "mobility", "cooldown")) {
    const pick = pickFromCatalog(
      catalog,
      usedIds,
      cooldownScore,
      1,
      options?.locationSlug,
      level,
      {
        require: (e) => catalogEntryHasTag(e, "mobility"),
        preferAvoidIds,
      }
    )[0];
    if (pick) {
      usedIds.add(pick.id);
      const cooldowns = out.filter((e) => e.phase === "cooldown");
      const others = out.filter((e) => e.phase !== "cooldown");
      out = [...others, ...cooldowns, defaultCooldownExercise(pick)];
      warnings.push(
        sessionLabel
          ? `${sessionLabel}: Added ${pick.title} to cool-down for mobility coverage.`
          : `Added ${pick.title} to cool-down for mobility coverage.`
      );
    } else {
      warnings.push(
        sessionLabel
          ? `${sessionLabel}: Could not add cool-down mobility — no mobility-tagged exercises left.`
          : "Could not add cool-down mobility — no mobility-tagged exercises left."
      );
    }
  }

  const rehabText = [
    options?.programContext?.title,
    options?.programContext?.description,
    options?.programContext?.goal,
  ]
    .filter(Boolean)
    .join(" ");
  const rehabFocus = detectRehabFocus(rehabText);
  if (rehabFocus) {
    out = ensureKineticChain(
      out,
      catalog,
      rehabFocus,
      usedIds,
      options?.locationSlug,
      sessionLabel,
      warnings,
      level,
      preferAvoidIds
    );
  }

  out = out.map((ex) => {
    const entry = catalogById(catalog, ex.exercise_id);
    if (!entry) return ex;
    return applyMainRest(normalizeMainTimedRounds(normalizeStrengthExercise(ex, entry, level)), entry, level);
  });

  out = ensureSafeMainStart(
    out,
    catalog,
    usedIds,
    options?.locationSlug,
    sessionLabel,
    warnings,
    level,
    preferAvoidIds
  );

  return { exercises: out, warnings };
}
