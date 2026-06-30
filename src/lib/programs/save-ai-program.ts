import type { SupabaseClient } from "@supabase/supabase-js";
import type { ProgramProposal } from "./ai-coach-gemini";
import { expandSessionsToTarget } from "./expand-program-sessions";
import {
  insertProgramCurriculum,
  type ProgramExercisePayload,
  type SessionPayload,
} from "./program-curriculum";
import {
  buildTrainingPlanTrack,
  normalizeTrainingPlanSessionNames,
} from "./training-plan-curriculum";
import { slugifyTitle, uniqueProgramSlug } from "./program-slug";

async function resolveLocationId(supabase: SupabaseClient, slug?: string): Promise<string> {
  const normalized = (slug?.trim() || "home").toLowerCase();
  const { data, error } = await supabase
    .from("locations")
    .select("id")
    .eq("slug", normalized)
    .maybeSingle();
  if (error || !data?.id) {
    throw new Error(`Location "${normalized}" not found in database.`);
  }
  return data.id as string;
}

function estimateSessionMinutes(session: ProgramProposal["sessions"][number]): number {
  let total = 0;
  for (const ex of session.exercises) {
    if (ex.duration_minutes) total += ex.duration_minutes;
    if (ex.rest_after_seconds) total += ex.rest_after_seconds / 60;
  }
  return Math.ceil(total) || 15;
}

function toExercisePayload(
  exercises: ProgramProposal["sessions"][number]["exercises"]
): ProgramExercisePayload[] {
  return exercises.map((ex) => ({
    exercise_id: ex.exercise_id,
    duration_minutes: null,
    duration_seconds: ex.duration_minutes ? Math.ceil(ex.duration_minutes * 60) : null,
    sets: ex.sets ? Math.ceil(ex.sets) : null,
    reps: ex.reps ? Math.ceil(ex.reps) : null,
    rest_between_sets_seconds: null,
    rest_after_seconds: Math.ceil(ex.rest_after_seconds ?? 0),
    session_phase: ex.phase,
    choice_group: ex.choice_group ?? null,
    note: null,
  }));
}

export type SaveAiProgramResult = {
  programId: string;
  slug: string;
  title: string;
  description: string;
  sessionCount: number;
  status: "draft" | "published";
};

export async function saveAiProgram(
  supabase: SupabaseClient,
  proposal: ProgramProposal,
  options?: {
    status?: "draft" | "published";
    allowedExerciseIds?: Set<string>;
    /** Override model output with consultation / UI schedule */
    durationWeeks?: number;
    sessionsPerWeek?: number;
    minutesPerSession?: number;
  }
): Promise<SaveAiProgramResult> {
  const status = options?.status ?? "draft";
  const durationWeeks = Math.max(
    1,
    Math.floor(options?.durationWeeks ?? proposal.duration_weeks)
  );
  const sessionsPerWeek = Math.max(
    1,
    Math.floor(options?.sessionsPerWeek ?? proposal.sessions_per_week)
  );
  const targetSessionCount = durationWeeks * sessionsPerWeek;

  if (proposal.sessions.length === 0) {
    throw new Error("Program has no sessions.");
  }

  const { sessions: expandedSessions } = expandSessionsToTarget(proposal.sessions, targetSessionCount);

  const locationId = await resolveLocationId(supabase, proposal.location_slug);
  const slug = await uniqueProgramSlug(supabase, slugifyTitle(proposal.title));

  let sessionPayloads: SessionPayload[] = expandedSessions.map((s) => ({
    name: s.name,
    description: s.description?.trim() || null,
    duration_minutes:
      s.duration_minutes ??
      estimateSessionMinutes({
        exercises: s.exercises,
        name: s.name,
      } as ProgramProposal["sessions"][number]),
    exercises: toExercisePayload(s.exercises),
  }));

  sessionPayloads = normalizeTrainingPlanSessionNames(sessionPayloads);

  const allExerciseIds = sessionPayloads.flatMap((s) => s.exercises.map((e) => e.exercise_id));
  if (allExerciseIds.length === 0) {
    throw new Error("Program has no exercises.");
  }

  if (options?.allowedExerciseIds) {
    for (const id of allExerciseIds) {
      if (!options.allowedExerciseIds.has(id)) {
        throw new Error("Program includes exercises not in the catalog. Regenerate the program.");
      }
    }
  }

  const uniqueIds = [...new Set(allExerciseIds)];
  const { data: existingRows, error: exErr } = await supabase
    .from("exercises")
    .select("id")
    .in("id", uniqueIds);

  if (exErr) throw new Error(exErr.message);
  const found = new Set((existingRows ?? []).map((r) => r.id as string));
  if (found.size !== uniqueIds.length) {
    throw new Error("One or more exercises are not in the library. Regenerate the program.");
  }

  const minutesPerSession =
    options?.minutesPerSession ??
    proposal.minutes_per_session ??
    Math.round(
      sessionPayloads.reduce((sum, s) => sum + (s.duration_minutes ?? 15), 0) /
        sessionPayloads.length
    );

  const tracks = [buildTrainingPlanTrack(locationId, sessionPayloads, sessionsPerWeek)];

  const { data: program, error: programErr } = await supabase
    .from("programs")
    .insert({
      title: proposal.title,
      slug,
      description: proposal.description,
      body: proposal.body?.trim() || null,
      status,
      minutes_per_session: minutesPerSession,
      sessions_per_week: sessionsPerWeek,
      duration_weeks: durationWeeks,
      program_format: "training_plan",
    })
    .select("id, slug, title")
    .single();

  if (programErr || !program) {
    throw new Error(programErr?.message ?? "Could not create program.");
  }

  const programId = program.id as string;

  try {
    await insertProgramCurriculum(supabase, programId, tracks, {
      programFormat: "training_plan",
      sessionsPerWeek,
    });
  } catch (e) {
    await supabase.from("programs").delete().eq("id", programId);
    throw e;
  }

  return {
    programId,
    slug: program.slug as string,
    title: program.title as string,
    description: proposal.description,
    sessionCount: sessionPayloads.length,
    status,
  };
}
