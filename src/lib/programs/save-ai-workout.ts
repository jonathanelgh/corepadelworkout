import type { SupabaseClient } from "@supabase/supabase-js";
import type { WorkoutProposal } from "./ai-coach-gemini";
import { aiExerciseToProgramPayload } from "./normalize-ai-exercise-prescription";
import { insertProgramCurriculum, type ProgramExercisePayload } from "./program-curriculum";
import { slugifyTitle, uniqueProgramSlug } from "./program-slug";

function estimateTotalMinutes(proposal: WorkoutProposal): number {
  let total = 0;
  for (let i = 0; i < proposal.exercises.length; i++) {
    const ex = proposal.exercises[i]!;
    const payload = aiExerciseToProgramPayload(
      { ...ex, choice_group: ex.choice_group ?? null, note: ex.note ?? null },
      { isLastInSession: i === proposal.exercises.length - 1 }
    );
    if (payload.duration_seconds) total += payload.duration_seconds / 60;
    if (payload.rest_after_seconds) total += payload.rest_after_seconds / 60;
    if (payload.rest_between_sets_seconds && payload.sets && payload.sets > 1) {
      total += ((payload.rest_between_sets_seconds * (payload.sets - 1)) / 60);
    }
  }
  return Math.ceil(total) || 15;
}

async function resolveLocationId(supabase: SupabaseClient, slug: string): Promise<string> {
  const { data, error } = await supabase
    .from("locations")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();
  if (error || !data?.id) {
    throw new Error(`Location "${slug}" not found in database.`);
  }
  return data.id as string;
}

export type SaveAiWorkoutResult = {
  programId: string;
  slug: string;
  title: string;
  description: string;
  totalMinutes: number;
  status: "draft" | "published";
};

export async function saveAiWorkoutProgram(
  supabase: SupabaseClient,
  proposal: WorkoutProposal,
  options?: {
    status?: "draft" | "published";
    allowedExerciseIds?: Set<string>;
    createdByUserId?: string | null;
    locationSlug?: string;
  }
): Promise<SaveAiWorkoutResult> {
  const status = options?.status ?? "draft";

  if (proposal.exercises.length === 0) {
    throw new Error("Workout has no exercises.");
  }

  const exerciseIds = proposal.exercises.map((e) => e.exercise_id);
  if (options?.allowedExerciseIds) {
    for (const id of exerciseIds) {
      if (!options.allowedExerciseIds.has(id)) {
        throw new Error("Workout includes exercises not in the catalog. Regenerate the workout.");
      }
    }
  }

  const { data: existingRows, error: exErr } = await supabase
    .from("exercises")
    .select("id")
    .in("id", exerciseIds);

  if (exErr) throw new Error(exErr.message);
  const found = new Set((existingRows ?? []).map((r) => r.id as string));
  if (found.size !== exerciseIds.length) {
    throw new Error("One or more exercises are not in the library. Regenerate the workout.");
  }

  const totalMinutes = estimateTotalMinutes(proposal);
  const locationSlug = options?.locationSlug?.trim() || "home";
  const locationId = await resolveLocationId(supabase, locationSlug);
  const slug = await uniqueProgramSlug(supabase, slugifyTitle(proposal.title));

  const { data: program, error: programErr } = await supabase
    .from("programs")
    .insert({
      title: proposal.title,
      slug,
      description: proposal.description,
      status,
      program_format: "single_workout",
      minutes_per_session: totalMinutes,
      sessions_per_week: null,
      duration_weeks: null,
      ...(options?.createdByUserId ? { created_by_user_id: options.createdByUserId } : {}),
    })
    .select("id, slug, title")
    .single();

  if (programErr || !program) {
    if (programErr?.message?.includes("created_by_user_id")) {
      throw new Error(
        "Saving member workouts requires a database update. Run supabase db push or contact support."
      );
    }
    throw new Error(programErr?.message ?? "Could not create program.");
  }

  const programId = program.id as string;

  const exerciseRows: ProgramExercisePayload[] = proposal.exercises.map((ex, index) =>
    aiExerciseToProgramPayload(
      { ...ex, choice_group: ex.choice_group ?? null, note: ex.note ?? null },
      { isLastInSession: index === proposal.exercises.length - 1 }
    )
  );

  try {
    await insertProgramCurriculum(
      supabase,
      programId,
      [
        {
          location_id: locationId,
          sessions: [
            {
              name: proposal.title.trim() || "Workout",
              description: proposal.description?.trim() || null,
              duration_minutes: totalMinutes,
              exercises: exerciseRows,
            },
          ],
        },
      ],
      { programFormat: "single_workout", sessionsPerWeek: null }
    );
  } catch (e) {
    await supabase.from("programs").delete().eq("id", programId);
    throw e;
  }

  return {
    programId,
    slug: program.slug as string,
    title: program.title as string,
    description: proposal.description,
    totalMinutes,
    status,
  };
}
