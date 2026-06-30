import type { SupabaseClient } from "@supabase/supabase-js";
import type { ProgramFormat } from "@/lib/programs/program-format";
import type { SessionPhase } from "@/lib/programs/session-phase";

export type ProgramExercisePayload = {
  exercise_id: string;
  duration_minutes: number | null;
  duration_seconds: number | null;
  sets: number | null;
  reps: number | null;
  rest_between_sets_seconds: number | null;
  rest_after_seconds: number | null;
  session_phase: SessionPhase;
  choice_group: string | null;
  note: string | null;
};

export type SessionPayload = {
  name: string;
  description: string | null;
  duration_minutes: number | null;
  exercises: ProgramExercisePayload[];
};

export type TrackPayload = {
  location_id: string;
  sessions: SessionPayload[];
  /** Day counts per calendar week; when set, overrides sessions_per_week grouping on save */
  week_sizes?: number[];
};

export type CurriculumOptions = {
  programFormat: ProgramFormat;
  sessionsPerWeek: number | null;
};

function effectiveSessionsPerWeek(sessionsPerWeek: number | null, sessionCount: number): number {
  if (sessionsPerWeek != null && sessionsPerWeek > 0) return sessionsPerWeek;
  return Math.max(1, sessionCount);
}

async function insertSessionExercises(
  supabase: SupabaseClient,
  sessionId: string,
  exercises: ProgramExercisePayload[]
): Promise<void> {
  if (exercises.length === 0) return;
  const rows = exercises.map((ex, j) => ({
    session_id: sessionId,
    exercise_id: ex.exercise_id,
    sort_order: j,
    duration_minutes: ex.duration_seconds != null ? null : ex.duration_minutes,
    duration_seconds: ex.duration_seconds,
    sets: ex.sets,
    reps: ex.reps,
    rest_between_sets_seconds: ex.rest_between_sets_seconds,
    rest_after_seconds: ex.rest_after_seconds,
    session_phase: ex.session_phase,
    choice_group: ex.choice_group,
    note: ex.note?.trim() || null,
  }));
  const { error } = await supabase.from("program_exercises").insert(rows);
  if (error) throw new Error(error.message);
}

async function insertSessionRow(
  supabase: SupabaseClient,
  trackId: string,
  weekId: string | null,
  s: SessionPayload,
  sortOrder: number
): Promise<void> {
  const label = s.name.trim() || `Session ${sortOrder + 1}`;
  const { data: sessionRow, error: sErr } = await supabase
    .from("program_sessions")
    .insert({
      track_id: trackId,
      week_id: weekId,
      name: label,
      description: s.description,
      duration_minutes: s.duration_minutes,
      sort_order: sortOrder,
    })
    .select("id")
    .single();

  if (sErr || !sessionRow) {
    throw new Error(sErr?.message ?? "Could not create session.");
  }

  await insertSessionExercises(supabase, sessionRow.id, s.exercises);
}

export async function insertProgramCurriculum(
  supabase: SupabaseClient,
  programId: string,
  tracks: TrackPayload[],
  options: CurriculumOptions
): Promise<void> {
  for (let ti = 0; ti < tracks.length; ti++) {
    const tr = tracks[ti];
    const { data: trackRow, error: tErr } = await supabase
      .from("program_location_tracks")
      .insert({
        program_id: programId,
        location_id: tr.location_id,
        sort_order: ti,
      })
      .select("id")
      .single();

    if (tErr || !trackRow) {
      throw new Error(tErr?.message ?? "Could not create location track.");
    }

    const sessions =
      options.programFormat === "single_workout" ? tr.sessions.slice(0, 1) : tr.sessions;

    if (options.programFormat === "single_workout") {
      for (let si = 0; si < sessions.length; si++) {
        await insertSessionRow(supabase, trackRow.id, null, sessions[si]!, si);
      }
      continue;
    }

    const weekSizes =
      tr.week_sizes?.filter((n) => Number.isFinite(n) && n > 0) ?? [];
    const weekSizesTotal = weekSizes.reduce((sum, n) => sum + n, 0);
    const useExplicitWeeks = weekSizes.length > 0 && weekSizesTotal === sessions.length;

    if (useExplicitWeeks) {
      let si = 0;
      for (let wi = 0; wi < weekSizes.length; wi++) {
        const weekNum = wi + 1;
        const { data: weekRow, error: wErr } = await supabase
          .from("program_weeks")
          .insert({
            track_id: trackRow.id,
            week_number: weekNum,
            name: `Week ${weekNum}`,
            sort_order: wi,
          })
          .select("id")
          .single();
        if (wErr || !weekRow) {
          throw new Error(wErr?.message ?? "Could not create program week.");
        }

        const daysInWeek = weekSizes[wi]!;
        for (let d = 0; d < daysInWeek; d++) {
          await insertSessionRow(supabase, trackRow.id, weekRow.id, sessions[si]!, si);
          si += 1;
        }
      }
      continue;
    }

    const perWeek = effectiveSessionsPerWeek(options.sessionsPerWeek, sessions.length);
    let weekId: string | null = null;
    let weekNum = 0;
    let dayInWeek = 0;

    for (let si = 0; si < sessions.length; si++) {
      if (dayInWeek === 0) {
        weekNum += 1;
        const { data: weekRow, error: wErr } = await supabase
          .from("program_weeks")
          .insert({
            track_id: trackRow.id,
            week_number: weekNum,
            name: `Week ${weekNum}`,
            sort_order: weekNum - 1,
          })
          .select("id")
          .single();
        if (wErr || !weekRow) {
          throw new Error(wErr?.message ?? "Could not create program week.");
        }
        weekId = weekRow.id;
      }

      await insertSessionRow(supabase, trackRow.id, weekId, sessions[si]!, si);

      dayInWeek += 1;
      if (dayInWeek >= perWeek) {
        dayInWeek = 0;
      }
    }
  }
}
