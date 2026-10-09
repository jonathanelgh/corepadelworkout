import type { SupabaseClient } from "@supabase/supabase-js";

export type AnalyticsKpi = {
  title: string;
  value: string;
  hint: string | null;
};

export type AnalyticsProgramRow = {
  programId: string;
  title: string;
  slug: string;
  format: string;
  status: string;
  runners: number;
  enrollments: number;
  workoutsCompleted: number;
  workoutsStarted: number;
  uniqueCompleters: number;
};

export type AnalyticsDayBucket = {
  dateKey: string;
  label: string;
  completed: number;
  started: number;
};

export type AnalyticsMemberRow = {
  userId: string;
  name: string;
  email: string;
  completed: number;
  started: number;
  lastActiveAt: string | null;
};

export type AdminAnalyticsData = {
  kpis: AnalyticsKpi[];
  programs: AnalyticsProgramRow[];
  activityByDay: AnalyticsDayBucket[];
  topMembersThisMonth: AnalyticsMemberRow[];
  recentCompletions: {
    userName: string;
    userEmail: string;
    programTitle: string;
    sessionName: string;
    completedAt: string;
  }[];
  loadError: string | null;
};

type ProgramRel = {
  id: string;
  title: string;
  slug: string;
  status: string | null;
  program_format: string | null;
};

type SessionRel = {
  name: string | null;
  sort_order: number | null;
};

type CompletionRow = {
  user_id: string;
  program_id: string;
  session_id: string;
  started_at: string | null;
  completed_at: string | null;
  programs: ProgramRel | ProgramRel[] | null;
  program_sessions: SessionRel | SessionRel[] | null;
};

type RunRow = {
  user_id: string;
  program_id: string;
  started_at: string;
  updated_at: string;
  programs: ProgramRel | ProgramRel[] | null;
};

type EnrollmentRow = {
  user_id: string;
  program_id: string;
  programs: ProgramRel | ProgramRel[] | null;
};

type ProfileRow = {
  id: string;
  full_name: string | null;
  email: string | null;
};

function firstRel<T>(x: T | T[] | null | undefined): T | null {
  if (x == null) return null;
  return Array.isArray(x) ? x[0] ?? null : x;
}

function formatCount(n: number): string {
  return n.toLocaleString("en-GB");
}

function startOfUtcDay(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function addUtcDays(d: Date, days: number): Date {
  const next = new Date(d);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function dateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function monthStartUtc(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

function weekStartUtc(): Date {
  const today = startOfUtcDay(new Date());
  // Monday-based week
  const day = today.getUTCDay();
  const offset = day === 0 ? -6 : 1 - day;
  return addUtcDays(today, offset);
}

function formatDayLabel(key: string): string {
  const d = new Date(`${key}T12:00:00.000Z`);
  return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
}

export async function loadAdminAnalyticsData(
  supabase: SupabaseClient
): Promise<AdminAnalyticsData> {
  const activityWindowStart = addUtcDays(startOfUtcDay(new Date()), -27);
  const monthStart = monthStartUtc();
  const weekStart = weekStartUtc();

  const [runsRes, completionsRes, enrollRes, profilesRes] = await Promise.all([
    supabase.from("program_runs").select(`
        user_id,
        program_id,
        started_at,
        updated_at,
        programs ( id, title, slug, status, program_format )
      `),
    supabase.from("program_session_completions").select(`
        user_id,
        program_id,
        session_id,
        started_at,
        completed_at,
        programs ( id, title, slug, status, program_format ),
        program_sessions ( name, sort_order )
      `),
    supabase
      .from("program_enrollments")
      .select(
        `
        user_id,
        program_id,
        programs ( id, title, slug, status, program_format )
      `
      )
      .eq("status", "active"),
    supabase.from("profiles").select("id, full_name, email"),
  ]);

  const errors = [
    runsRes.error,
    completionsRes.error,
    enrollRes.error,
    profilesRes.error,
  ]
    .filter(Boolean)
    .map((e) => e!.message);

  const runs = (runsRes.data ?? []) as RunRow[];
  const allCompletions = (completionsRes.data ?? []) as CompletionRow[];
  const windowCompletions = allCompletions.filter((c) => {
    const when = c.completed_at ?? c.started_at;
    if (!when) return false;
    return new Date(when).getTime() >= activityWindowStart.getTime();
  });
  const enrollments = (enrollRes.data ?? []) as EnrollmentRow[];
  const profiles = (profilesRes.data ?? []) as ProfileRow[];

  const profileById = new Map(profiles.map((p) => [p.id, p]));

  const uniqueRunners = new Set(runs.map((r) => r.user_id));
  const completedAll = allCompletions.filter((c) => Boolean(c.completed_at));
  const startedOnly = allCompletions.filter((c) => c.started_at && !c.completed_at);

  const completedThisWeek = completedAll.filter((c) => {
    const t = new Date(c.completed_at!).getTime();
    return t >= weekStart.getTime();
  });
  const completedThisMonth = completedAll.filter((c) => {
    const t = new Date(c.completed_at!).getTime();
    return t >= monthStart.getTime();
  });

  const activeTrainerIds = new Set<string>();
  for (const c of allCompletions) {
    const when = c.completed_at ?? c.started_at;
    if (!when) continue;
    if (new Date(when).getTime() >= weekStart.getTime()) {
      activeTrainerIds.add(c.user_id);
    }
  }

  const avgPerRunner =
    uniqueRunners.size > 0
      ? Math.round((completedAll.length / uniqueRunners.size) * 10) / 10
      : 0;

  const kpis: AnalyticsKpi[] = [
    {
      title: "People in programs",
      value: formatCount(uniqueRunners.size),
      hint: `${formatCount(runs.length)} program start${runs.length === 1 ? "" : "s"}`,
    },
    {
      title: "Workouts completed",
      value: formatCount(completedAll.length),
      hint: `${formatCount(completedThisWeek.length)} this week · ${formatCount(completedThisMonth.length)} this month`,
    },
    {
      title: "Active trainers (7d)",
      value: formatCount(activeTrainerIds.size),
      hint:
        startedOnly.length > 0
          ? `${formatCount(startedOnly.length)} workout${startedOnly.length === 1 ? "" : "s"} in progress`
          : "Members who started or finished a day this week",
    },
    {
      title: "Avg completions / runner",
      value: uniqueRunners.size > 0 ? avgPerRunner.toLocaleString("en-GB") : "—",
      hint: `${formatCount(enrollments.length)} active enrollment${enrollments.length === 1 ? "" : "s"}`,
    },
  ];

  // ---- Program breakdown ----
  type Acc = {
    programId: string;
    title: string;
    slug: string;
    format: string;
    status: string;
    runnerIds: Set<string>;
    enrollmentIds: Set<string>;
    completed: number;
    started: number;
    completerIds: Set<string>;
  };

  const byProgram = new Map<string, Acc>();

  function ensureProgram(id: string, prog: ProgramRel | null): Acc {
    let acc = byProgram.get(id);
    if (!acc) {
      acc = {
        programId: id,
        title: prog?.title?.trim() || "Untitled program",
        slug: prog?.slug?.trim() || id,
        format: prog?.program_format?.trim() || "program",
        status: prog?.status?.trim() || "unknown",
        runnerIds: new Set(),
        enrollmentIds: new Set(),
        completed: 0,
        started: 0,
        completerIds: new Set(),
      };
      byProgram.set(id, acc);
    } else if (prog) {
      if (prog.title?.trim()) acc.title = prog.title.trim();
      if (prog.slug?.trim()) acc.slug = prog.slug.trim();
      if (prog.program_format?.trim()) acc.format = prog.program_format.trim();
      if (prog.status?.trim()) acc.status = prog.status.trim();
    }
    return acc;
  }

  for (const row of runs) {
    const prog = firstRel(row.programs);
    const acc = ensureProgram(row.program_id, prog);
    acc.runnerIds.add(row.user_id);
  }

  for (const row of enrollments) {
    const prog = firstRel(row.programs);
    const acc = ensureProgram(row.program_id, prog);
    acc.enrollmentIds.add(row.user_id);
  }

  for (const row of allCompletions) {
    const prog = firstRel(row.programs);
    const acc = ensureProgram(row.program_id, prog);
    if (row.completed_at) {
      acc.completed += 1;
      acc.completerIds.add(row.user_id);
    } else if (row.started_at) {
      acc.started += 1;
    }
  }

  const programs: AnalyticsProgramRow[] = [...byProgram.values()]
    .map((acc) => ({
      programId: acc.programId,
      title: acc.title,
      slug: acc.slug,
      format: acc.format,
      status: acc.status,
      runners: acc.runnerIds.size,
      enrollments: acc.enrollmentIds.size,
      workoutsCompleted: acc.completed,
      workoutsStarted: acc.started,
      uniqueCompleters: acc.completerIds.size,
    }))
    .sort((a, b) => {
      if (b.runners !== a.runners) return b.runners - a.runners;
      return b.workoutsCompleted - a.workoutsCompleted;
    });

  // ---- Daily activity (28 days) ----
  const dayMap = new Map<string, { completed: number; started: number }>();
  for (let i = 0; i < 28; i++) {
    const key = dateKey(addUtcDays(activityWindowStart, i));
    dayMap.set(key, { completed: 0, started: 0 });
  }
  for (const row of windowCompletions) {
    if (row.completed_at) {
      const key = row.completed_at.slice(0, 10);
      const bucket = dayMap.get(key);
      if (bucket) bucket.completed += 1;
    } else if (row.started_at) {
      const key = row.started_at.slice(0, 10);
      const bucket = dayMap.get(key);
      if (bucket) bucket.started += 1;
    }
  }
  const activityByDay: AnalyticsDayBucket[] = [...dayMap.entries()].map(([key, v]) => ({
    dateKey: key,
    label: formatDayLabel(key),
    completed: v.completed,
    started: v.started,
  }));

  // ---- Top members this month ----
  const memberMonth = new Map<
    string,
    { completed: number; started: number; lastActiveAt: string | null }
  >();
  for (const row of allCompletions) {
    const when = row.completed_at ?? row.started_at;
    if (!when || new Date(when).getTime() < monthStart.getTime()) continue;
    const cur = memberMonth.get(row.user_id) ?? {
      completed: 0,
      started: 0,
      lastActiveAt: null as string | null,
    };
    if (row.completed_at) cur.completed += 1;
    else if (row.started_at) cur.started += 1;
    if (!cur.lastActiveAt || when > cur.lastActiveAt) cur.lastActiveAt = when;
    memberMonth.set(row.user_id, cur);
  }

  const topMembersThisMonth: AnalyticsMemberRow[] = [...memberMonth.entries()]
    .map(([userId, stats]) => {
      const p = profileById.get(userId);
      return {
        userId,
        name: p?.full_name?.trim() || "—",
        email: p?.email?.trim() || "—",
        completed: stats.completed,
        started: stats.started,
        lastActiveAt: stats.lastActiveAt,
      };
    })
    .sort((a, b) => {
      if (b.completed !== a.completed) return b.completed - a.completed;
      return b.started - a.started;
    })
    .slice(0, 12);

  // ---- Recent completions ----
  const recentCompletions = completedAll
    .slice()
    .sort((a, b) => {
      const ta = new Date(a.completed_at!).getTime();
      const tb = new Date(b.completed_at!).getTime();
      return tb - ta;
    })
    .slice(0, 15)
    .map((row) => {
      const p = profileById.get(row.user_id);
      const prog = firstRel(row.programs);
      const session = firstRel(row.program_sessions);
      return {
        userName: p?.full_name?.trim() || "—",
        userEmail: p?.email?.trim() || "—",
        programTitle: prog?.title?.trim() || "Program",
        sessionName: session?.name?.trim() || "Session",
        completedAt: row.completed_at!,
      };
    });

  return {
    kpis,
    programs,
    activityByDay,
    topMembersThisMonth,
    recentCompletions,
    loadError: errors.length > 0 ? errors.join(" · ") : null,
  };
}
