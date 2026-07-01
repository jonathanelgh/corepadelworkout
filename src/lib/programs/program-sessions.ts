import type { SupabaseClient } from "@supabase/supabase-js";
import type { ProgramExerciseItem } from "@/lib/programs/program-exercises";
import { fetchProgramSessionExercises } from "@/lib/programs/program-exercises";

export type ProgramSessionRow = {
  id: string;
  name: string;
  description: string | null;
  durationMinutes: number | null;
  sortOrder: number;
  exerciseCount: number;
  weekId: string | null;
  weekNumber: number | null;
  dayInWeek: number | null;
};

export type ProgramWeekRow = {
  id: string;
  weekNumber: number;
  name: string;
  sessions: ProgramSessionRow[];
};

type TrackRow = {
  id: string;
  sort_order: number;
  locations: { slug: string } | { slug: string }[] | null;
  program_sessions: SessionDbRow | SessionDbRow[] | null;
};

type WeekDbRow = {
  id: string;
  week_number: number;
  name: string | null;
  sort_order: number;
};

type SessionDbRow = {
  id: string;
  name: string;
  description: string | null;
  duration_minutes: number | null;
  sort_order: number;
  week_id: string | null;
  program_exercises: { id: string } | { id: string }[] | null;
  program_weeks: WeekDbRow | WeekDbRow[] | null;
};

const ENV_TO_LOCATION_SLUG: Record<string, string> = {
  gym: "gym",
  home: "home",
  club: "at-the-court",
};

function preferredLocationSlugs(profile?: {
  training_environment: string | null;
  training_environments: string[] | null;
} | null): string[] {
  const out: string[] = [];
  if (profile?.training_environments?.length) {
    for (const env of profile.training_environments) {
      const slug = ENV_TO_LOCATION_SLUG[env];
      if (slug && !out.includes(slug)) out.push(slug);
    }
  }
  if (profile?.training_environment) {
    const slug = ENV_TO_LOCATION_SLUG[profile.training_environment];
    if (slug && !out.includes(slug)) out.push(slug);
  }
  return out;
}

function countExercises(raw: SessionDbRow["program_exercises"]): number {
  if (!raw) return 0;
  return Array.isArray(raw) ? raw.length : 1;
}

function mapSession(row: SessionDbRow, dayInWeek: number | null): ProgramSessionRow {
  const weekRaw = row.program_weeks;
  const week = Array.isArray(weekRaw) ? weekRaw[0] : weekRaw;
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    durationMinutes: row.duration_minutes,
    sortOrder: row.sort_order,
    exerciseCount: countExercises(row.program_exercises),
    weekId: row.week_id ?? week?.id ?? null,
    weekNumber: week?.week_number ?? null,
    dayInWeek,
  };
}

function buildWeeksFromSessions(sessions: ProgramSessionRow[]): ProgramWeekRow[] {
  const byWeek = new Map<number, ProgramSessionRow[]>();
  for (const s of sessions) {
    const wn = s.weekNumber ?? 1;
    const list = byWeek.get(wn) ?? [];
    list.push(s);
    byWeek.set(wn, list);
  }
  return [...byWeek.entries()]
    .sort(([a], [b]) => a - b)
    .map(([weekNumber, weekSessions]) => ({
      id: weekSessions[0]?.weekId ?? `week-${weekNumber}`,
      weekNumber,
      name: `Week ${weekNumber}`,
      sessions: weekSessions.sort((a, b) => a.sortOrder - b.sortOrder),
    }));
}

async function fetchWeeksForTrack(
  supabase: SupabaseClient,
  trackId: string
): Promise<WeekDbRow[]> {
  const { data, error } = await supabase
    .from("program_weeks")
    .select("id, week_number, name, sort_order")
    .eq("track_id", trackId)
    .order("sort_order", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as WeekDbRow[];
}

function buildWeeksFromTrackWeeks(
  weeksData: WeekDbRow[],
  sessions: ProgramSessionRow[]
): ProgramWeekRow[] {
  if (weeksData.length === 0) {
    return buildWeeksFromSessions(sessions);
  }

  const assigned = new Set<string>();
  const weeks: ProgramWeekRow[] = weeksData.map((week) => {
    const weekSessions = sessions
      .filter((s) => s.weekId === week.id)
      .sort((a, b) => a.sortOrder - b.sortOrder);
    for (const s of weekSessions) assigned.add(s.id);
    return {
      id: week.id,
      weekNumber: week.week_number,
      name: week.name?.trim() || `Week ${week.week_number}`,
      sessions: weekSessions,
    };
  });

  const orphans = sessions.filter((s) => !assigned.has(s.id));
  if (orphans.length > 0) {
    const firstWeek = weeks[0];
    if (firstWeek) {
      firstWeek.sessions = [...firstWeek.sessions, ...orphans].sort(
        (a, b) => a.sortOrder - b.sortOrder
      );
    } else {
      weeks.push(...buildWeeksFromSessions(orphans));
    }
  }

  return weeks;
}

const TRACK_SESSIONS_SELECT = `
  id,
  sort_order,
  locations ( slug ),
  program_sessions (
    id,
    name,
    description,
    duration_minutes,
    sort_order,
    week_id,
    program_exercises ( id ),
    program_weeks ( id, week_number, name, sort_order )
  )
`;

async function sessionsAndWeeksForTrack(
  supabase: SupabaseClient,
  track: TrackRow
): Promise<{ trackId: string; sessions: ProgramSessionRow[]; weeks: ProgramWeekRow[] }> {
  const sessionsRaw = track.program_sessions;
  const sessionsArr = Array.isArray(sessionsRaw)
    ? sessionsRaw
    : sessionsRaw
      ? [sessionsRaw]
      : [];

  const sorted = [...sessionsArr].sort((a, b) => a.sort_order - b.sort_order);
  const perWeekCounts = new Map<number, number>();
  const sessions = sorted.map((row) => {
    const weekRaw = row.program_weeks;
    const week = Array.isArray(weekRaw) ? weekRaw[0] : weekRaw;
    const weekNum = week?.week_number ?? 1;
    const dayInWeek = (perWeekCounts.get(weekNum) ?? 0) + 1;
    perWeekCounts.set(weekNum, dayInWeek);
    return mapSession(row, dayInWeek);
  });

  const weeksData = await fetchWeeksForTrack(supabase, track.id);

  return {
    trackId: track.id,
    sessions,
    weeks: buildWeeksFromTrackWeeks(weeksData, sessions),
  };
}

/** Load sessions for the track the member already started (stable across logins). */
export async function fetchProgramSessionsForTrack(
  supabase: SupabaseClient,
  trackId: string
): Promise<{ trackId: string; sessions: ProgramSessionRow[]; weeks: ProgramWeekRow[] }> {
  const { data, error } = await supabase
    .from("program_location_tracks")
    .select(TRACK_SESSIONS_SELECT)
    .eq("id", trackId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) throw new Error("Training track not found.");

  return sessionsAndWeeksForTrack(supabase, data as TrackRow);
}

export async function fetchProgramSessionsForProgram(
  supabase: SupabaseClient,
  programId: string,
  profile?: {
    training_environment: string | null;
    training_environments: string[] | null;
  } | null
): Promise<{ trackId: string; sessions: ProgramSessionRow[]; weeks: ProgramWeekRow[] }> {
  const { data, error } = await supabase
    .from("program_location_tracks")
    .select(TRACK_SESSIONS_SELECT)
    .eq("program_id", programId)
    .order("sort_order", { ascending: true });

  if (error) throw new Error(error.message);

  const tracks = (data ?? []) as TrackRow[];
  if (tracks.length === 0) {
    throw new Error("Program has no training track.");
  }

  const prefs = preferredLocationSlugs(profile);
  let picked = tracks[0]!;
  for (const slug of prefs) {
    const match = tracks.find((t) => {
      const loc = t.locations;
      const row = Array.isArray(loc) ? loc[0] : loc;
      return row?.slug === slug;
    });
    if (match) {
      picked = match;
      break;
    }
  }

  return sessionsAndWeeksForTrack(supabase, picked);
}

export async function getSessionBelongsToProgram(
  supabase: SupabaseClient,
  programId: string,
  sessionId: string
): Promise<ProgramSessionRow | null> {
  const { data, error } = await supabase
    .from("program_sessions")
    .select(
      `
      id,
      name,
      description,
      duration_minutes,
      sort_order,
      week_id,
      program_exercises ( id ),
      program_weeks ( id, week_number, name, sort_order ),
      program_location_tracks!inner ( program_id )
    `
    )
    .eq("id", sessionId)
    .maybeSingle();

  if (error || !data) return null;

  const track = data.program_location_tracks as { program_id: string } | { program_id: string }[];
  const trackRow = Array.isArray(track) ? track[0] : track;
  if (trackRow?.program_id !== programId) return null;

  return mapSession(data as SessionDbRow, null);
}

export async function loadSessionWorkout(
  supabase: SupabaseClient,
  programId: string,
  sessionId: string
): Promise<{ session: ProgramSessionRow; exercises: ProgramExerciseItem[] } | null> {
  const session = await getSessionBelongsToProgram(supabase, programId, sessionId);
  if (!session) return null;
  const exercises = await fetchProgramSessionExercises(supabase, sessionId);
  return { session, exercises };
}

export function sessionDisplayLabel(session: ProgramSessionRow, flatIndex: number): string {
  if (session.name?.trim()) return session.name.trim();
  if (session.weekNumber != null && session.dayInWeek != null) {
    return `Week ${session.weekNumber} · Day ${session.dayInWeek}`;
  }
  return `Day ${flatIndex + 1}`;
}
