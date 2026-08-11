import type { GeminiProgramDraft } from "@/lib/programs/gemini-generate-program";
import type { ProgramAiContext } from "@/lib/programs/exercise-catalog";
import { expandSessionsToTarget } from "@/lib/programs/expand-program-sessions";
import { resolveWeekSizesFromSchedule } from "@/lib/programs/training-plan-curriculum";
import type { SessionPhase } from "@/lib/programs/session-phase";
import { resolveProgramDurationWeeks } from "@/lib/programs/program-duration";

import type { ExerciseDurationUnit } from "@/app/admin/programs/new/create-program-form";
import {
  inferExercisePrescriptionType,
  type ExercisePrescriptionType,
} from "@/lib/programs/program-exercises";
import {
  clampProgramPrescriptionTypeForPhase,
} from "@/lib/exercises/program-prescription-mode";
import { promoteProgressionOutOfNote, clearAiLoadPrescription, sanitizeBothSidesCoachNote } from "@/lib/programs/sanitize-coach-note";
import {
  defaultRestBetweenSetsSeconds,
  defaultRestBetweenSidesSeconds,
  ensureSetsRepsBetweenSetsNote,
  ensureTimeOnlyMainPrescription,
  MAIN_TIMED_DEFAULT_ROUNDS,
  MAIN_TIMED_HOLD_DEFAULT_SECONDS,
} from "@/lib/programs/normalize-ai-exercise-prescription";
import { defaultStrengthSetsRepsForEntry } from "@/lib/programs/program-prescription-rules";
import { exerciseEligibleForTrainingLevel } from "@/lib/programs/exercise-level-eligibility";

export type AiProgramExerciseRow = {
  exerciseId: string;
  sessionPhase: SessionPhase;
  choiceGroup: string;
  prescriptionType: ExercisePrescriptionType;
  durationValue: string;
  durationUnit: ExerciseDurationUnit;
  sets: string;
  reps: string;
  restBetweenSetsSeconds: string;
  restBetweenSidesSeconds: string;
  restAfterSeconds: string;
  loadPrescription: string;
  note: string;
};

export type AiProgramSessionRow = {
  name: string;
  description: string;
  durationMinutes: string;
  exercises: AiProgramExerciseRow[];
};

export type AiProgramTrackRow = {
  locationId: string;
  sessions: AiProgramSessionRow[];
  weekSizes?: number[];
};

export type AiProgramFormDraft = {
  title: string;
  description: string;
  body: string;
  categoryIds: string[];
  difficultyLevelId: string;
  durationWeeks: string;
  sessionsPerWeek: string;
  minutesPerSession: string;
  outcomes: string[];
  tracks: AiProgramTrackRow[];
};

function normalizeSlug(s: string): string {
  return s.trim().toLowerCase();
}

export type ScheduleHints = {
  durationWeeks?: number | null;
  sessionsPerWeek?: number | null;
  trainingLevel?: import("@/lib/member/onboarding").OnboardingLevel | null;
};

function intToField(n: number | null | undefined): string {
  return n != null && Number.isFinite(n) ? String(n) : "";
}

export function mapGeminiDraftToForm(
  draft: GeminiProgramDraft,
  ctx: ProgramAiContext,
  catalogIds: Set<string>,
  scheduleHints?: ScheduleHints
): { draft: AiProgramFormDraft; warnings: string[] } {
  const warnings: string[] = [];

  const durationWeeks = resolveProgramDurationWeeks(
    scheduleHints?.durationWeeks ?? draft.duration_weeks
  );
  const sessionsPerWeek = scheduleHints?.sessionsPerWeek ?? draft.sessions_per_week;
  const targetSessionCount =
    durationWeeks != null && sessionsPerWeek != null && durationWeeks > 0 && sessionsPerWeek > 0
      ? durationWeeks * sessionsPerWeek
      : null;

  const difficulty =
    draft.difficulty_level_slug != null
      ? ctx.difficulties.find((d) => normalizeSlug(d.slug) === normalizeSlug(draft.difficulty_level_slug!))
      : null;
  if (draft.difficulty_level_slug && !difficulty) {
    warnings.push(`Unknown difficulty slug "${draft.difficulty_level_slug}" — left blank.`);
  }

  const categoryIds: string[] = [];
  for (const slug of draft.category_slugs) {
    const cat = ctx.categories.find((c) => normalizeSlug(c.slug) === normalizeSlug(slug));
    if (cat) categoryIds.push(cat.id);
    else warnings.push(`Unknown category slug "${slug}" — skipped.`);
  }

  const locationBySlug = new Map(ctx.locations.map((l) => [normalizeSlug(l.slug), l]));
  const exercisesByLocation = new Map<string, Set<string>>();
  for (const ex of ctx.exercises) {
    for (const locId of ex.locationIds) {
      let set = exercisesByLocation.get(locId);
      if (!set) {
        set = new Set();
        exercisesByLocation.set(locId, set);
      }
      set.add(ex.id);
    }
  }

  const tracks: AiProgramTrackRow[] = [];

  for (const tr of draft.tracks) {
    const loc = locationBySlug.get(normalizeSlug(tr.location_slug));
    if (!loc) {
      warnings.push(`Unknown location slug "${tr.location_slug}" — track skipped.`);
      continue;
    }

    const allowedAtLocation = exercisesByLocation.get(loc.id) ?? new Set<string>();

    let trackSessions = tr.sessions;
    if (targetSessionCount != null && targetSessionCount > 1) {
      const expanded = expandSessionsToTarget(trackSessions, targetSessionCount, {
        sessionsPerWeek: sessionsPerWeek ?? trackSessions.length,
        applyWeeklyProgression: (durationWeeks ?? 1) > 1,
        trainingLevel: scheduleHints?.trainingLevel ?? "beginner",
      });
      trackSessions = expanded.sessions.map((s) => ({
        name: s.name,
        description: s.description ?? null,
        duration_minutes: s.duration_minutes ?? null,
        exercises: s.exercises,
      }));
      warnings.push(...expanded.warnings);
    }

    const sessions: AiProgramSessionRow[] = [];

    for (const sess of trackSessions) {
      const exercises: AiProgramExerciseRow[] = [];
      const seenInSession = new Set<string>();

      for (const ex of sess.exercises) {
        if (!catalogIds.has(ex.exercise_id)) {
          warnings.push(`Removed unknown exercise ID in "${sess.name}".`);
          continue;
        }
        if (!allowedAtLocation.has(ex.exercise_id)) {
          warnings.push(`Removed "${ex.exercise_id}" from "${sess.name}" — wrong location for ${loc.name}.`);
          continue;
        }
        const catalogEntry = ctx.exercises.find((e) => e.id === ex.exercise_id);
        const levelCap = scheduleHints?.trainingLevel ?? "beginner";
        if (catalogEntry && !exerciseEligibleForTrainingLevel(catalogEntry, levelCap)) {
          warnings.push(
            `Removed "${catalogEntry.title}" from "${sess.name}" — not eligible for ${levelCap} exercise level.`
          );
          continue;
        }
        if (seenInSession.has(ex.exercise_id)) continue;
        seenInSession.add(ex.exercise_id);

        const workSeconds =
          ex.duration_seconds != null && ex.duration_seconds > 0
            ? ex.duration_seconds
            : ex.duration_minutes != null && ex.duration_minutes > 0
              ? ex.duration_minutes * 60
              : null;
        const mode = catalogEntry?.programPrescriptionMode ?? "all";
        const cleaned = clearAiLoadPrescription(
          promoteProgressionOutOfNote({
            note: ex.note,
            load_prescription: ex.load_prescription,
          })
        );
        const isBothSides = catalogEntry?.bothSides ?? false;
        const noteSansBothSides = sanitizeBothSidesCoachNote(cleaned.note, {
          bothSides: isBothSides,
        });
        const aiFields = ensureTimeOnlyMainPrescription(
          {
            phase: ex.phase,
            duration_seconds: workSeconds,
            duration_minutes: workSeconds != null ? Math.ceil(workSeconds / 60) : ex.duration_minutes,
            sets: ex.sets,
            reps: ex.reps,
            rest_between_sets_seconds: ex.rest_between_sets_seconds,
            rest_after_seconds: ex.rest_after_seconds,
            note: noteSansBothSides,
          },
          mode
        );
        const workSecsOut =
          aiFields.duration_seconds != null && aiFields.duration_seconds > 0
            ? aiFields.duration_seconds
            : workSeconds;
        const inferred = inferExercisePrescriptionType({
          durationSeconds: workSecsOut,
          durationMinutes:
            workSecsOut != null ? Math.ceil(workSecsOut / 60) : ex.duration_minutes,
          sets: aiFields.sets,
          restBetweenSetsSeconds: aiFields.rest_between_sets_seconds,
        });
        const prescriptionType = clampProgramPrescriptionTypeForPhase(
          mode,
          inferred,
          ex.phase
        );

        let setsOut = aiFields.sets;
        let repsOut =
          prescriptionType === "timed_intervals" || prescriptionType === "time"
            ? null
            : aiFields.reps;
        let durationOut = workSecsOut;

        // Never leave main sets×reps blank in the admin form.
        if (prescriptionType === "sets_reps" && ex.phase === "main") {
          const defaults = catalogEntry
            ? defaultStrengthSetsRepsForEntry(catalogEntry, levelCap)
            : { sets: 3, reps: 10 };
          if (setsOut == null || setsOut <= 0) setsOut = defaults.sets ?? 3;
          if (repsOut == null || repsOut <= 0) repsOut = defaults.reps ?? 10;
        }

        // Never leave timed main work without a duration / rounds.
        if (
          (prescriptionType === "timed_intervals" || prescriptionType === "time") &&
          ex.phase === "main" &&
          (durationOut == null || durationOut <= 0)
        ) {
          durationOut =
            mode === "time_only" ? MAIN_TIMED_HOLD_DEFAULT_SECONDS : 45;
          if (setsOut == null || setsOut < 2) setsOut = MAIN_TIMED_DEFAULT_ROUNDS;
        }

        const restBetween =
          defaultRestBetweenSetsSeconds({
            ...aiFields,
            duration_seconds: durationOut,
            sets: setsOut,
            reps: repsOut,
          }) ?? ex.rest_between_sets_seconds;
        const noteWithRest = ensureSetsRepsBetweenSetsNote(
          noteSansBothSides,
          {
            ...aiFields,
            duration_seconds: durationOut,
            sets: setsOut,
            reps: repsOut,
            rest_between_sets_seconds: restBetween,
          },
          { bothSides: isBothSides }
        );
        const restBetweenSides = defaultRestBetweenSidesSeconds(
          {
            ...aiFields,
            duration_seconds: durationOut,
            sets: setsOut,
            reps: repsOut,
            rest_between_sides_seconds:
              "rest_between_sides_seconds" in ex
                ? (ex as { rest_between_sides_seconds?: number | null }).rest_between_sides_seconds
                : null,
          },
          { bothSides: isBothSides }
        );

        exercises.push({
          exerciseId: ex.exercise_id,
          sessionPhase: ex.phase,
          choiceGroup: ex.choice_group ?? "",
          prescriptionType,
          durationValue:
            durationOut != null
              ? String(durationOut)
              : intToField(ex.duration_minutes),
          durationUnit: durationOut != null ? "sec" : "min",
          sets: intToField(setsOut),
          reps: intToField(repsOut),
          restBetweenSetsSeconds: intToField(restBetween),
          restBetweenSidesSeconds: intToField(restBetweenSides),
          restAfterSeconds: intToField(aiFields.rest_after_seconds),
          loadPrescription: cleaned.load_prescription?.trim() ?? "",
          note: noteWithRest?.trim() ?? "",
        });
      }

      if (exercises.length === 0) {
        warnings.push(`Session "${sess.name}" had no valid exercises — skipped.`);
        continue;
      }

      sessions.push({
        name: `Day ${sessions.length + 1}`,
        description: sess.description ?? "",
        durationMinutes: intToField(sess.duration_minutes),
        exercises,
      });
    }

    if (sessions.length === 0) {
      warnings.push(`Track for ${loc.name} had no valid sessions — skipped.`);
      continue;
    }

    const weekSizes =
      sessionsPerWeek != null && sessionsPerWeek > 0
        ? resolveWeekSizesFromSchedule(sessions.length, sessionsPerWeek)
        : undefined;

    tracks.push({
      locationId: loc.id,
      sessions,
      ...(weekSizes ? { weekSizes } : {}),
    });
  }

  if (tracks.length === 0) {
    throw new Error("No valid curriculum remained after validation. Try a different brief or add more exercises.");
  }

  return {
    draft: {
      title: draft.title,
      description: draft.description,
      body: draft.body,
      categoryIds,
      difficultyLevelId: difficulty?.id ?? "",
      durationWeeks: intToField(durationWeeks ?? draft.duration_weeks),
      sessionsPerWeek: intToField(sessionsPerWeek ?? draft.sessions_per_week),
      minutesPerSession: intToField(draft.minutes_per_session),
      outcomes: draft.outcomes.length > 0 ? draft.outcomes : [],
      tracks,
    },
    warnings,
  };
}
