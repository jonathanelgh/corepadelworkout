import type { GeminiProgramDraft } from "@/lib/programs/gemini-generate-program";
import type { ProgramAiContext } from "@/lib/programs/exercise-catalog";
import { expandSessionsToTarget } from "@/lib/programs/expand-program-sessions";
import { resolveWeekSizesFromSchedule } from "@/lib/programs/training-plan-curriculum";
import type { SessionPhase } from "@/lib/programs/session-phase";

import type { ExerciseDurationUnit } from "@/app/admin/programs/new/create-program-form";
import {
  inferExercisePrescriptionType,
  type ExercisePrescriptionType,
} from "@/lib/programs/program-exercises";
import {
  clampProgramPrescriptionType,
} from "@/lib/exercises/program-prescription-mode";

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

  const durationWeeks = scheduleHints?.durationWeeks ?? draft.duration_weeks;
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
        if (seenInSession.has(ex.exercise_id)) continue;
        seenInSession.add(ex.exercise_id);

        const workSeconds =
          ex.duration_seconds != null && ex.duration_seconds > 0
            ? ex.duration_seconds
            : ex.duration_minutes != null && ex.duration_minutes > 0
              ? ex.duration_minutes * 60
              : null;
        const inferred = inferExercisePrescriptionType({
          durationSeconds: workSeconds,
          durationMinutes:
            workSeconds != null ? Math.ceil(workSeconds / 60) : ex.duration_minutes,
          sets: ex.sets,
          restBetweenSetsSeconds: ex.rest_between_sets_seconds,
        });
        const catalogEntry = ctx.exercises.find((e) => e.id === ex.exercise_id);
        const mode = catalogEntry?.programPrescriptionMode ?? "all";
        const hasSeconds = ex.duration_seconds != null && ex.duration_seconds > 0;

        exercises.push({
          exerciseId: ex.exercise_id,
          sessionPhase: ex.phase,
          choiceGroup: ex.choice_group ?? "",
          prescriptionType: clampProgramPrescriptionType(mode, inferred),
          durationValue: hasSeconds ? String(ex.duration_seconds) : intToField(ex.duration_minutes),
          durationUnit: hasSeconds ? "sec" : "min",
          sets: intToField(ex.sets),
          reps: intToField(ex.reps),
          restBetweenSetsSeconds: intToField(ex.rest_between_sets_seconds),
          restBetweenSidesSeconds: intToField(
            "rest_between_sides_seconds" in ex
              ? (ex as { rest_between_sides_seconds?: number | null }).rest_between_sides_seconds
              : null
          ),
          restAfterSeconds: intToField(ex.rest_after_seconds),
          note: "",
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
