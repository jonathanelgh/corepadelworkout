import type { SupabaseClient } from "@supabase/supabase-js";

export type AdminDashboardStat = {
  title: string;
  value: string;
  hint: string | null;
};

export type AdminRecentSignup = {
  id: string;
  name: string;
  email: string;
  plan: string;
  joinedLabel: string;
  status: "Active" | "Lead" | "Cancelled";
};

export type AdminDashboardData = {
  stats: AdminDashboardStat[];
  recentSignups: AdminRecentSignup[];
  loadError: string | null;
};

type SubRow = {
  user_id: string;
  status: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  subscription_plans:
    | { name: string; grants_all_programs: boolean; price_amount: number | null }
    | { name: string; grants_all_programs: boolean; price_amount: number | null }[]
    | null;
};

function planFromSub(row: SubRow) {
  const raw = row.subscription_plans;
  return Array.isArray(raw) ? raw[0] : raw;
}

function isActiveProSub(row: SubRow, nowMs: number): boolean {
  const plan = planFromSub(row);
  if (!plan?.grants_all_programs) return false;
  if (row.status !== "active" && row.status !== "trialing") return false;
  const endMs = new Date(row.current_period_end).getTime();
  return Number.isFinite(endMs) && endMs > nowMs;
}

function bestSubscriptionByUser(rows: SubRow[]): Map<string, { label: string; status: string }> {
  const now = Date.now();
  const best = new Map<string, { endMs: number; label: string; status: string }>();
  for (const r of rows) {
    const plan = planFromSub(r);
    const planName = plan?.name?.trim() || "Subscription";
    const grantsAll = Boolean(plan?.grants_all_programs);
    const label = grantsAll ? `Pro (${planName})` : planName;
    const endMs = new Date(r.current_period_end).getTime();
    const prev = best.get(r.user_id);
    if (!prev || (Number.isFinite(endMs) && endMs > prev.endMs)) {
      best.set(r.user_id, { endMs, label, status: r.status });
    }
  }
  const out = new Map<string, { label: string; status: string }>();
  for (const [uid, v] of best) {
    out.set(uid, { label: v.label, status: v.status });
  }
  return out;
}

function accessLabel(
  userId: string,
  subByUser: Map<string, { label: string; status: string }>,
  enrollmentCount: number
): string {
  const sub = subByUser.get(userId);
  if (sub) return sub.label;
  if (enrollmentCount > 0) {
    return `${enrollmentCount} program${enrollmentCount === 1 ? "" : "s"}`;
  }
  return "Free";
}

function memberStatus(
  userId: string,
  subByUser: Map<string, { label: string; status: string }>,
  onboardingCompletedAt: string | null
): AdminRecentSignup["status"] {
  const sub = subByUser.get(userId);
  if (sub?.status === "canceled") return "Cancelled";
  if (sub && (sub.status === "active" || sub.status === "trialing")) return "Active";
  if (onboardingCompletedAt) return "Active";
  return "Lead";
}

function formatRelativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return "—";
  const diffSec = Math.round((then - Date.now()) / 1000);
  const abs = Math.abs(diffSec);
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  if (abs < 60) return rtf.format(diffSec, "second");
  const diffMin = Math.round(diffSec / 60);
  if (Math.abs(diffMin) < 60) return rtf.format(diffMin, "minute");
  const diffHr = Math.round(diffMin / 60);
  if (Math.abs(diffHr) < 48) return rtf.format(diffHr, "hour");
  const diffDay = Math.round(diffHr / 24);
  if (Math.abs(diffDay) < 30) return rtf.format(diffDay, "day");
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function formatCount(n: number): string {
  return n.toLocaleString("en-GB");
}

function formatCurrency(amount: number, currency = "EUR"): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

function monthBounds(offsetMonths: number): { start: Date; end: Date } {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + offsetMonths, 1));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + offsetMonths + 1, 1));
  return { start, end };
}

export async function loadAdminDashboardData(
  supabase: SupabaseClient
): Promise<AdminDashboardData> {
  const [
    profilesRes,
    subsRes,
    enrollRes,
    programsRes,
    runsRes,
    completionsRes,
  ] = await Promise.all([
    supabase.from("profiles").select("id, full_name, email, created_at, onboarding_completed_at").order("created_at", { ascending: false }),
    supabase.from("customer_subscriptions").select(`
        user_id,
        status,
        current_period_end,
        cancel_at_period_end,
        subscription_plans ( name, grants_all_programs, price_amount )
      `),
    supabase.from("program_enrollments").select("user_id").eq("status", "active"),
    supabase.from("programs").select("id", { count: "exact", head: true }).eq("status", "published"),
    supabase.from("program_runs").select("id", { count: "exact", head: true }),
    supabase
      .from("program_session_completions")
      .select("id", { count: "exact", head: true })
      .gte("completed_at", monthBounds(0).start.toISOString()),
  ]);

  const errors = [
    profilesRes.error,
    subsRes.error,
    enrollRes.error,
    programsRes.error,
    runsRes.error,
    completionsRes.error,
  ]
    .filter(Boolean)
    .map((e) => e!.message);

  const profiles = profilesRes.data ?? [];
  const subs = (subsRes.data ?? []) as SubRow[];
  const nowMs = Date.now();

  const enrollCountByUser = new Map<string, number>();
  for (const row of enrollRes.data ?? []) {
    const uid = row.user_id as string;
    enrollCountByUser.set(uid, (enrollCountByUser.get(uid) ?? 0) + 1);
  }

  const subByUser = bestSubscriptionByUser(subs);
  const activeProCount = new Set(
    subs.filter((s) => isActiveProSub(s, nowMs)).map((s) => s.user_id)
  ).size;

  let mrr = 0;
  for (const s of subs) {
    if (!isActiveProSub(s, nowMs)) continue;
    const plan = planFromSub(s);
    const amount = plan?.price_amount;
    if (amount != null && Number.isFinite(Number(amount))) {
      mrr += Number(amount);
    }
  }

  const thisMonth = monthBounds(0);
  const lastMonth = monthBounds(-1);
  const signupsThisMonth = profiles.filter((p) => {
    const t = new Date(p.created_at as string).getTime();
    return t >= thisMonth.start.getTime() && t < thisMonth.end.getTime();
  }).length;
  const signupsLastMonth = profiles.filter((p) => {
    const t = new Date(p.created_at as string).getTime();
    return t >= lastMonth.start.getTime() && t < lastMonth.end.getTime();
  }).length;

  let signupHint: string | null = null;
  if (signupsLastMonth > 0) {
    const pct = Math.round(((signupsThisMonth - signupsLastMonth) / signupsLastMonth) * 100);
    signupHint = `${pct >= 0 ? "+" : ""}${pct}% vs last month`;
  } else if (signupsThisMonth > 0) {
    signupHint = `${signupsThisMonth} new this month`;
  }

  const pendingCancel = subs.filter(
    (s) => s.cancel_at_period_end && isActiveProSub(s, nowMs)
  ).length;

  const stats: AdminDashboardStat[] = [
    {
      title: "Total members",
      value: formatCount(profiles.length),
      hint: signupHint,
    },
    {
      title: "Active Pro",
      value: formatCount(activeProCount),
      hint: pendingCancel > 0 ? `${pendingCancel} cancel at period end` : null,
    },
    {
      title: "Est. monthly revenue",
      value: mrr > 0 ? formatCurrency(mrr) : "—",
      hint: mrr > 0 ? "From active Pro subscriptions" : "Set plan prices in Stripe sync",
    },
    {
      title: "Training activity",
      value: formatCount(runsRes.count ?? 0),
      hint:
        (completionsRes.count ?? 0) > 0
          ? `${completionsRes.count} day${completionsRes.count === 1 ? "" : "s"} completed this month`
          : `${programsRes.count ?? 0} published programs`,
    },
  ];

  const recentSignups: AdminRecentSignup[] = profiles.slice(0, 8).map((p) => {
    const id = p.id as string;
    const name = (p.full_name as string | null)?.trim() || "—";
    const email = (p.email as string | null)?.trim() || "—";
    return {
      id,
      name,
      email,
      plan: accessLabel(id, subByUser, enrollCountByUser.get(id) ?? 0),
      joinedLabel: formatRelativeTime(p.created_at as string),
      status: memberStatus(id, subByUser, (p.onboarding_completed_at as string | null) ?? null),
    };
  });

  return {
    stats,
    recentSignups,
    loadError: errors.length > 0 ? errors.join(" · ") : null,
  };
}
