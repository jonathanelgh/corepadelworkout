import type { GeminiProgramDraft } from "@/lib/programs/gemini-generate-program";
import type { ProgramAiContext } from "@/lib/programs/exercise-catalog";

import type { ExerciseDurationUnit } from "@/app/admin/programs/new/create-program-form";
import {
  inferExercisePrescriptionType,
  type ExercisePrescriptionType,
} from "@/lib/programs/program-exercises";

export type AiProgramExerciseRow = {
  exerciseId: string;
  prescriptionType: ExercisePrescriptionType;
  durationValue: string;
  durationUnit: ExerciseDurationUnit;
  sets: string;
  reps: string;
  restBetweenSetsSeconds: string;
  restAfterSeconds: string;
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

function intToField(n: number | null | undefined): string {
  return n != null && Number.isFinite(n) ? String(n) : "";
}

export function mapGeminiDraftToForm(
  draft: GeminiProgramDraft,
  ctx: ProgramAiContext,
  catalogIds: Set<string>
): { draft: AiProgramFormDraft; warnings: string[] } {
  const warnings: string[] = [];

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
    const sessions: AiProgramSessionRow[] = [];

    for (const sess of tr.sessions) {
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

        exercises.push({
          exerciseId: ex.exercise_id,
          prescriptionType: inferExercisePrescriptionType({
            durationSeconds: null,
            durationMinutes: ex.duration_minutes,
            sets: ex.sets,
            restBetweenSetsSeconds: ex.rest_between_sets_seconds,
          }),
          durationValue: intToField(ex.duration_minutes),
          durationUnit: "min",
          sets: intToField(ex.sets),
          reps: intToField(ex.reps),
          restBetweenSetsSeconds: intToField(ex.rest_between_sets_seconds),
          restAfterSeconds: intToField(ex.rest_after_seconds),
        });
      }

      if (exercises.length === 0) {
        warnings.push(`Session "${sess.name}" had no valid exercises — skipped.`);
        continue;
      }

      sessions.push({
        name: sess.name,
        description: sess.description ?? "",
        durationMinutes: intToField(sess.duration_minutes),
        exercises,
      });
    }

    if (sessions.length === 0) {
      warnings.push(`Track for ${loc.name} had no valid sessions — skipped.`);
      continue;
    }

    tracks.push({ locationId: loc.id, sessions });
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
      durationWeeks: intToField(draft.duration_weeks),
      sessionsPerWeek: intToField(draft.sessions_per_week),
      minutesPerSession: intToField(draft.minutes_per_session),
      outcomes: draft.outcomes.length > 0 ? draft.outcomes : [],
      tracks,
    },
    warnings,
  };
}
