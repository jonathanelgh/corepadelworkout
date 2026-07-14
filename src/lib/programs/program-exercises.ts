import type { SupabaseClient } from "@supabase/supabase-js";
import type { SessionPhase } from "@/lib/programs/session-phase";

export type ExercisePrescriptionType = "sets_reps" | "time" | "timed_intervals";

export const DEFAULT_REST_BETWEEN_SIDES_SECONDS = 15;

export type ProgramExerciseItem = {
  id: string;
  exerciseId: string;
  title: string;
  image_url: string | null;
  video_url: string | null;
  bothSides: boolean;
  sessionPhase: SessionPhase;
  choiceGroup: string | null;
  durationMinutes: number | null;
  durationSeconds: number | null;
  sets: number | null;
  reps: number | null;
  restBetweenSetsSeconds: number | null;
  restBetweenSidesSeconds: number | null;
  restAfterSeconds: number | null;
  loadPrescription: string | null;
  note: string | null;
};

type ExerciseNested = {
  id: string;
  title: string;
  image_url: string | null;
  video_url: string | null;
  both_sides: boolean | null;
};

type ProgramExerciseNested = {
  id: string;
  sort_order: number;
  duration_minutes: number | null;
  duration_seconds: number | null;
  sets: number | null;
  reps: number | null;
  rest_between_sets_seconds: number | null;
  rest_between_sides_seconds: number | null;
  rest_after_seconds: number | null;
  load_prescription: string | null;
  session_phase: SessionPhase | null;
  choice_group: string | null;
  note: string | null;
  exercises: ExerciseNested | ExerciseNested[] | null;
};

type SessionNested = {
  sort_order: number;
  program_exercises: ProgramExerciseNested | ProgramExerciseNested[] | null;
};

type TrackNested = {
  sort_order: number;
  program_sessions: SessionNested | SessionNested[] | null;
};

/** Infer prescription type from stored fields (no separate DB column). */
export function inferExercisePrescriptionType(fields: {
  durationSeconds?: number | null;
  durationMinutes?: number | null;
  sets?: number | null;
  restBetweenSetsSeconds?: number | null;
}): ExercisePrescriptionType {
  const hasDuration =
    (fields.durationSeconds != null && fields.durationSeconds > 0) ||
    (fields.durationMinutes != null && fields.durationMinutes > 0);
  const sets = fields.sets != null && fields.sets > 0 ? Math.round(fields.sets) : 0;
  const hasBetweenRest =
    fields.restBetweenSetsSeconds != null && fields.restBetweenSetsSeconds > 0;

  if (hasDuration && (sets > 1 || hasBetweenRest)) return "timed_intervals";
  if (hasDuration) return "time";
  return "sets_reps";
}

export function getExercisePrescriptionType(ex: ProgramExerciseItem): ExercisePrescriptionType {
  return inferExercisePrescriptionType({
    durationSeconds: ex.durationSeconds,
    durationMinutes: ex.durationMinutes,
    sets: ex.sets,
    restBetweenSetsSeconds: ex.restBetweenSetsSeconds,
  });
}

/** True when duration is explicitly set on the prescription (not the 60s default). */
export function hasExplicitWorkDuration(ex: ProgramExerciseItem): boolean {
  if (ex.durationSeconds != null && ex.durationSeconds > 0) return true;
  if (ex.durationMinutes != null && ex.durationMinutes > 0) return true;
  return false;
}

export function setsCount(ex: ProgramExerciseItem): number {
  const sets = ex.sets;
  if (sets != null && Number.isFinite(sets) && sets > 0) return Math.round(sets);
  return 1;
}

/** True when this exercise should run with a work timer in the player. */
export function exerciseUsesTimedPlayback(ex: ProgramExerciseItem): boolean {
  const type = getExercisePrescriptionType(ex);
  return type === "time" || type === "timed_intervals";
}

/** Repeat timed work (and optional rest) across multiple rounds. */
export function hasTimedSets(ex: ProgramExerciseItem): boolean {
  return getExercisePrescriptionType(ex) === "timed_intervals" && setsCount(ex) > 1;
}

export function workDurationSeconds(ex: ProgramExerciseItem): number {
  const secs = ex.durationSeconds;
  if (secs != null && Number.isFinite(secs) && secs > 0) {
    return Math.round(secs);
  }
  const mins = ex.durationMinutes;
  if (mins != null && Number.isFinite(mins) && mins > 0) {
    return Math.round(mins * 60);
  }
  return 60;
}

export function hasRestBetweenSets(ex: ProgramExerciseItem): boolean {
  return restBetweenSetsSeconds(ex) > 0;
}

export function restBetweenSetsSeconds(ex: ProgramExerciseItem): number {
  const rest = ex.restBetweenSetsSeconds;
  if (rest != null && Number.isFinite(rest) && rest > 0) {
    return Math.min(Math.round(rest), 3600);
  }
  return 0;
}

export function restBetweenSidesSeconds(ex: ProgramExerciseItem): number {
  const rest = ex.restBetweenSidesSeconds;
  if (rest != null && Number.isFinite(rest) && rest > 0) {
    return Math.min(Math.round(rest), 3600);
  }
  return DEFAULT_REST_BETWEEN_SIDES_SECONDS;
}

export function restDurationSeconds(ex: ProgramExerciseItem): number {
  const rest = ex.restAfterSeconds;
  if (rest != null && Number.isFinite(rest) && rest > 0) {
    return Math.min(Math.round(rest), 3600);
  }
  return 0;
}

function formatWorkDurationShort(secs: number): string {
  if (secs >= 60 && secs % 60 === 0) return `${secs / 60} min`;
  return `${secs}s`;
}

export function formatSetsRepsLabel(ex: ProgramExerciseItem): string | null {
  const type = getExercisePrescriptionType(ex);
  const workSecs = hasExplicitWorkDuration(ex) ? workDurationSeconds(ex) : null;
  const sets = ex.sets;
  const between = restBetweenSetsSeconds(ex);
  const sideRest = restBetweenSidesSeconds(ex);

  if (ex.bothSides && exerciseUsesTimedPlayback(ex) && workSecs != null) {
    const rounds = sets != null && sets > 0 ? sets : 1;
    const parts = [
      `${formatWorkDurationShort(workSecs)} per side`,
      `${sideRest}s switch`,
    ];
    if (rounds > 1) {
      parts.push(`${rounds} rounds`);
      if (between > 0) parts.push(`${between}s between rounds`);
    }
    return parts.join(" · ");
  }

  if (type === "timed_intervals" && workSecs != null) {
    const rounds = sets != null && sets > 0 ? sets : 1;
    if (between > 0) {
      return `${rounds}× (${formatWorkDurationShort(workSecs)} work · ${between}s rest)`;
    }
    if (rounds > 1) return `${rounds}×${formatWorkDurationShort(workSecs)}`;
    return formatWorkDurationShort(workSecs);
  }

  if (type === "time" && workSecs != null) {
    return formatWorkDurationShort(workSecs);
  }

  const parts: string[] = [];
  if (ex.loadPrescription?.trim()) {
    parts.push(ex.loadPrescription.trim());
  }
  if (sets != null && sets > 0 && ex.reps != null && ex.reps > 0) {
    parts.push(`${sets} sets · ${ex.reps} reps`);
  } else if (sets != null && sets > 0) {
    parts.push(`${sets} set${sets === 1 ? "" : "s"}`);
  } else if (ex.reps != null && ex.reps > 0) {
    parts.push(`${ex.reps} reps`);
  }
  if (workSecs != null && type === "sets_reps") {
    parts.push(formatWorkDurationShort(workSecs));
  } else if (ex.durationMinutes != null && ex.durationMinutes > 0 && type === "sets_reps") {
    parts.push(`${ex.durationMinutes} min`);
  }
  return parts.length > 0 ? parts.join(" · ") : null;
}

export function formatExerciseMeta(ex: ProgramExerciseItem): string {
  const prescription = formatSetsRepsLabel(ex);
  if (prescription) return prescription;
  if (getExercisePrescriptionType(ex) === "sets_reps") return "Go at your pace";
  return formatWorkDurationShort(workDurationSeconds(ex));
}

export async function fetchProgramExercises(
  supabase: SupabaseClient,
  programId: string
): Promise<ProgramExerciseItem[]> {
  const { data, error } = await supabase
    .from("program_location_tracks")
    .select(
      `
      sort_order,
      program_sessions (
        sort_order,
        program_exercises (
          id,
          sort_order,
          duration_minutes,
          duration_seconds,
          sets,
          reps,
          rest_between_sets_seconds,
          rest_between_sides_seconds,
          rest_after_seconds,
          load_prescription,
          session_phase,
          choice_group,
          note,
          exercises (
            id,
            title,
            image_url,
            video_url,
            both_sides
          )
        )
      )
    `
    )
    .eq("program_id", programId)
    .order("sort_order", { ascending: true });

  if (error) throw new Error(error.message);

  const flat: { order: number; item: ProgramExerciseItem }[] = [];

  for (const track of (data ?? []) as TrackNested[]) {
    const sessionsRaw = track.program_sessions;
    const sessions = Array.isArray(sessionsRaw)
      ? sessionsRaw
      : sessionsRaw
        ? [sessionsRaw]
        : [];

    for (const session of sessions.sort((a, b) => a.sort_order - b.sort_order)) {
      const peRaw = session.program_exercises;
      const pes = Array.isArray(peRaw) ? peRaw : peRaw ? [peRaw] : [];

      for (const pe of pes.sort((a, b) => a.sort_order - b.sort_order)) {
        const exRaw = pe.exercises;
        const ex = Array.isArray(exRaw) ? exRaw[0] : exRaw;
        if (!ex?.id || !ex.title) continue;

        flat.push({
          order: track.sort_order * 10_000 + session.sort_order * 100 + pe.sort_order,
          item: {
            id: pe.id,
            exerciseId: ex.id,
            title: ex.title,
            image_url: ex.image_url?.trim() || null,
            video_url: ex.video_url?.trim() || null,
            bothSides: Boolean(ex.both_sides),
            sessionPhase: pe.session_phase ?? "main",
            choiceGroup: pe.choice_group?.trim() || null,
            durationMinutes: pe.duration_minutes,
            durationSeconds: pe.duration_seconds,
            sets: pe.sets,
            reps: pe.reps,
            restBetweenSetsSeconds: pe.rest_between_sets_seconds,
            restBetweenSidesSeconds: pe.rest_between_sides_seconds,
            restAfterSeconds: pe.rest_after_seconds,
            loadPrescription: pe.load_prescription?.trim() || null,
            note: pe.note?.trim() || null,
          },
        });
      }
    }
  }

  flat.sort((a, b) => a.order - b.order);
  return flat.map((f) => f.item);
}

export async function fetchProgramSessionExercises(
  supabase: SupabaseClient,
  sessionId: string
): Promise<ProgramExerciseItem[]> {
  const { data, error } = await supabase
    .from("program_exercises")
    .select(
      `
      id,
      sort_order,
      duration_minutes,
      duration_seconds,
      sets,
      reps,
      rest_between_sets_seconds,
      rest_between_sides_seconds,
      rest_after_seconds,
      load_prescription,
      session_phase,
      choice_group,
      note,
      exercises (
        id,
        title,
        image_url,
        video_url,
        both_sides
      )
    `
    )
    .eq("session_id", sessionId)
    .order("sort_order", { ascending: true });

  if (error) throw new Error(error.message);

  const items: ProgramExerciseItem[] = [];
  for (const pe of data ?? []) {
    const row = pe as ProgramExerciseNested;
    const exRaw = row.exercises;
    const ex = Array.isArray(exRaw) ? exRaw[0] : exRaw;
    if (!ex?.id || !ex.title) continue;
    items.push({
      id: row.id,
      exerciseId: ex.id,
      title: ex.title,
      image_url: ex.image_url?.trim() || null,
      video_url: ex.video_url?.trim() || null,
      bothSides: Boolean(ex.both_sides),
      sessionPhase: row.session_phase ?? "main",
      choiceGroup: row.choice_group?.trim() || null,
      durationMinutes: row.duration_minutes,
      durationSeconds: row.duration_seconds,
      sets: row.sets,
      reps: row.reps,
      restBetweenSetsSeconds: row.rest_between_sets_seconds,
      restBetweenSidesSeconds: row.rest_between_sides_seconds,
      restAfterSeconds: row.rest_after_seconds,
      loadPrescription: row.load_prescription?.trim() || null,
      note: row.note?.trim() || null,
    });
  }
  return items;
}
