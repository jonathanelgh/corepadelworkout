import type { SupabaseClient } from "@supabase/supabase-js";
import { ageFromDateOfBirth, formatDateOfBirth } from "@/lib/member/date-of-birth";
import {
  isOnboardingGoal,
  isPainKey,
  PRIMARY_GOAL_LABELS,
  type OnboardingEnvironment,
  type OnboardingGoal,
  type PainKey,
} from "@/lib/member/onboarding";
import {
  loadMemberSubscriptionStatus,
  type MemberSubscriptionStatus,
} from "@/lib/member/load-subscription-status";
import {
  formatTrainingDuration,
  formatTrainingTimestamp,
  loadUserActivePrograms,
  type ActiveProgramSummary,
} from "@/lib/programs/program-progress";
import { getIsAdminUser } from "@/utils/supabase/is-admin";
import type { ProgramFormat } from "@/lib/programs/program-format";

export type AdminUserEnrollment = {
  programId: string;
  title: string;
  slug: string;
  enrolledAt: string;
};

export type AdminUserWorkoutLogEntry = {
  programId: string;
  programTitle: string;
  programSlug: string;
  programFormat: ProgramFormat;
  sessionLabel: string;
  startedAt: string | null;
  completedAt: string | null;
};

export type AdminUserSubscriptionDetail = MemberSubscriptionStatus & {
  subscriptionId: string | null;
  isStripeManaged: boolean;
};

export type AdminUserDetail = {
  id: string;
  fullName: string | null;
  email: string | null;
  profileImageUrl: string | null;
  createdAt: string;
  onboardingCompletedAt: string | null;
  dateOfBirth: string | null;
  age: number | null;
  gender: string | null;
  padelLevelName: string | null;
  goalLabel: string;
  envLabel: string;
  painsStr: string;
  isAdmin: boolean;
  subscription: AdminUserSubscriptionDetail;
  enrollments: AdminUserEnrollment[];
  activePrograms: ActiveProgramSummary[];
  workoutLog: AdminUserWorkoutLogEntry[];
  stats: {
    programsStarted: number;
    workoutsCompleted: number;
    workoutsInProgress: number;
    lastActivityAt: string | null;
  };
};

type ProfileRow = {
  id: string;
  email: string | null;
  full_name: string | null;
  profile_image_url: string | null;
  created_at: string;
  onboarding_completed_at: string | null;
  date_of_birth: string | null;
  gender: string | null;
  primary_goal: string | null;
  training_environment: string | null;
  training_environments: string[] | null;
  padel_pains: string[] | null;
  padel_levels: { name: string } | { name: string }[] | null;
};

function firstRelName(rel: { name: string } | { name: string }[] | null): string | null {
  if (!rel) return null;
  const row = Array.isArray(rel) ? rel[0] : rel;
  const n = row?.name?.trim();
  return n && n.length > 0 ? n : null;
}

function profileLabels(profile: ProfileRow) {
  const goal: OnboardingGoal | null =
    profile.primary_goal && isOnboardingGoal(profile.primary_goal) ? profile.primary_goal : null;
  const goalLabel = goal ? PRIMARY_GOAL_LABELS[goal] : "—";

  const envOptions = new Set<OnboardingEnvironment>(["gym", "home", "club"]);
  const envName: Record<string, string> = { gym: "Gym", home: "Home", club: "Club" };
  const envLabel =
    profile.training_environments && profile.training_environments.length > 0
      ? profile.training_environments.map((v) => envName[v] ?? v).join(", ")
      : profile.training_environment
        ? (envName[profile.training_environment] ?? profile.training_environment)
        : "—";

  const pains: PainKey[] =
    profile.padel_pains?.filter((p): p is PainKey => isPainKey(p)) ?? [];
  const painLabels: Record<string, string> = {
    padel_elbow: "Padel elbow",
    jumpers_knee: "Jumper's knee",
    lower_back: "Lower back",
    plantar_fasciitis: "Heel / plantar",
    none: "None — general strength",
  };
  const painsStr =
    pains.length > 0 ? pains.map((p) => painLabels[p] ?? p).join(", ") : "—";

  return { goalLabel, envLabel, painsStr };
}

function genderLabel(gender: string | null): string | null {
  if (!gender) return null;
  const map: Record<string, string> = {
    male: "Male",
    female: "Female",
    other: "Other",
    prefer_not_to_say: "Prefer not to say",
  };
  return map[gender] ?? gender;
}

type CompletionRow = {
  started_at: string | null;
  completed_at: string | null;
  program_id: string;
  programs:
    | { id: string; slug: string; title: string; program_format: string | null }
    | { id: string; slug: string; title: string; program_format: string | null }[]
    | null;
  program_sessions:
    | { name: string; sort_order: number }
    | { name: string; sort_order: number }[]
    | null;
};

function buildWorkoutLog(rows: CompletionRow[]): AdminUserWorkoutLogEntry[] {
  const entries: AdminUserWorkoutLogEntry[] = [];

  for (const row of rows) {
    if (!row.started_at && !row.completed_at) continue;
    const progRaw = row.programs;
    const prog = Array.isArray(progRaw) ? progRaw[0] : progRaw;
    if (!prog?.slug || !prog.title) continue;

    const sessRaw = row.program_sessions;
    const sess = Array.isArray(sessRaw) ? sessRaw[0] : sessRaw;
    const sessionLabel = sess?.name?.trim() || `Session ${(sess?.sort_order ?? 0) + 1}`;

    entries.push({
      programId: prog.id,
      programTitle: prog.title,
      programSlug: prog.slug,
      programFormat: (prog.program_format as ProgramFormat) ?? "training_plan",
      sessionLabel,
      startedAt: row.started_at,
      completedAt: row.completed_at,
    });
  }

  return entries.sort((a, b) => {
    const aTime = new Date(a.completedAt ?? a.startedAt ?? 0).getTime();
    const bTime = new Date(b.completedAt ?? b.startedAt ?? 0).getTime();
    return bTime - aTime;
  });
}

export async function loadAdminUserDetail(
  supabase: SupabaseClient,
  userId: string
): Promise<AdminUserDetail | null> {
  const { data: profile, error: profileErr } = await supabase
    .from("profiles")
    .select(
      `
      id,
      email,
      full_name,
      profile_image_url,
      created_at,
      onboarding_completed_at,
      date_of_birth,
      gender,
      primary_goal,
      training_environment,
      training_environments,
      padel_pains,
      padel_levels ( name )
    `
    )
    .eq("id", userId)
    .maybeSingle();

  if (profileErr || !profile) return null;

  const p = profile as ProfileRow;
  const profileEnv = {
    training_environment: p.training_environment,
    training_environments: p.training_environments,
  };
  const { goalLabel, envLabel, painsStr } = profileLabels(p);
  const dateOfBirth = p.date_of_birth ?? null;

  const [subscription, isAdmin, proSubRes, enrollRes, runsRes, completionsRes, activePrograms] =
    await Promise.all([
      loadMemberSubscriptionStatus(supabase, userId),
      getIsAdminUser(supabase, userId),
      supabase
        .from("customer_subscriptions")
        .select(
          "id, status, current_period_end, stripe_subscription_id, subscription_plans!inner ( grants_all_programs )"
        )
        .eq("user_id", userId)
        .order("current_period_end", { ascending: false }),
      supabase
        .from("program_enrollments")
        .select(
          `
          enrolled_at,
          programs ( id, slug, title )
        `
        )
        .eq("user_id", userId)
        .eq("status", "active")
        .order("enrolled_at", { ascending: false }),
      supabase
        .from("program_runs")
        .select("id, updated_at")
        .eq("user_id", userId),
      supabase
        .from("program_session_completions")
        .select(
          `
          started_at,
          completed_at,
          program_id,
          programs ( id, slug, title, program_format ),
          program_sessions ( name, sort_order )
        `
        )
        .eq("user_id", userId),
      loadUserActivePrograms(supabase, userId, profileEnv),
    ]);

  type ProSubRow = {
    id: string;
    status: string;
    current_period_end: string;
    stripe_subscription_id: string | null;
    subscription_plans: { grants_all_programs: boolean } | { grants_all_programs: boolean }[];
  };

  const now = Date.now();
  const proRows = (proSubRes.data ?? []) as ProSubRow[];
  const activeProRow = proRows.find((row) => {
    const planRow = Array.isArray(row.subscription_plans)
      ? row.subscription_plans[0]
      : row.subscription_plans;
    if (!planRow?.grants_all_programs) return false;
    if (row.status !== "active" && row.status !== "trialing") return false;
    return new Date(row.current_period_end).getTime() > now;
  });
  const latestProRow = activeProRow ?? proRows[0] ?? null;

  const subscriptionDetail: AdminUserSubscriptionDetail = {
    ...subscription,
    subscriptionId: latestProRow?.id ?? null,
    isStripeManaged: Boolean(latestProRow?.stripe_subscription_id?.trim()),
  };

  const enrollments: AdminUserEnrollment[] = [];
  for (const row of enrollRes.data ?? []) {
    const progRaw = row.programs;
    const prog = Array.isArray(progRaw) ? progRaw[0] : progRaw;
    if (!prog?.id || !prog.slug || !prog.title) continue;
    enrollments.push({
      programId: prog.id as string,
      title: prog.title as string,
      slug: prog.slug as string,
      enrolledAt: row.enrolled_at as string,
    });
  }

  const workoutLog = buildWorkoutLog((completionsRes.data ?? []) as CompletionRow[]);
  const workoutsCompleted = workoutLog.filter((e) => e.completedAt).length;
  const workoutsInProgress = workoutLog.filter((e) => e.startedAt && !e.completedAt).length;

  const activityTimes: number[] = [];
  for (const entry of workoutLog) {
    const iso = entry.completedAt ?? entry.startedAt;
    if (iso) {
      const t = new Date(iso).getTime();
      if (Number.isFinite(t)) activityTimes.push(t);
    }
  }
  for (const run of runsRes.data ?? []) {
    const t = new Date(run.updated_at as string).getTime();
    if (Number.isFinite(t)) activityTimes.push(t);
  }
  const lastActivityAt =
    activityTimes.length > 0
      ? new Date(Math.max(...activityTimes)).toISOString()
      : null;

  return {
    id: p.id,
    fullName: p.full_name,
    email: p.email,
    profileImageUrl: p.profile_image_url,
    createdAt: p.created_at,
    onboardingCompletedAt: p.onboarding_completed_at,
    dateOfBirth,
    age: dateOfBirth ? ageFromDateOfBirth(dateOfBirth) : null,
    gender: genderLabel(p.gender),
    padelLevelName: firstRelName(p.padel_levels),
    goalLabel,
    envLabel,
    painsStr,
    isAdmin,
    subscription: subscriptionDetail,
    enrollments,
    activePrograms,
    workoutLog,
    stats: {
      programsStarted: runsRes.data?.length ?? 0,
      workoutsCompleted,
      workoutsInProgress,
      lastActivityAt,
    },
  };
}

export { formatDateOfBirth, formatTrainingDuration, formatTrainingTimestamp };
