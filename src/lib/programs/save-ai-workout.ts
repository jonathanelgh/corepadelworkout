import type { SupabaseClient } from "@supabase/supabase-js";
import type { WorkoutProposal } from "./ai-coach-gemini";

function slugifyTitle(title: string): string {
  const s = title
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-+/g, "-");
  return s.length > 0 ? s : "program";
}

async function uniqueProgramSlug(supabase: SupabaseClient, base: string): Promise<string> {
  let slug = base;
  let n = 0;
  for (;;) {
    const { data } = await supabase.from("programs").select("id").eq("slug", slug).maybeSingle();
    if (!data) return slug;
    n += 1;
    slug = `${base}-${n}`;
  }
}

function estimateTotalMinutes(proposal: WorkoutProposal): number {
  let total = 0;
  for (const ex of proposal.exercises) {
    if (ex.duration_minutes) total += ex.duration_minutes;
    if (ex.rest_after_seconds) total += ex.rest_after_seconds / 60;
  }
  return Math.ceil(total) || 15;
}

async function resolveHomeLocationId(supabase: SupabaseClient): Promise<string> {
  const { data, error } = await supabase
    .from("locations")
    .select("id")
    .eq("slug", "home")
    .maybeSingle();
  if (error || !data?.id) {
    throw new Error("Home location not found in database.");
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
  options?: { status?: "draft" | "published"; allowedExerciseIds?: Set<string> }
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
  const homeLocationId = await resolveHomeLocationId(supabase);
  const slug = await uniqueProgramSlug(supabase, slugifyTitle(proposal.title));

  const { data: program, error: programErr } = await supabase
    .from("programs")
    .insert({
      title: proposal.title,
      slug,
      description: proposal.description,
      status,
      minutes_per_session: totalMinutes,
      sessions_per_week: 1,
      duration_weeks: 1,
    })
    .select("id, slug, title")
    .single();

  if (programErr || !program) {
    throw new Error(programErr?.message ?? "Could not create program.");
  }

  const programId = program.id as string;

  try {
    const { data: track, error: trackErr } = await supabase
      .from("program_location_tracks")
      .insert({
        program_id: programId,
        location_id: homeLocationId,
        sort_order: 0,
      })
      .select("id")
      .single();

    if (trackErr || !track) {
      throw new Error(trackErr?.message ?? "Could not create location track.");
    }

    const { data: session, error: sessionErr } = await supabase
      .from("program_sessions")
      .insert({
        track_id: track.id,
        name: "Day 1",
        duration_minutes: totalMinutes,
        sort_order: 0,
      })
      .select("id")
      .single();

    if (sessionErr || !session) {
      throw new Error(sessionErr?.message ?? "Could not create session.");
    }

    const exerciseRows = proposal.exercises.map((ex, i) => ({
      session_id: session.id as string,
      exercise_id: ex.exercise_id,
      sort_order: i,
      duration_minutes: null,
      duration_seconds: ex.duration_minutes ? Math.ceil(ex.duration_minutes * 60) : null,
      sets: ex.sets ? Math.ceil(ex.sets) : null,
      reps: ex.reps ? Math.ceil(ex.reps) : null,
      rest_after_seconds: Math.ceil(ex.rest_after_seconds ?? 0),
    }));

    const { error: linkErr } = await supabase.from("program_exercises").insert(exerciseRows);
    if (linkErr) throw new Error(linkErr.message);
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
