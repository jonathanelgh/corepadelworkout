import type { ExerciseCatalogEntry } from "@/lib/programs/exercise-catalog";
import type { GeminiProgramDraft } from "@/lib/programs/gemini-generate-program";
import type { ProgramProposal, WorkoutProposal, WorkoutProposalExercise } from "@/lib/programs/ai-coach-gemini";
import type { SessionPhase } from "@/lib/programs/session-phase";
import { exerciseEligibleForTrainingLevel } from "@/lib/programs/exercise-level-eligibility";

/** Movement-pattern labels that count as rotational / anti-rotational work. */
export function isRotationalMovementLabel(label: string): boolean {
  const s = label.trim().toLowerCase().replace(/_/g, "-");
  return (
    s.includes("anti-rotation") ||
    s.includes("anti rotation") ||
    s === "rotation" ||
    s.startsWith("rotation/") ||
    s.includes("rotational") ||
    s === "twist" ||
    s.includes("twist")
  );
}

export function exerciseHasRotationalPattern(entry: ExerciseCatalogEntry): boolean {
  if (entry.movementPatterns.some(isRotationalMovementLabel)) return true;
  const title = entry.title.toLowerCase();
  return (
    /\bpallof\b/.test(title) ||
    /\bwood\s*chop\b/.test(title) ||
    /\brussian\s*twist/.test(title) ||
    /\banti[-\s]?rotation\b/.test(title) ||
    /\b(trunk|torso|thoracic)\s+rotation\b/.test(title)
  );
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
  options?: {
    locationIds?: Set<string>;
    trainingLevel?: import("@/lib/member/onboarding").OnboardingLevel | null;
  }
): ExerciseCatalogEntry | null {
  const level = options?.trainingLevel ?? "beginner";
  const baseFilter = (e: ExerciseCatalogEntry) => {
    if (usedIds.has(e.id) || e.status !== "published") return false;
    if (!exerciseHasRotationalPattern(e)) return false;
    if (!exerciseEligibleForTrainingLevel(e, level)) return false;
    return true;
  };

  let pool = catalog.filter((e) => {
    if (!baseFilter(e)) return false;
    if (options?.locationIds?.size) {
      return e.locationIds.some((id) => options.locationIds!.has(id));
    }
    return true;
  });

  // Location filter can empty the pool when the catalog is already location-scoped — retry without it.
  if (pool.length === 0 && options?.locationIds?.size) {
    pool = catalog.filter(baseFilter);
  }

  if (pool.length === 0) return null;

  pool.sort((a, b) => rotationalPickScore(a) - rotationalPickScore(b));
  return pool[0] ?? null;
}

function rotationalPickScore(entry: ExerciseCatalogEntry): number {
  const joined = entry.movementPatterns.join(" ").toLowerCase();
  const title = entry.title.toLowerCase();
  let score = 50;
  if (joined.includes("anti-rotation") || /\bpallof\b/.test(title)) score -= 40;
  if (/\b(wood\s*chop|russian\s*twist|trunk|torso|thoracic|dead\s*bug|bird\s*dog|plank)\b/.test(title)) {
    score -= 25;
  }
  if (joined.includes("rotational transfer")) score -= 15;
  if (joined.includes("rotation")) score -= 10;
  // Prefer moves that also satisfy the core hard-rule.
  try {
    // Lazy require avoided — inline abdomen/trunk anti-rotation preference
    if (
      entry.bodyParts.some((p) => /abdomen/i.test(p)) &&
      (joined.includes("anti-rotation") || joined.includes("plank"))
    ) {
      score -= 20;
    }
  } catch {
    /* ignore */
  }
  // Deprioritize joint CARs / shoulder IR-ER / ankle-wrist "rotation" mobility.
  if (/\b(car|shoulder|wrist|ankle|tibial|forearm|eversion)\b/.test(title)) score += 40;
  if (/\b(stretch|mobility|opener)\b/.test(title) && !/\bpallof|chop|twist|press|plank|bug|dog\b/.test(title)) {
    score += 20;
  }
  return score;
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
  options?: {
    locationIds?: Set<string>;
    trainingLevel?: import("@/lib/member/onboarding").OnboardingLevel | null;
  }
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
  catalog: ExerciseCatalogEntry[],
  options?: { trainingLevel?: import("@/lib/member/onboarding").OnboardingLevel | null }
): { proposal: WorkoutProposal; warnings: string[] } {
  const { exercises, warnings } = ensureListHasRotation(proposal.exercises, catalog, {
    trainingLevel: options?.trainingLevel,
  });
  return { proposal: { ...proposal, exercises }, warnings };
}

export function ensureProgramProposalRotation(
  proposal: ProgramProposal,
  catalog: ExerciseCatalogEntry[],
  options?: { trainingLevel?: import("@/lib/member/onboarding").OnboardingLevel | null }
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
      trainingLevel: options?.trainingLevel,
    });
    warnings.push(...result.warnings.map((w) => `${session.name}: ${w}`));
    return { ...session, exercises: result.exercises };
  });

  return { proposal: { ...proposal, sessions }, warnings };
}

export function ensureGeminiDraftRotation(
  draft: GeminiProgramDraft,
  catalog: ExerciseCatalogEntry[],
  ctxLocations: { id: string; slug: string }[],
  options?: { trainingLevel?: import("@/lib/member/onboarding").OnboardingLevel | null }
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
        duration_seconds: ex.duration_seconds ?? undefined,
        duration_minutes: ex.duration_minutes ?? undefined,
        sets: ex.sets ?? undefined,
        reps: ex.reps ?? undefined,
        rest_after_seconds: ex.rest_after_seconds ?? 0,
        rest_between_sets_seconds: ex.rest_between_sets_seconds ?? undefined,
      }));

      const result = ensureListHasRotation(proposalExercises, catalog, {
        locationIds,
        trainingLevel: options?.trainingLevel,
      });
      warnings.push(...result.warnings.map((w) => `${session.name}: ${w}`));

      const exercises = result.exercises.map((ex) => ({
        exercise_id: ex.exercise_id,
        phase: ex.phase as SessionPhase,
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

      return { ...session, exercises };
    });

    return { ...track, sessions };
  });

  return { draft: { ...draft, tracks }, warnings };
}
