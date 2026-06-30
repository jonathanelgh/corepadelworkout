import type { SupabaseClient } from "@supabase/supabase-js";
import { usesProgramProgress, type ProgramFormat } from "@/lib/programs/program-format";
import { userHasProgramAccess } from "@/lib/programs/check-program-access";
import {
  fetchProgramSessionsForProgram,
  type ProgramSessionRow,
  type ProgramWeekRow,
} from "@/lib/programs/program-sessions";
import { programTrainingHref } from "@/lib/programs/program-routes";
import { sessionDisplayLabel } from "@/lib/programs/program-sessions";

export type SessionWithCompletion = ProgramSessionRow & {
  startedAt: string | null;
  completedAt: string | null;
};

export type ProgramWeekWithCompletion = Omit<ProgramWeekRow, "sessions"> & {
  sessions: SessionWithCompletion[];
};

export type ProgramProgressView = {
  runId: string | null;
  trackId: string;
  startedAt: string | null;
  sessions: SessionWithCompletion[];
  weeks: ProgramWeekWithCompletion[];
  completedCount: number;
  totalSessions: number;
  nextSession: ProgramSessionRow | null;
  isComplete: boolean;
};

type ProfileEnv = {
  training_environment: string | null;
  training_environments: string[] | null;
};

type SessionCompletionRow = {
  session_id: string;
  started_at: string | null;
  completed_at: string | null;
};

function attachCompletions(
  sessions: ProgramSessionRow[],
  weeks: ProgramWeekRow[],
  completionsBySession: Map<string, SessionCompletionRow>
): {
  sessions: SessionWithCompletion[];
  weeks: ProgramWeekWithCompletion[];
  completedCount: number;
} {
  const withTimestamps = (s: ProgramSessionRow): SessionWithCompletion => {
    const row = completionsBySession.get(s.id);
    return {
      ...s,
      startedAt: row?.started_at ?? null,
      completedAt: row?.completed_at ?? null,
    };
  };

  const sessionsWithCompletion: SessionWithCompletion[] = sessions.map(withTimestamps);

  const weeksWithCompletion: ProgramWeekWithCompletion[] = weeks.map((w) => ({
    ...w,
    sessions: w.sessions.map(withTimestamps),
  }));

  const completedCount = sessionsWithCompletion.filter((s) => s.completedAt).length;
  return { sessions: sessionsWithCompletion, weeks: weeksWithCompletion, completedCount };
}

export async function loadProgramProgress(
  supabase: SupabaseClient,
  userId: string,
  programId: string,
  profile?: ProfileEnv | null,
  programFormat: ProgramFormat = "training_plan"
): Promise<ProgramProgressView | null> {
  const { trackId, sessions, weeks } = await fetchProgramSessionsForProgram(
    supabase,
    programId,
    profile
  );
  if (sessions.length === 0) return null;

  let run: { id: string; track_id: string; started_at: string } | null = null;
  let completions: SessionCompletionRow[] = [];

  if (userId) {
    if (usesProgramProgress(programFormat)) {
      const [{ data: runRow }, { data: completionRows }] = await Promise.all([
        supabase
          .from("program_runs")
          .select("id, track_id, started_at")
          .eq("user_id", userId)
          .eq("program_id", programId)
          .maybeSingle(),
        supabase
          .from("program_session_completions")
          .select("session_id, started_at, completed_at")
          .eq("user_id", userId)
          .eq("program_id", programId),
      ]);
      run = runRow;
      completions = (completionRows ?? []) as SessionCompletionRow[];
    } else {
      const { data: completionRows } = await supabase
        .from("program_session_completions")
        .select("session_id, started_at, completed_at")
        .eq("user_id", userId)
        .eq("program_id", programId);
      completions = (completionRows ?? []) as SessionCompletionRow[];
    }
  }

  const completionsBySession = new Map(
    completions.map((c) => [c.session_id, c])
  );

  const { sessions: sessionsWithCompletion, weeks: weeksWithCompletion, completedCount } =
    attachCompletions(sessions, weeks, completionsBySession);

  const nextSession = usesProgramProgress(programFormat)
    ? sessionsWithCompletion.find((s) => !s.completedAt) ?? null
    : sessionsWithCompletion[0] ?? null;

  return {
    runId: run?.id ?? null,
    trackId: run?.track_id ?? trackId,
    startedAt: run?.started_at ?? null,
    sessions: sessionsWithCompletion,
    weeks: weeksWithCompletion,
    completedCount,
    totalSessions: sessions.length,
    nextSession,
    isComplete:
      usesProgramProgress(programFormat) &&
      completedCount >= sessions.length &&
      sessions.length > 0,
  };
}

export async function ensureProgramRun(
  supabase: SupabaseClient,
  userId: string,
  programId: string,
  profile?: ProfileEnv | null,
  programFormat: ProgramFormat = "training_plan"
): Promise<ProgramProgressView> {
  if (!usesProgramProgress(programFormat)) {
    const progress = await loadProgramProgress(supabase, userId, programId, profile, programFormat);
    if (!progress) throw new Error("This workout has no exercises yet.");
    return progress;
  }

  const { trackId, sessions } = await fetchProgramSessionsForProgram(supabase, programId, profile);
  if (sessions.length === 0) {
    throw new Error("This program has no training days yet.");
  }

  const { data: existing } = await supabase
    .from("program_runs")
    .select("id, track_id, started_at")
    .eq("user_id", userId)
    .eq("program_id", programId)
    .maybeSingle();

  if (!existing) {
    const { error } = await supabase.from("program_runs").insert({
      user_id: userId,
      program_id: programId,
      track_id: trackId,
    });
    if (error) throw new Error(error.message);
  }

  const progress = await loadProgramProgress(supabase, userId, programId, profile, programFormat);
  if (!progress) throw new Error("Could not load program progress.");
  return progress;
}

export async function cancelProgramRun(
  supabase: SupabaseClient,
  userId: string,
  programId: string
): Promise<{ ok: true } | { error: string }> {
  const hasAccess = await userHasProgramAccess(supabase, userId, programId);
  if (!hasAccess) {
    return { error: "You do not have access to this program." };
  }

  const { data: run } = await supabase
    .from("program_runs")
    .select("id")
    .eq("user_id", userId)
    .eq("program_id", programId)
    .maybeSingle();

  if (!run) {
    return { error: "This program is not active." };
  }

  const { error: completionsErr } = await supabase
    .from("program_session_completions")
    .delete()
    .eq("user_id", userId)
    .eq("program_id", programId);

  if (completionsErr) {
    return { error: completionsErr.message };
  }

  const { error: runErr } = await supabase
    .from("program_runs")
    .delete()
    .eq("user_id", userId)
    .eq("program_id", programId);

  if (runErr) {
    return { error: runErr.message };
  }

  return { ok: true };
}

export async function startProgramSession(
  supabase: SupabaseClient,
  userId: string,
  programId: string,
  sessionId: string
): Promise<{ ok: true } | { error: string }> {
  const hasAccess = await userHasProgramAccess(supabase, userId, programId);
  if (!hasAccess) {
    return { error: "You do not have access to this program." };
  }

  const { data: session, error: sessionErr } = await supabase
    .from("program_sessions")
    .select("id, program_location_tracks!inner ( program_id )")
    .eq("id", sessionId)
    .maybeSingle();

  if (sessionErr || !session) {
    return { error: "Training day not found." };
  }

  const track = session.program_location_tracks as { program_id: string } | { program_id: string }[];
  const trackRow = Array.isArray(track) ? track[0] : track;
  if (trackRow?.program_id !== programId) {
    return { error: "Training day does not belong to this program." };
  }

  const now = new Date().toISOString();
  const { data: existing } = await supabase
    .from("program_session_completions")
    .select("id, started_at, completed_at")
    .eq("user_id", userId)
    .eq("session_id", sessionId)
    .maybeSingle();

  if (existing) {
    const { error: updateErr } = await supabase
      .from("program_session_completions")
      .update({ started_at: now })
      .eq("id", existing.id);
    if (updateErr) return { error: updateErr.message };
  } else {
    const { error: insertErr } = await supabase.from("program_session_completions").insert({
      user_id: userId,
      program_id: programId,
      session_id: sessionId,
      started_at: now,
    });
    if (insertErr) return { error: insertErr.message };
  }

  return { ok: true };
}

export async function completeProgramSession(
  supabase: SupabaseClient,
  userId: string,
  programId: string,
  sessionId: string,
  programFormat: ProgramFormat = "training_plan"
): Promise<{ ok: true } | { error: string }> {
  const hasAccess = await userHasProgramAccess(supabase, userId, programId);
  if (!hasAccess) {
    return { error: "You do not have access to this program." };
  }

  const { data: session, error: sessionErr } = await supabase
    .from("program_sessions")
    .select("id, program_location_tracks!inner ( program_id )")
    .eq("id", sessionId)
    .maybeSingle();

  if (sessionErr || !session) {
    return { error: "Training day not found." };
  }

  const track = session.program_location_tracks as { program_id: string } | { program_id: string }[];
  const trackRow = Array.isArray(track) ? track[0] : track;
  if (trackRow?.program_id !== programId) {
    return { error: "Training day does not belong to this program." };
  }

  const { error: insErr } = await supabase.from("program_session_completions").upsert(
    {
      user_id: userId,
      program_id: programId,
      session_id: sessionId,
      completed_at: new Date().toISOString(),
    },
    { onConflict: "user_id,session_id" }
  );

  if (insErr) {
    return { error: insErr.message };
  }

  if (usesProgramProgress(programFormat)) {
    await supabase
      .from("program_runs")
      .update({ updated_at: new Date().toISOString() })
      .eq("user_id", userId)
      .eq("program_id", programId);
  }

  return { ok: true };
}

export function playHrefForSession(programSlug: string, sessionId: string): string {
  return `/programs/${programSlug}/play?session=${encodeURIComponent(sessionId)}`;
}

export type ActiveWeekProgress = {
  completedInWeek: number;
  totalInWeek: number;
  weekNumber: number;
  weekName: string;
};

/** Progress for the week the member is currently working through. */
export function getActiveWeekProgress(progress: ProgramProgressView): ActiveWeekProgress | null {
  if (progress.weeks.length === 0) return null;

  let activeWeek = progress.weeks[0]!;

  if (progress.nextSession) {
    const weekWithNext = progress.weeks.find((w) =>
      w.sessions.some((s) => s.id === progress.nextSession!.id)
    );
    if (weekWithNext) activeWeek = weekWithNext;
  } else {
    const weekWithIncomplete = progress.weeks.find((w) =>
      w.sessions.some((s) => !s.completedAt)
    );
    if (weekWithIncomplete) {
      activeWeek = weekWithIncomplete;
    } else {
      activeWeek = progress.weeks[progress.weeks.length - 1]!;
    }
  }

  const totalInWeek = activeWeek.sessions.length;
  if (totalInWeek === 0) return null;

  return {
    completedInWeek: activeWeek.sessions.filter((s) => s.completedAt).length,
    totalInWeek,
    weekNumber: activeWeek.weekNumber,
    weekName: activeWeek.name,
  };
}

export function formatTrainingTimestamp(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatTrainingDuration(startedAt: string, completedAt: string): string | null {
  const ms = new Date(completedAt).getTime() - new Date(startedAt).getTime();
  if (!Number.isFinite(ms) || ms <= 0) return null;
  const totalMinutes = Math.round(ms / 60_000);
  if (totalMinutes < 60) return `${totalMinutes} min`;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
}

export type ProgramTrainingLogEntry = {
  sessionId: string;
  label: string;
  weekName: string | null;
  startedAt: string | null;
  completedAt: string | null;
};

export function buildProgramTrainingLog(progress: ProgramProgressView): ProgramTrainingLogEntry[] {
  return progress.sessions
    .map((session, index) => {
      const week =
        progress.weeks.find((w) => w.sessions.some((s) => s.id === session.id)) ?? null;
      return {
        sessionId: session.id,
        label: sessionDisplayLabel(session, index),
        weekName: week?.name ?? null,
        startedAt: session.startedAt,
        completedAt: session.completedAt,
      };
    })
    .filter((entry) => entry.startedAt || entry.completedAt)
    .sort((a, b) => {
      const aTime = new Date(a.completedAt ?? a.startedAt ?? 0).getTime();
      const bTime = new Date(b.completedAt ?? b.startedAt ?? 0).getTime();
      return bTime - aTime;
    });
}

export function formatActiveWeekProgressLabel(progress: ProgramProgressView): string | null {
  const weekProgress = getActiveWeekProgress(progress);
  if (!weekProgress) return null;
  return `${weekProgress.completedInWeek}/${weekProgress.totalInWeek} · ${weekProgress.weekName}`;
}

export type ActiveProgramSummary = {
  programId: string;
  slug: string;
  title: string;
  coverImageUrl: string | null;
  completedCount: number;
  totalSessions: number;
  nextSessionName: string | null;
  nextSessionHref: string | null;
  trainingHref: string;
  isComplete: boolean;
  startedAt: string | null;
};

export type QuickWorkoutSummary = {
  programId: string;
  slug: string;
  title: string;
  coverImageUrl: string | null;
  minutesPerSession: number | null;
  playHref: string;
};

export async function loadUserActivePrograms(
  supabase: SupabaseClient,
  userId: string,
  profile?: ProfileEnv | null
): Promise<ActiveProgramSummary[]> {
  const { data: runs, error } = await supabase
    .from("program_runs")
    .select(
      `
      started_at,
      updated_at,
      programs (
        id,
        slug,
        title,
        cover_image_url,
        status,
        program_format
      )
    `
    )
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error || !runs?.length) return [];

  const summaries: ActiveProgramSummary[] = [];

  for (const run of runs) {
    const progRaw = run.programs;
    const prog = Array.isArray(progRaw) ? progRaw[0] : progRaw;
    if (!prog || typeof prog.slug !== "string" || prog.status !== "published") continue;
    if (prog.program_format === "single_workout") continue;

    const progress = await loadProgramProgress(
      supabase,
      userId,
      prog.id,
      profile,
      "training_plan"
    );
    if (!progress || progress.totalSessions === 0) continue;

    const next = progress.nextSession;
    summaries.push({
      programId: prog.id,
      slug: prog.slug,
      title: prog.title,
      coverImageUrl: prog.cover_image_url?.trim() || null,
      completedCount: progress.completedCount,
      totalSessions: progress.totalSessions,
      nextSessionName: next?.name ?? null,
      nextSessionHref: next ? playHrefForSession(prog.slug, next.id) : null,
      trainingHref: programTrainingHref(prog.slug),
      isComplete: progress.isComplete,
      startedAt: (run.started_at as string | undefined) ?? null,
    });
  }

  return summaries;
}

export async function loadQuickWorkouts(
  supabase: SupabaseClient,
  limit = 6
): Promise<QuickWorkoutSummary[]> {
  const { data, error } = await supabase
    .from("programs")
    .select("id, slug, title, cover_image_url, minutes_per_session")
    .eq("status", "published")
    .eq("program_format", "single_workout")
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (error || !data?.length) return [];

  const out: QuickWorkoutSummary[] = [];
  for (const p of data) {
    const { sessions } = await fetchProgramSessionsForProgram(supabase, p.id);
    const session = sessions[0];
    if (!session) continue;
    out.push({
      programId: p.id,
      slug: p.slug,
      title: p.title,
      coverImageUrl: p.cover_image_url?.trim() || null,
      minutesPerSession: p.minutes_per_session,
      playHref: playHrefForSession(p.slug, session.id),
    });
  }
  return out;
}
