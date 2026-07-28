import type { ExerciseCatalogEntry } from "@/lib/programs/exercise-catalog";
import type { OnboardingLevel } from "@/lib/member/onboarding";
import type { WorkoutProposalExercise } from "@/lib/programs/ai-coach-gemini";
import {
  catalogEntryHasTag,
  clampRestToBand,
  defaultRestForEntry,
  defaultStrengthSetsReps,
  detectRehabFocus,
  exerciseIsHighIntensityStart,
  exerciseIsStrength,
  exerciseMatchesBodyPart,
  exerciseMatchesLocation,
  exerciseNeedsMainBlockRest,
  kineticChainBodyParts,
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
  /** Override per-session footwork floor (default 1). Weekly 2/1/2 uses 2,1,2. */
  minFootworkPerSession?: number;
};

function catalogById(
  catalog: ExerciseCatalogEntry[],
  id: string
): ExerciseCatalogEntry | undefined {
  return catalog.find((e) => e.id === id);
}

function pickFromCatalog(
  catalog: ExerciseCatalogEntry[],
  excludeIds: Set<string>,
  score: (entry: ExerciseCatalogEntry) => number,
  count: number,
  locationSlug?: string,
  trainingLevel?: OnboardingLevel | null,
  opts?: { require?: (entry: ExerciseCatalogEntry) => boolean }
): ExerciseCatalogEntry[] {
  const level = trainingLevel ?? "beginner";
  const pool = catalog
    .filter(
      (e) =>
        e.status === "published" &&
        !excludeIds.has(e.id) &&
        exerciseMatchesLocation(e, locationSlug) &&
        exerciseEligibleForTrainingLevel(e, level) &&
        (opts?.require ? opts.require(e) : true)
    )
    .sort((a, b) => score(a) - score(b));
  return pool.slice(0, count);
}

function cooldownScore(entry: ExerciseCatalogEntry): number {
  let score = 100;
  if (catalogEntryHasTag(entry, "mobility")) score -= 50;
  if (entry.programPrescriptionMode === "time_only") score -= 20;
  if (entry.programPrescriptionMode === "sets_reps_only") score += 40;
  return score;
}

function mainBlockScore(entry: ExerciseCatalogEntry): number {
  let score = 100;
  // Prefer real training moves over pure mobility for the main ("core") block.
  if (catalogEntryHasTag(entry, "mobility")) score += 40;
  if (catalogEntryHasTag(entry, "footwork")) score -= 20;
  if (exerciseIsStrength(entry)) score -= 25;
  if (entry.programPrescriptionMode === "sets_reps_only") score -= 15;
  if (entry.programPrescriptionMode === "time_only") score += 10;
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

function defaultMainExercise(pick: ExerciseCatalogEntry): WorkoutProposalExercise {
  if (exerciseIsStrength(pick)) {
    return {
      exercise_id: pick.id,
      title: pick.title,
      phase: "main",
      ...defaultStrengthSetsReps(),
      rest_after_seconds: 45,
    };
  }
  return {
    exercise_id: pick.id,
    title: pick.title,
    phase: "main",
    duration_seconds: 45,
    rest_after_seconds: 45,
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

function normalizeStrengthExercise(ex: WorkoutProposalExercise, entry: ExerciseCatalogEntry): WorkoutProposalExercise {
  if (ex.phase !== "main" || !exerciseIsStrength(entry)) return ex;
  const defaults = defaultStrengthSetsReps();
  return {
    ...ex,
    duration_seconds: undefined,
    duration_minutes: undefined,
    sets: ex.sets != null && ex.sets > 0 ? ex.sets : defaults.sets,
    reps: ex.reps != null && ex.reps > 0 ? ex.reps : defaults.reps,
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
  const targetBetween =
    ex.rest_between_sets_seconds != null && ex.rest_between_sets_seconds > 0
      ? clampRestToBand(ex.rest_between_sets_seconds, band)
      : ex.sets != null && ex.sets > 1
        ? fallback
        : ex.rest_between_sets_seconds;
  return {
    ...ex,
    rest_after_seconds: targetAfter,
    rest_between_sets_seconds: targetBetween,
  };
}

function ensureSafeMainStart(
  exercises: WorkoutProposalExercise[],
  catalog: ExerciseCatalogEntry[],
  usedIds: Set<string>,
  locationSlug: string | undefined,
  sessionLabel: string | undefined,
  warnings: string[],
  trainingLevel?: OnboardingLevel | null
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
    trainingLevel
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
  return insertIntoMain(exercises, [defaultMainExercise(pick)]);
}

function ensureKineticChain(
  exercises: WorkoutProposalExercise[],
  catalog: ExerciseCatalogEntry[],
  focus: RehabFocus,
  usedIds: Set<string>,
  locationSlug: string | undefined,
  sessionLabel: string | undefined,
  warnings: string[],
  trainingLevel?: OnboardingLevel | null
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
      trainingLevel
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
    out = insertIntoMain(out, [defaultMainExercise(pick)]);
    warnings.push(
      sessionLabel
        ? `${sessionLabel}: Added ${pick.title} for ${part} (rehab kinetic chain).`
        : `Added ${pick.title} for ${part} (rehab kinetic chain).`
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
    if (!entry) return true;
    if (exerciseEligibleForTrainingLevel(entry, level)) return true;
    warnings.push(
      sessionLabel
        ? `${sessionLabel}: Removed ${entry.title} — above ${level} exercise level.`
        : `Removed ${entry.title} — above ${level} exercise level.`
    );
    return false;
  });
  const usedIds = new Set(out.map((e) => e.exercise_id));

  // "Core" = main block (not warm-up / cool-down). Ensure at least one main exercise.
  if (!sessionHasCoreBlock(out)) {
    const pick = pickFromCatalog(
      catalog,
      usedIds,
      mainBlockScore,
      1,
      options?.locationSlug,
      level,
      {
        require: (e) =>
          !catalogEntryHasTag(e, "mobility") || catalogEntryHasTag(e, "footwork") || exerciseIsStrength(e),
      }
    )[0];
    if (pick) {
      usedIds.add(pick.id);
      out = insertIntoMain(out, [defaultMainExercise(pick)]);
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
  const minFootwork = options?.programContext?.minFootworkPerSession ?? 1;
  const footworkNeeded = Math.max(0, minFootwork - footworkCount);
  if (footworkNeeded > 0) {
    const picks = pickFromCatalog(
      catalog,
      usedIds,
      footworkScore,
      footworkNeeded,
      options?.locationSlug,
      level,
      { require: (e) => catalogEntryHasTag(e, "footwork") }
    );
    if (picks.length > 0) {
      for (const pick of picks) {
        usedIds.add(pick.id);
        out = insertIntoMain(out, [defaultMainExercise(pick)]);
      }
      warnings.push(
        sessionLabel
          ? `${sessionLabel}: Added ${picks.length} footwork exercise(s).`
          : `Added ${picks.length} footwork exercise(s).`
      );
    } else {
      warnings.push(
        sessionLabel
          ? `${sessionLabel}: Could not add footwork — no footwork-tagged exercises left in catalog.`
          : "Could not add footwork — no footwork-tagged exercises left in catalog."
      );
    }
  }

  if (!sessionHasTag(out, catalog, "mobility", "cooldown")) {
    const pick = pickFromCatalog(
      catalog,
      usedIds,
      cooldownScore,
      1,
      options?.locationSlug,
      level,
      { require: (e) => catalogEntryHasTag(e, "mobility") }
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
      level
    );
  }

  out = out.map((ex) => {
    const entry = catalogById(catalog, ex.exercise_id);
    if (!entry) return ex;
    return applyMainRest(normalizeStrengthExercise(ex, entry), entry, level);
  });

  out = ensureSafeMainStart(
    out,
    catalog,
    usedIds,
    options?.locationSlug,
    sessionLabel,
    warnings,
    level
  );

  return { exercises: out, warnings };
}
