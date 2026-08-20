import type { ExerciseCatalogEntry } from "@/lib/programs/exercise-catalog";
import type {
  ProgramProposal,
  WorkoutProposal,
  WorkoutProposalExercise,
} from "@/lib/programs/ai-coach-gemini";
import type { OnboardingLevel } from "@/lib/member/onboarding";
import {
  catalogEntryHasTag,
  exerciseIsHighIntensityStart,
  exerciseIsStrength,
} from "@/lib/programs/program-prescription-rules";
import { isRotationalMovementLabel } from "@/lib/programs/ensure-rotational-exercise";

export type RuleCheckStatus = "pass" | "fail" | "fixed" | "info";

export type AiGenerationRuleCheck = {
  id: string;
  label: string;
  status: RuleCheckStatus;
  detail: string;
};

export type AiGenerationSessionSnapshot = {
  name: string;
  warmupCount: number;
  mainCount: number;
  cooldownCount: number;
  coreCount: number;
  footworkCount: number;
  mobilityCooldownCount: number;
  hasRotation: boolean;
  firstMainTitle: string | null;
  firstMainIsHighIntensity: boolean;
  strengthMissingSetsReps: string[];
  exerciseTitles: string[];
};

export type AiGenerationDebugLog = {
  createdAt: string;
  mode: "workout" | "program";
  trainingLevel: OnboardingLevel | null;
  locationSlug: string | null;
  goal: string | null;
  /** Short explanation from the model when provided. */
  aiRationale: string | null;
  /** Deterministic enforcement / rotation auto-fixes. */
  enforcementChanges: string[];
  /** Hard-rule checklist against the FINAL proposal (after enforcement). */
  ruleChecks: AiGenerationRuleCheck[];
  /** What the model returned before code fixes. */
  rawSessions: AiGenerationSessionSnapshot[];
  /** What was saved/shown after enforcement. */
  finalSessions: AiGenerationSessionSnapshot[];
  summary: {
    rawExerciseCount: number;
    finalExerciseCount: number;
    failCount: number;
    fixedCount: number;
    passCount: number;
  };
};

function catalogById(catalog: ExerciseCatalogEntry[], id: string) {
  return catalog.find((e) => e.id === id);
}

function snapshotSession(
  name: string,
  exercises: WorkoutProposalExercise[],
  catalog: ExerciseCatalogEntry[]
): AiGenerationSessionSnapshot {
  const warmup = exercises.filter((e) => e.phase === "warmup");
  const main = exercises.filter((e) => e.phase === "main");
  const cooldown = exercises.filter((e) => e.phase === "cooldown");

  let coreCount = 0;
  let footworkCount = 0;
  let mobilityCooldownCount = 0;
  let hasRotation = false;
  const strengthMissingSetsReps: string[] = [];

  for (const ex of exercises) {
    const entry = catalogById(catalog, ex.exercise_id);
    // "Core" = main block (everything that isn't warm-up / cool-down).
    if (ex.phase === "main") coreCount += 1;
    if (!entry) continue;
    if (catalogEntryHasTag(entry, "footwork")) footworkCount += 1;
    if (ex.phase === "cooldown" && catalogEntryHasTag(entry, "mobility")) {
      mobilityCooldownCount += 1;
    }
    if (entry.movementPatterns.some(isRotationalMovementLabel)) hasRotation = true;
    if (ex.phase === "main" && exerciseIsStrength(entry)) {
      const hasDuration =
        (ex.duration_seconds != null && ex.duration_seconds > 0) ||
        (ex.duration_minutes != null && ex.duration_minutes > 0);
      // Timed strength holds don't use reps — only flag empty sets×reps prescriptions.
      if (hasDuration) continue;
      const hasSets = ex.sets != null && ex.sets > 0;
      const hasReps = ex.reps != null && ex.reps > 0;
      if (!hasSets || !hasReps) strengthMissingSetsReps.push(ex.title);
    }
  }

  const firstMain = main[0] ?? null;
  const firstEntry = firstMain ? catalogById(catalog, firstMain.exercise_id) : null;

  return {
    name,
    warmupCount: warmup.length,
    mainCount: main.length,
    cooldownCount: cooldown.length,
    coreCount,
    footworkCount,
    mobilityCooldownCount,
    hasRotation,
    firstMainTitle: firstMain?.title ?? null,
    firstMainIsHighIntensity: firstEntry ? exerciseIsHighIntensityStart(firstEntry) : false,
    strengthMissingSetsReps,
    exerciseTitles: exercises.map((e) => e.title),
  };
}

function check(
  id: string,
  label: string,
  status: RuleCheckStatus,
  detail: string
): AiGenerationRuleCheck {
  return { id, label, status, detail };
}

function buildSessionRuleChecks(
  raw: AiGenerationSessionSnapshot,
  final: AiGenerationSessionSnapshot,
  sessionKey: string
): AiGenerationRuleCheck[] {
  const checks: AiGenerationRuleCheck[] = [];
  const prefix = sessionKey ? `${sessionKey}: ` : "";

  if (final.warmupCount === 5) {
    checks.push(
      check(
        `${sessionKey}-warmup`,
        `${prefix}Warm-up count = 5`,
        raw.warmupCount === 5 ? "pass" : "fixed",
        raw.warmupCount === 5
          ? "AI returned exactly 5 warm-up exercises."
          : `AI returned ${raw.warmupCount}; enforcement normalized to ${final.warmupCount}.`
      )
    );
  } else {
    checks.push(
      check(
        `${sessionKey}-warmup`,
        `${prefix}Warm-up count = 5`,
        "fail",
        `Final warm-up count is ${final.warmupCount} (AI had ${raw.warmupCount}).`
      )
    );
  }

  if (final.cooldownCount === 5) {
    checks.push(
      check(
        `${sessionKey}-cooldown`,
        `${prefix}Cool-down count = 5`,
        raw.cooldownCount === 5 ? "pass" : "fixed",
        raw.cooldownCount === 5
          ? "AI returned exactly 5 cool-down exercises."
          : `AI returned ${raw.cooldownCount}; enforcement normalized to ${final.cooldownCount}.`
      )
    );
  } else {
    checks.push(
      check(
        `${sessionKey}-cooldown`,
        `${prefix}Cool-down count = 5`,
        "fail",
        `Final cool-down count is ${final.cooldownCount} (AI had ${raw.cooldownCount}).`
      )
    );
  }

  if (final.coreCount >= 1) {
    checks.push(
      check(
        `${sessionKey}-core`,
        `${prefix}≥1 main (core block)`,
        raw.coreCount >= 1 ? "pass" : "fixed",
        raw.coreCount >= 1
          ? `AI included ${raw.coreCount} main-block exercise(s).`
          : "AI missed main-block work; enforcement added some."
      )
    );
  } else {
    checks.push(
      check(
        `${sessionKey}-core`,
        `${prefix}≥1 main (core block)`,
        "fail",
        "No main-block exercises after enforcement (warm-up/cool-down only)."
      )
    );
  }

  if (final.footworkCount >= 1) {
    checks.push(
      check(
        `${sessionKey}-footwork`,
        `${prefix}Footwork present`,
        raw.footworkCount >= 1 ? "pass" : "fixed",
        `AI: ${raw.footworkCount}, final: ${final.footworkCount}.`
      )
    );
  } else {
    checks.push(
      check(
        `${sessionKey}-footwork`,
        `${prefix}Footwork present`,
        "fail",
        "No footwork-tagged exercise after enforcement."
      )
    );
  }

  if (final.mobilityCooldownCount >= 1) {
    checks.push(
      check(
        `${sessionKey}-mobility`,
        `${prefix}≥1 mobility in cool-down`,
        raw.mobilityCooldownCount >= 1 ? "pass" : "fixed",
        raw.mobilityCooldownCount >= 1
          ? "AI included mobility in cool-down."
          : "AI missed cool-down mobility; enforcement added one."
      )
    );
  } else {
    checks.push(
      check(
        `${sessionKey}-mobility`,
        `${prefix}≥1 mobility in cool-down`,
        "fail",
        "No mobility-tagged cool-down exercise after enforcement."
      )
    );
  }

  if (final.hasRotation) {
    checks.push(
      check(
        `${sessionKey}-rotation`,
        `${prefix}Rotation / anti-rotation`,
        raw.hasRotation ? "pass" : "fixed",
        raw.hasRotation
          ? "AI included a rotational pattern."
          : "AI missed rotation; enforcement added one."
      )
    );
  } else {
    checks.push(
      check(
        `${sessionKey}-rotation`,
        `${prefix}Rotation / anti-rotation`,
        "fail",
        "No rotational/anti-rotational exercise after enforcement."
      )
    );
  }

  if (!final.firstMainIsHighIntensity) {
    checks.push(
      check(
        `${sessionKey}-main-start`,
        `${prefix}Main does not start with sprint/shuffle/jump`,
        raw.firstMainIsHighIntensity ? "fixed" : "pass",
        raw.firstMainIsHighIntensity
          ? `AI started main with "${raw.firstMainTitle}"; enforcement reordered/added prep.`
          : `Main starts with "${final.firstMainTitle ?? "—"}".`
      )
    );
  } else {
    checks.push(
      check(
        `${sessionKey}-main-start`,
        `${prefix}Main does not start with sprint/shuffle/jump`,
        "fail",
        `Main still starts with high-intensity: "${final.firstMainTitle}".`
      )
    );
  }

  if (final.strengthMissingSetsReps.length === 0) {
    checks.push(
      check(
        `${sessionKey}-strength-rx`,
        `${prefix}Strength uses sets + reps`,
        raw.strengthMissingSetsReps.length === 0 ? "pass" : "fixed",
        raw.strengthMissingSetsReps.length === 0
          ? "Strength exercises had sets/reps."
          : `AI missed sets/reps on: ${raw.strengthMissingSetsReps.join(", ")}. Fixed.`
      )
    );
  } else {
    checks.push(
      check(
        `${sessionKey}-strength-rx`,
        `${prefix}Strength uses sets + reps`,
        "fail",
        `Still missing sets/reps: ${final.strengthMissingSetsReps.join(", ")}.`
      )
    );
  }

  return checks;
}

export type BuildAiGenerationDebugInput = {
  mode: "workout" | "program";
  catalog: ExerciseCatalogEntry[];
  trainingLevel?: OnboardingLevel | null;
  locationSlug?: string | null;
  goal?: string | null;
  aiRationale?: string | null;
  enforcementChanges: string[];
  rawExercisesBySession: { name: string; exercises: WorkoutProposalExercise[] }[];
  finalExercisesBySession: { name: string; exercises: WorkoutProposalExercise[] }[];
};

export function buildAiGenerationDebugLog(
  input: BuildAiGenerationDebugInput
): AiGenerationDebugLog {
  const rawSessions = input.rawExercisesBySession.map((s) =>
    snapshotSession(s.name, s.exercises, input.catalog)
  );
  const finalSessions = input.finalExercisesBySession.map((s) =>
    snapshotSession(s.name, s.exercises, input.catalog)
  );

  const ruleChecks: AiGenerationRuleCheck[] = [];

  ruleChecks.push(
    check(
      "mode",
      "Generation mode",
      "info",
      input.mode === "program"
        ? "Multi-week program with all weeks authored by the AI (duration_weeks × sessions_per_week)."
        : "Single session (no weekly expansion)."
    )
  );
  ruleChecks.push(
    check(
      "level",
      "Training level for rest / progression",
      "info",
      input.trainingLevel ?? "Not set — defaults to beginner for enforcement."
    )
  );
  if (input.goal) {
    ruleChecks.push(check("goal", "Consultation goal", "info", input.goal));
  }
  if (input.locationSlug) {
    ruleChecks.push(check("location", "Location", "info", input.locationSlug));
  }

  const sessionCount = Math.max(rawSessions.length, finalSessions.length);
  for (let i = 0; i < sessionCount; i++) {
    const raw = rawSessions[i] ?? snapshotSession(`Session ${i + 1}`, [], input.catalog);
    const final = finalSessions[i] ?? raw;
    const key = sessionCount > 1 ? `d${i + 1}` : "session";
    ruleChecks.push(...buildSessionRuleChecks(raw, final, key));
  }

  if (input.mode === "program" && finalSessions.length === 3) {
    const fw = finalSessions.map((s) => s.footworkCount);
    const target = [2, 1, 2];
    const rawFw = rawSessions.map((s) => s.footworkCount);
    const matches = fw.every((n, i) => n >= (target[i] ?? 1));
    const rawMatches = rawFw.every((n, i) => n >= (target[i] ?? 1));
    ruleChecks.push(
      check(
        "footwork-week",
        "Weekly footwork 2/1/2",
        matches ? (rawMatches ? "pass" : "fixed") : "fail",
        `AI: ${rawFw.join("/") || "—"}. Final: ${fw.join("/")}. Target ≥2/≥1/≥2.`
      )
    );
  }

  if (input.aiRationale?.trim()) {
    ruleChecks.push(
      check("ai-rationale", "AI design rationale", "info", input.aiRationale.trim())
    );
  } else if (input.enforcementChanges.length > 0) {
    ruleChecks.push(
      check(
        "ai-rationale",
        "AI design rationale",
        "fail",
        "Missing design_rationale (required coaching summary for admin review)."
      )
    );
  } else {
    ruleChecks.push(
      check(
        "ai-rationale",
        "AI design rationale",
        "fail",
        "Missing design_rationale — required thorough coaching summary for admin review."
      )
    );
  }

  if (input.mode === "program" && finalSessions.length >= 2) {
    const mainRepeatIds = new Set<string>();
    const seenInPrior = new Set<string>();
    for (const session of input.finalExercisesBySession) {
      const seenHere = new Set<string>();
      for (const ex of session.exercises) {
        if (ex.phase === "warmup" || ex.phase === "cooldown") continue;
        if (seenHere.has(ex.exercise_id)) continue;
        seenHere.add(ex.exercise_id);
        if (seenInPrior.has(ex.exercise_id)) mainRepeatIds.add(ex.exercise_id);
      }
      for (const id of seenHere) seenInPrior.add(id);
    }
    const repeatCount = mainRepeatIds.size;
    ruleChecks.push(
      check(
        "main-variety",
        "Main exercise variety (≤1 main repeat across days)",
        repeatCount <= 1 ? "pass" : "fail",
        `${repeatCount} main exercise(s) appear on more than one day (cap 1). Footwork/rotation should rotate to different drills.`
      )
    );
  }

  const failCount = ruleChecks.filter((c) => c.status === "fail").length;
  const fixedCount = ruleChecks.filter((c) => c.status === "fixed").length;
  const passCount = ruleChecks.filter((c) => c.status === "pass").length;

  return {
    createdAt: new Date().toISOString(),
    mode: input.mode,
    trainingLevel: input.trainingLevel ?? null,
    locationSlug: input.locationSlug ?? null,
    goal: input.goal ?? null,
    aiRationale: input.aiRationale?.trim() || null,
    enforcementChanges: input.enforcementChanges,
    ruleChecks,
    rawSessions,
    finalSessions,
    summary: {
      rawExerciseCount: rawSessions.reduce((n, s) => n + s.exerciseTitles.length, 0),
      finalExerciseCount: finalSessions.reduce((n, s) => n + s.exerciseTitles.length, 0),
      failCount,
      fixedCount,
      passCount,
    },
  };
}

export function debugLogFromWorkout(params: {
  catalog: ExerciseCatalogEntry[];
  raw: WorkoutProposal;
  final: WorkoutProposal;
  enforcementChanges: string[];
  trainingLevel?: OnboardingLevel | null;
  locationSlug?: string | null;
  goal?: string | null;
}): AiGenerationDebugLog {
  return buildAiGenerationDebugLog({
    mode: "workout",
    catalog: params.catalog,
    trainingLevel: params.trainingLevel,
    locationSlug: params.locationSlug,
    goal: params.goal,
    aiRationale: params.raw.design_rationale ?? params.final.design_rationale ?? null,
    enforcementChanges: params.enforcementChanges,
    rawExercisesBySession: [{ name: "Session", exercises: params.raw.exercises }],
    finalExercisesBySession: [{ name: "Session", exercises: params.final.exercises }],
  });
}

export function debugLogFromProgram(params: {
  catalog: ExerciseCatalogEntry[];
  raw: ProgramProposal;
  final: ProgramProposal;
  enforcementChanges: string[];
  trainingLevel?: OnboardingLevel | null;
  locationSlug?: string | null;
  goal?: string | null;
}): AiGenerationDebugLog {
  return buildAiGenerationDebugLog({
    mode: "program",
    catalog: params.catalog,
    trainingLevel: params.trainingLevel,
    locationSlug: params.locationSlug ?? params.final.location_slug ?? null,
    goal: params.goal,
    aiRationale: params.raw.design_rationale ?? params.final.design_rationale ?? null,
    enforcementChanges: params.enforcementChanges,
    rawExercisesBySession: params.raw.sessions.map((s) => ({
      name: s.name,
      exercises: s.exercises,
    })),
    finalExercisesBySession: params.final.sessions.map((s) => ({
      name: s.name,
      exercises: s.exercises,
    })),
  });
}
