import type { SupabaseClient } from "@supabase/supabase-js";
import { getIsAdminUser } from "@/utils/supabase/is-admin";
import { parseProgramFormat, usesProgramProgress, type ProgramFormat } from "@/lib/programs/program-format";
import { userHasProgramAccess } from "@/lib/programs/check-program-access";
import {
  fetchProgramSessionsForProgram,
  fetchProgramSessionsForTrack,
  type ProgramSessionRow,
  type ProgramWeekRow,
} from "@/lib/programs/program-sessions";
import { programCatalogHref, programDayHref, programTrainingHref } from "@/lib/programs/program-routes";
import { sessionDisplayLabel } from "@/lib/programs/program-sessions";

export type SessionWithCompletion = ProgramSessionRow & {
  startedAt: string | null;
  completedAt: string | null;
  /** 0-based playback step to resume; meaningful while in progress. */
  resumeStepIndex: number;
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
  resume_step_index: number | null;
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
    const resumeRaw = row?.resume_step_index;
    const resumeStepIndex =
      typeof resumeRaw === "number" && Number.isFinite(resumeRaw) && resumeRaw > 0
        ? Math.floor(resumeRaw)
        : 0;
    return {
      ...s,
      startedAt: row?.started_at ?? null,
      completedAt: row?.completed_at ?? null,
      resumeStepIndex,
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
          .select("session_id, started_at, completed_at, resume_step_index")
          .eq("user_id", userId)
          .eq("program_id", programId),
      ]);
      run = runRow;
      completions = (completionRows ?? []) as SessionCompletionRow[];
    } else {
      const { data: completionRows } = await supabase
        .from("program_session_completions")
        .select("session_id, started_at, completed_at, resume_step_index")
        .eq("user_id", userId)
        .eq("program_id", programId);
      completions = (completionRows ?? []) as SessionCompletionRow[];
    }
  }

  const { trackId, sessions, weeks } = run
    ? await fetchProgramSessionsForTrack(supabase, run.track_id)
    : await fetchProgramSessionsForProgram(supabase, programId, profile);

  if (sessions.length === 0) {
    if (run) {
      return {
        runId: run.id,
        trackId: run.track_id,
        startedAt: run.started_at,
        sessions: [],
        weeks: [],
        completedCount: 0,
        totalSessions: 0,
        nextSession: null,
        isComplete: false,
      };
    }
    return null;
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

/** Create a run for a known track without loading every session. */
export async function ensureProgramRunForTrack(
  supabase: SupabaseClient,
  userId: string,
  programId: string,
  trackId: string
): Promise<void> {
  const { data: existing } = await supabase
    .from("program_runs")
    .select("id")
    .eq("user_id", userId)
    .eq("program_id", programId)
    .maybeSingle();

  if (existing) return;

  const { error } = await supabase.from("program_runs").insert({
    user_id: userId,
    program_id: programId,
    track_id: trackId,
  });
  if (error && error.code !== "23505") {
    throw new Error(error.message);
  }
}

export type PlaySessionNav = {
  sessionIndex: number;
  resumeStepIndex: number | null;
  nextSession: { id: string; name: string | null } | null;
  programComplete: boolean;
};

/** Neighbor session + resume without nested exercise payloads. */
export async function loadPlaySessionNav(
  supabase: SupabaseClient,
  userId: string,
  programId: string,
  trackId: string,
  sessionId: string,
  tracksProgress: boolean
): Promise<PlaySessionNav> {
  if (!tracksProgress) {
    return {
      sessionIndex: 0,
      resumeStepIndex: null,
      nextSession: null,
      programComplete: false,
    };
  }

  const [{ data: sessionRows }, { data: completionRows }] = await Promise.all([
    supabase
      .from("program_sessions")
      .select("id, name, sort_order")
      .eq("track_id", trackId)
      .order("sort_order", { ascending: true }),
    supabase
      .from("program_session_completions")
      .select("session_id, started_at, completed_at, resume_step_index")
      .eq("user_id", userId)
      .eq("program_id", programId),
  ]);

  const sessions = (sessionRows ?? []) as { id: string; name: string | null; sort_order: number }[];
  const completions = (completionRows ?? []) as SessionCompletionRow[];
  const bySession = new Map(completions.map((c) => [c.session_id, c]));
  const sessionIndex = sessions.findIndex((s) => s.id === sessionId);
  const current = bySession.get(sessionId);
  const resumeRaw = current?.resume_step_index;
  const resumeStepIndex =
    current?.started_at &&
    !current.completed_at &&
    typeof resumeRaw === "number" &&
    Number.isFinite(resumeRaw) &&
    resumeRaw > 0
      ? Math.floor(resumeRaw)
      : null;

  const nextSession =
    sessionIndex >= 0
      ? sessions.slice(sessionIndex + 1).find((s) => !bySession.get(s.id)?.completed_at) ?? null
      : null;

  const incompleteOther = sessions.filter(
    (s) => s.id !== sessionId && !bySession.get(s.id)?.completed_at
  ).length;
  const currentAlreadyComplete = Boolean(current?.completed_at);

  return {
    sessionIndex: sessionIndex >= 0 ? sessionIndex : 0,
    resumeStepIndex,
    nextSession: nextSession ? { id: nextSession.id, name: nextSession.name } : null,
    programComplete: tracksProgress && incompleteOther === 0 && !currentAlreadyComplete && sessions.length > 0,
  };
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
    // A new attempt, including after a previous finish. Clear the old completion
    // so progress can save and the workout starts from the first exercise.
    let update = supabase
      .from("program_session_completions")
      .update({
        started_at: now,
        completed_at: null,
        resume_step_index: 0,
      })
      .eq("id", existing.id);
    // Don't wipe a completion that landed after this attempt started.
    if (existing.completed_at) {
      update = update.eq("completed_at", existing.completed_at);
    }
    const { error: updateErr } = await update;
    if (updateErr) return { error: updateErr.message };
  } else {
    const { error: insertErr } = await supabase.from("program_session_completions").insert({
      user_id: userId,
      program_id: programId,
      session_id: sessionId,
      started_at: now,
      completed_at: null,
    });
    if (insertErr) return { error: insertErr.message };
  }

  return { ok: true };
}

/** Save mid-workout playback step so Continue can resume at the same exercise. */
export async function saveProgramSessionProgress(
  supabase: SupabaseClient,
  userId: string,
  programId: string,
  sessionId: string,
  stepIndex: number
): Promise<{ ok: true } | { error: string }> {
  const hasAccess = await userHasProgramAccess(supabase, userId, programId);
  if (!hasAccess) {
    return { error: "You do not have access to this program." };
  }

  const index = Number.isFinite(stepIndex) ? Math.max(0, Math.floor(stepIndex)) : 0;

  const { data: existing } = await supabase
    .from("program_session_completions")
    .select("id, completed_at")
    .eq("user_id", userId)
    .eq("session_id", sessionId)
    .maybeSingle();

  if (existing?.completed_at) {
    return { ok: true };
  }

  if (existing?.id) {
    const { error } = await supabase
      .from("program_session_completions")
      .update({ resume_step_index: index })
      .eq("id", existing.id);
    if (error) return { error: error.message };
    return { ok: true };
  }

  const { error } = await supabase.from("program_session_completions").insert({
    user_id: userId,
    program_id: programId,
    session_id: sessionId,
    started_at: new Date().toISOString(),
    completed_at: null,
    resume_step_index: index,
  });
  if (error) return { error: error.message };
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
      resume_step_index: 0,
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
  /** True when the next day was started but not finished (all exercises). */
  nextSessionInProgress: boolean;
  trainingHref: string;
  isComplete: boolean;
  startedAt: string | null;
  programFormat: ProgramFormat;
  /** True when this member created the program with the AI coach. */
  generated: boolean;
  /** False for a generated program that has not been started yet. */
  started: boolean;
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
  const isAdmin = await getIsAdminUser(supabase, userId);
  const { data: runs, error } = await supabase
    .from("program_runs")
    .select(
      `
      program_id,
      track_id,
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

  const ready: {
    run: (typeof runs)[number];
    prog: {
      id: string;
      slug: string;
      title: string;
      cover_image_url: string | null;
      status: string;
      program_format: string | null;
    };
  }[] = [];

  for (const run of runs) {
    let progRaw = run.programs;
    let prog: {
      id: string;
      slug: string;
      title: string;
      cover_image_url: string | null;
      status: string;
      program_format: string | null;
    } | null = Array.isArray(progRaw) ? progRaw[0] ?? null : progRaw ?? null;

    if (!prog?.slug) {
      const { data: progRow } = await supabase
        .from("programs")
        .select("id, slug, title, cover_image_url, status, program_format")
        .eq("id", run.program_id as string)
        .maybeSingle();
      prog = progRow;
    }

    if (!prog || typeof prog.slug !== "string") continue;
    if (prog.status !== "published" && !(isAdmin && prog.status === "draft")) continue;
    if (prog.program_format === "single_workout") continue;

    ready.push({ run, prog });
  }

  const loaded = await Promise.all(
    ready.map(async ({ run, prog }) => {
    const progress = await loadProgramProgress(
      supabase,
      userId,
      prog.id,
      profile,
      "training_plan"
    );
    if (!progress?.runId) return null;

    const next = progress.nextSession;
    const nextWithProgress = next
      ? progress.sessions.find((s) => s.id === next.id) ?? null
      : null;
    const nextSessionInProgress = Boolean(
      nextWithProgress?.startedAt && !nextWithProgress.completedAt
    );
    return {
      programId: prog.id,
      slug: prog.slug,
      title:
        isAdmin && prog.status === "draft" ? `${prog.title} (Draft)` : prog.title,
      coverImageUrl: prog.cover_image_url?.trim() || null,
      completedCount: progress.completedCount,
      totalSessions: progress.totalSessions,
      nextSessionName: next?.name ?? null,
      nextSessionHref: next ? programDayHref(prog.slug, next.id) : null,
      nextSessionInProgress,
      trainingHref: programTrainingHref(prog.slug),
      isComplete: progress.isComplete,
      startedAt: (run.started_at as string | undefined) ?? progress.startedAt,
      programFormat: parseProgramFormat(prog.program_format),
      generated: false,
      started: true,
    };
    })
  );

  return loaded.filter((row): row is ActiveProgramSummary => row != null);
}

type GeneratedProgramRow = {
  id: string;
  slug: string;
  title: string;
  cover_image_url: string | null;
  status: string;
  program_format: string | null;
  created_at: string | null;
};

/** Started programs, plus AI programs this member created even if they never started them. */
export async function loadMemberPrograms(
  supabase: SupabaseClient,
  userId: string,
  profile?: ProfileEnv | null
): Promise<ActiveProgramSummary[]> {
  const [started, generatedRes] = await Promise.all([
    loadUserActivePrograms(supabase, userId, profile),
    supabase
      .from("programs")
      .select("id, slug, title, cover_image_url, status, program_format, created_at")
      .eq("created_by_user_id", userId)
      .order("created_at", { ascending: false }),
  ]);

  const generated = ((generatedRes.data ?? []) as GeneratedProgramRow[]).filter(
    (row) => row.status === "published" || row.status === "draft"
  );
  const generatedIds = new Set(generated.map((row) => row.id));
  const startedIds = new Set(started.map((row) => row.programId));
  const markedStarted = started.map((row) =>
    generatedIds.has(row.programId) ? { ...row, generated: true } : row
  );

  const unstarted = generated.filter((row) => !startedIds.has(row.id) && row.slug);
  const playByProgram = await firstPlaySessionByProgram(
    supabase,
    unstarted.filter((row) => parseProgramFormat(row.program_format) === "single_workout").map((row) => row.id)
  );

  const generatedCards: ActiveProgramSummary[] = unstarted.map((row) => {
    const format = parseProgramFormat(row.program_format);
    const sessionId = playByProgram.get(row.id);
    const href =
      format === "single_workout" && sessionId
        ? playHrefForSession(row.slug, sessionId)
        : programCatalogHref(row.slug);
    return {
      programId: row.id,
      slug: row.slug,
      title: row.title,
      coverImageUrl: row.cover_image_url?.trim() || null,
      completedCount: 0,
      totalSessions: 0,
      nextSessionName: null,
      nextSessionHref: href,
      nextSessionInProgress: false,
      trainingHref: href,
      isComplete: false,
      startedAt: null,
      programFormat: format,
      generated: true,
      started: false,
    };
  });

  return [...generatedCards, ...markedStarted];
}

async function firstPlaySessionByProgram(
  supabase: SupabaseClient,
  programIds: string[]
): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  if (programIds.length === 0) return out;

  const { data } = await supabase
    .from("program_location_tracks")
    .select("program_id, sort_order, program_sessions ( id, sort_order )")
    .in("program_id", programIds)
    .order("sort_order", { ascending: true });

  type SessionNest = { id: string; sort_order: number };
  for (const track of data ?? []) {
    const programId = track.program_id as string;
    if (out.has(programId)) continue;
    const raw = track.program_sessions as SessionNest | SessionNest[] | null;
    const sessions = Array.isArray(raw) ? raw : raw ? [raw] : [];
    sessions.sort((a, b) => a.sort_order - b.sort_order);
    const first = sessions[0];
    if (first?.id) out.set(programId, first.id);
  }
  return out;
}

export async function loadQuickWorkouts(
  supabase: SupabaseClient,
  limit = 6
): Promise<QuickWorkoutSummary[]> {
  const { data, error } = await supabase
    .from("programs")
    .select(`
      id,
      slug,
      title,
      cover_image_url,
      minutes_per_session,
      program_location_tracks (
        sort_order,
        program_sessions ( id, sort_order )
      )
    `)
    .eq("status", "published")
    .eq("program_format", "single_workout")
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (error || !data?.length) return [];

  const out: QuickWorkoutSummary[] = [];
  for (const p of data) {
    const tracksRaw = p.program_location_tracks as
      | { sort_order: number; program_sessions: { id: string; sort_order: number } | { id: string; sort_order: number }[] | null }
      | { sort_order: number; program_sessions: { id: string; sort_order: number } | { id: string; sort_order: number }[] | null }[]
      | null;
    const tracks = Array.isArray(tracksRaw) ? tracksRaw : tracksRaw ? [tracksRaw] : [];
    tracks.sort((a, b) => a.sort_order - b.sort_order);
    const sessionsRaw = tracks[0]?.program_sessions;
    const sessions = Array.isArray(sessionsRaw) ? sessionsRaw : sessionsRaw ? [sessionsRaw] : [];
    sessions.sort((a, b) => a.sort_order - b.sort_order);
    const session = sessions[0];
    if (!session?.id || !p.slug) continue;
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
