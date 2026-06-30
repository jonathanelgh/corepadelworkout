import type { SupabaseClient } from "@supabase/supabase-js";
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
};

export async function insertProgramCurriculum(
  supabase: SupabaseClient,
  programId: string,
  tracks: TrackPayload[]
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

    for (let si = 0; si < tr.sessions.length; si++) {
      const s = tr.sessions[si];
      const label = s.name.trim() || `Session ${si + 1}`;
      const { data: sessionRow, error: sErr } = await supabase
        .from("program_sessions")
        .insert({
          track_id: trackRow.id,
          name: label,
          description: s.description,
          duration_minutes: s.duration_minutes,
          sort_order: si,
        })
        .select("id")
        .single();

      if (sErr || !sessionRow) {
        throw new Error(sErr?.message ?? "Could not create session.");
      }

      if (s.exercises.length > 0) {
        const rows = s.exercises.map((ex, j) => ({
          session_id: sessionRow.id,
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
        }));
        const { error: peError } = await supabase.from("program_exercises").insert(rows);
        if (peError) throw new Error(peError.message);
      }
    }
  }
}
