import type { SupabaseClient } from "@supabase/supabase-js";
import type { ProgramCard } from "@/app/programs/programs-library-client";
import { PRIMARY_GOAL_LABELS, isOnboardingGoal } from "@/lib/member/onboarding";
import { getHasActivePro } from "@/lib/member/has-active-pro";
import { mapProgramRowsToCards, type ProgramRow } from "@/lib/programs/map-program-cards";

function programsFromEnrollments(
  rows: { programs: ProgramRow | ProgramRow[] | null }[] | null | undefined
): ProgramRow[] {
  const out: ProgramRow[] = [];
  for (const row of rows ?? []) {
    const p = row.programs;
    if (p == null) continue;
    const prog = Array.isArray(p) ? p[0] : p;
    if (prog && typeof prog.slug === "string") out.push(prog);
  }
  return out;
}

export type MemberHubHomeProgram = {
  slug: string;
  title: string;
  description: string | null;
  cover_image_url: string | null;
  price: number | null;
  duration_weeks: number | null;
};

export type MemberHubBlogPost = {
  slug: string;
  title: string;
  excerpt: string | null;
  published_at: string | null;
};

export type MemberHubProfile = {
  full_name: string | null;
  email: string | null;
  profile_image_url: string | null;
  birth_date: string | null;
  gender: string | null;
  levelName: string;
  goalLabel: string;
  envLabel: string;
  painsStr: string;
};

export type MemberHubData = {
  hasActivePro: boolean;
  homePrograms: MemberHubHomeProgram[];
  homeProgramsError: string | null;
  blogPosts: MemberHubBlogPost[];
  blogPostsError: string | null;
  allPrograms: ProgramCard[];
  myPrograms: ProgramCard[];
  categoryOptionsAll: string[];
  workoutsErrorAll: string | null;
  workoutsErrorMy: string | null;
  profileDetails: MemberHubProfile;
};

export async function loadMemberHubData(
  supabase: SupabaseClient,
  userId: string,
  userEmail: string | null
): Promise<MemberHubData> {
  const [
    hasActivePro,
    homeProgramsRes,
    blogRes,
    programsRes,
    categoriesRes,
    enrollRes,
    profileRes,
  ] = await Promise.all([
    getHasActivePro(supabase, userId),
    supabase
      .from("programs")
      .select("slug, title, description, cover_image_url, price, duration_weeks")
      .eq("status", "published")
      .order("updated_at", { ascending: false })
      .limit(6),
    supabase
      .from("blog_posts")
      .select("slug, title, excerpt, published_at")
      .eq("status", "published")
      .lte("published_at", new Date().toISOString())
      .order("published_at", { ascending: false })
      .limit(3),
    supabase
      .from("programs")
      .select(
        `
        slug,
        title,
        description,
        cover_image_url,
        duration_weeks,
        price,
        program_categories (
          sort_order,
          categories ( name )
        ),
        difficulty_levels ( name )
      `
      )
      .eq("status", "published")
      .order("updated_at", { ascending: false }),
    supabase.from("categories").select("name").order("sort_order", { ascending: true }),
    supabase
      .from("program_enrollments")
      .select(
        `
        programs (
          slug,
          title,
          description,
          cover_image_url,
          duration_weeks,
          price,
          program_categories (
            sort_order,
            categories ( name )
          ),
          difficulty_levels ( name )
        )
      `
      )
      .eq("user_id", userId)
      .eq("status", "active"),
    supabase
      .from("profiles")
      .select(
        "full_name, email, birth_date, gender, profile_image_url, primary_goal, training_environment, training_environments, padel_pains, padel_levels ( name )"
      )
      .eq("id", userId)
      .maybeSingle(),
  ]);

  const allPrograms = mapProgramRowsToCards(programsRes.data as ProgramRow[] | null);
  const myPrograms = mapProgramRowsToCards(programsFromEnrollments(enrollRes.data));

  const namesFromCategories = (categoriesRes.error ? [] : (categoriesRes.data ?? []))
    .map((c) => c.name)
    .filter((n): n is string => typeof n === "string" && n.length > 0 && n !== "All");

  const namesFromPrograms = [
    ...new Set(allPrograms.flatMap((p) => p.categoryNames).filter((n) => n.length > 0 && n !== "All")),
  ];

  const categoryOptionsAll = [
    "All",
    ...[...new Set([...namesFromCategories, ...namesFromPrograms])].sort((a, b) =>
      a.localeCompare(b, undefined, { sensitivity: "base" })
    ),
  ];

  const profile = profileRes.data;
  const levelName =
    profile && typeof profile.padel_levels === "object" && profile.padel_levels && "name" in profile.padel_levels
      ? String((profile.padel_levels as { name: string }).name)
      : "—";

  const goalLabel =
    profile?.primary_goal && isOnboardingGoal(profile.primary_goal)
      ? PRIMARY_GOAL_LABELS[profile.primary_goal]
      : "—";

  const envName: Record<string, string> = { gym: "Gym", home: "Home", club: "Club" };
  const envLabel =
    profile?.training_environments && profile.training_environments.length > 0
      ? profile.training_environments.map((v: string) => envName[v] ?? v).join(", ")
      : profile?.training_environment
        ? envName[profile.training_environment] ?? profile.training_environment
        : "—";

  const painLabels: Record<string, string> = {
    padel_elbow: "Padel elbow",
    jumpers_knee: "Jumper's knee",
    lower_back: "Lower back",
    plantar_fasciitis: "Heel / plantar",
    none: "None — general strength",
  };
  const painsStr =
    profile?.padel_pains && profile.padel_pains.length > 0
      ? profile.padel_pains.map((p: string) => painLabels[p] ?? p).join(", ")
      : "—";

  return {
    hasActivePro,
    homePrograms: (homeProgramsRes.data ?? []) as MemberHubHomeProgram[],
    homeProgramsError: homeProgramsRes.error?.message ?? null,
    blogPosts: (blogRes.data ?? []) as MemberHubBlogPost[],
    blogPostsError: blogRes.error?.message ?? null,
    allPrograms,
    myPrograms,
    categoryOptionsAll,
    workoutsErrorAll: programsRes.error?.message ?? null,
    workoutsErrorMy: enrollRes.error?.message ?? null,
    profileDetails: {
      full_name: profile?.full_name ?? null,
      email: userEmail ?? profile?.email ?? null,
      profile_image_url: profile?.profile_image_url ?? null,
      birth_date: profile?.birth_date ?? null,
      gender: profile?.gender ?? null,
      levelName,
      goalLabel,
      envLabel,
      painsStr,
    },
  };
}
