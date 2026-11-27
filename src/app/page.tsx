import type { Metadata } from "next";
import { createClient, getRequestUser } from "@/utils/supabase/server";
import {
  MarketingHomePage,
  type FeaturedProgram,
  type WorkoutPreview,
} from "@/components/landing/marketing-home-page";

export const metadata: Metadata = {
  title: {
    absolute: "Padel Strength & Conditioning Workouts | CorePadel",
  },
  description:
    "Train for padel with video-guided strength and conditioning programs. Work out at home, at the gym, or on court. Try CorePadel Pro free for 7 days.",
  openGraph: {
    title: "Padel Strength & Conditioning Workouts | CorePadel",
    description:
      "Train for padel with video-guided strength and conditioning programs. Work out at home, at the gym, or on court. Try CorePadel Pro free for 7 days.",
    url: "/",
  },
};

export const dynamic = "force-dynamic";

const FEATURED = [
  {
    slug: "personalised-program-coach-david",
    description:
      "Build lower-body strength and conditioning for quick starts, changes of direction, and longer rallies.",
  },
  {
    slug: "4-week-core-padel-stability-program",
    description: "Build core strength and rotational control for more powerful shots.",
  },
  {
    slug: "7-minutes-padel-boost",
    description: "Five seven-minute workouts you can do without equipment.",
  },
] as const;

type ProgramQueryRow = {
  slug: string;
  title: string;
  cover_image_url: string | null;
  duration_weeks: number | null;
  sessions_per_week: number | null;
  minutes_per_session: number | null;
  difficulty_levels: { name: string } | { name: string }[] | null;
};

function difficultyName(
  value: ProgramQueryRow["difficulty_levels"]
): string | null {
  if (!value) return null;
  const row = Array.isArray(value) ? value[0] : value;
  const name = row?.name?.trim();
  return name || null;
}

function programMeta(row: ProgramQueryRow): string[] {
  const meta: string[] = [];
  if (row.duration_weeks) {
    meta.push(`${row.duration_weeks} week${row.duration_weeks === 1 ? "" : "s"}`);
  }
  const level = difficultyName(row.difficulty_levels);
  if (level) meta.push(level);
  if (row.sessions_per_week) meta.push(`${row.sessions_per_week}x / week`);
  if (row.minutes_per_session) meta.push(`${row.minutes_per_session} min`);
  return meta;
}

export default async function Home() {
  const supabase = await createClient();
  const slugs = FEATURED.map((item) => item.slug);

  const [programsRes, demoRes, user] = await Promise.all([
    supabase
      .from("programs")
      .select(
        "slug, title, cover_image_url, duration_weeks, sessions_per_week, minutes_per_session, difficulty_levels ( name )"
      )
      .in("slug", [...slugs])
      .eq("status", "published"),
    supabase
      .from("exercises")
      .select("title, image_url, video_url")
      .eq("status", "published")
      .not("video_url", "is", null)
      .not("image_url", "is", null)
      .ilike("title", "%Ladder In-Out%")
      .limit(1)
      .maybeSingle(),
    getRequestUser(),
  ]);

  const bySlug = new Map(
    ((programsRes.data ?? []) as ProgramQueryRow[]).map((row) => [row.slug, row])
  );

  const featuredPrograms: FeaturedProgram[] = FEATURED.flatMap((item) => {
    const row = bySlug.get(item.slug);
    if (!row?.title) return [];
    return [
      {
        slug: row.slug,
        title: row.title,
        description: item.description,
        image: row.cover_image_url?.trim() || "/Padel_coach_standing.webp",
        meta: programMeta(row),
      },
    ];
  });

  const demo = demoRes.data;
  const workoutPreview: WorkoutPreview | null =
    demo?.title && demo.image_url && demo.video_url
      ? {
          title: demo.title,
          posterUrl: demo.image_url,
          videoUrl: demo.video_url,
        }
      : null;

  return (
    <MarketingHomePage
      featuredPrograms={featuredPrograms}
      workoutPreview={workoutPreview}
      signedIn={Boolean(user)}
    />
  );
}
