import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { ListOrdered } from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import { userHasProgramAccess } from "@/lib/programs/check-program-access";
import { ProgramExperienceLayout } from "../../program-experience-layout";
import { ProgramTakeFooter } from "../../program-take-footer";
import { TakeSessionsList } from "../../take-sessions-list";

export const dynamic = "force-dynamic";

type ProgramRow = {
  id: string;
  title: string;
  description: string | null;
  cover_image_url: string | null;
  promo_video_url: string | null;
  song_url: string | null;
  duration_weeks: number | null;
  sessions_per_week: number | null;
  minutes_per_session: number | null;
  difficulty_levels: { name: string } | { name: string }[] | null;
};

type ExerciseRow = {
  id: string;
  title: string;
  description: string | null;
  how_to: string | null;
  video_url: string | null;
  image_url: string | null;
};

type SessionRow = {
  id: string;
  name: string;
  description: string | null;
  duration_minutes: number | null;
  sort_order: number;
  program_exercises: ProgramExerciseJoin | ProgramExerciseJoin[] | null;
};

type ProgramExerciseJoin = {
  sort_order: number;
  exercises: ExerciseRow | ExerciseRow[] | null;
};

function firstDifficultyName(
  v: ProgramRow["difficulty_levels"]
): string | null {
  if (v == null) return null;
  const row = Array.isArray(v) ? v[0] : v;
  if (!row || typeof row !== "object" || !("name" in row)) return null;
  return String((row as { name: string }).name);
}

function formatStatWeeks(n: number | null): string {
  if (n == null) return "—";
  return `${n} Week${n === 1 ? "" : "s"}`;
}

function formatStatFrequency(n: number | null): string {
  if (n == null) return "—";
  return `${n}x / Week`;
}

function formatStatMins(n: number | null): string {
  if (n == null) return "—";
  return `${n} Min${n === 1 ? "" : "s"}`;
}

function firstLocationName(
  v: { name: string } | { name: string }[] | null | undefined
): string | null {
  if (v == null) return null;
  const row = Array.isArray(v) ? v[0] : v;
  if (!row || typeof row !== "object" || !("name" in row)) return null;
  const n = String((row as { name: string }).name).trim();
  return n.length > 0 ? n : null;
}

function normalizeSessionsList(
  raw: SessionRow | SessionRow[] | null | undefined
): SessionRow[] {
  if (raw == null) return [];
  const arr = Array.isArray(raw) ? raw : [raw];
  return arr
    .filter((s) => s && typeof s.id === "string")
    .slice()
    .sort((a, b) => a.sort_order - b.sort_order);
}

function exercisesFromSession(session: SessionRow): ExerciseRow[] {
  const raw = session.program_exercises;
  if (raw == null) return [];
  const arr = Array.isArray(raw) ? raw : [raw];
  const out: { sort: number; ex: ExerciseRow }[] = [];
  for (const pe of arr) {
    const e = pe.exercises;
    const ex = Array.isArray(e) ? e[0] : e;
    if (ex && typeof ex.id === "string" && ex.title) {
      out.push({ sort: pe.sort_order ?? 0, ex });
    }
  }
  out.sort((a, b) => a.sort - b.sort);
  return out.map((o) => o.ex);
}

function formatSessionMeta(mins: number | null): string {
  if (mins == null || !Number.isFinite(mins) || mins < 0) return "—";
  return `${Math.round(mins)} min`;
}

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("programs")
    .select("title")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (!data) return { title: "Program" };
  return { title: `${(data as { title: string }).title} · Workouts` };
}

export default async function ProgramTakePage({ params }: PageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(`/programs/${slug}/take`)}`);
  }

  const { data: raw, error } = await supabase
    .from("programs")
    .select(
      `
      id,
      title,
      description,
      cover_image_url,
      promo_video_url,
      song_url,
      duration_weeks,
      sessions_per_week,
      minutes_per_session,
      difficulty_levels ( name )
    `
    )
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (error || !raw) {
    notFound();
  }

  const program = raw as ProgramRow;

  const allowed = await userHasProgramAccess(supabase, user.id, program.id);
  if (!allowed) {
    redirect(`/programs/${slug}`);
  }

  const { data: curriculumRows } = await supabase
    .from("program_location_tracks")
    .select(
      `
      sort_order,
      locations ( name ),
      program_sessions (
        id,
        name,
        description,
        duration_minutes,
        sort_order,
        program_exercises (
          sort_order,
          exercises (
            id,
            title,
            description,
            how_to,
            video_url,
            image_url
          )
        )
      )
    `
    )
    .eq("program_id", program.id)
    .order("sort_order", { ascending: true });

  type TrackIn = {
    sort_order: number;
    locations: { name: string } | { name: string }[] | null;
    program_sessions: SessionRow | SessionRow[] | null;
  };

  const tracks = (curriculumRows ?? []) as TrackIn[];
  const sortedTracks = [...tracks].sort((a, b) => a.sort_order - b.sort_order);
  const tracksWithSessions = sortedTracks
    .map((row) => ({
      sort_order: row.sort_order,
      locationName: firstLocationName(row.locations),
      sessions: normalizeSessionsList(row.program_sessions),
    }))
    .filter((t) => t.sessions.length > 0);

  const takeTracks = tracksWithSessions.map((track, trackIndex) => ({
    key: `${track.sort_order}-${trackIndex}`,
    locationName: track.locationName,
    sessions: track.sessions.map((session, si) => {
      const exercises = exercisesFromSession(session);
      return {
        id: session.id,
        sessionLabel: `Session ${si + 1}`,
        name: session.name?.trim() || `Session ${si + 1}`,
        description: session.description?.trim() || null,
        durationMeta: formatSessionMeta(session.duration_minutes),
        exercises: exercises.map((ex) => ({
          id: ex.id,
          title: ex.title,
          description: ex.description?.trim() || null,
          how_to: ex.how_to,
          video_url: ex.video_url?.trim() || null,
          image_url: ex.image_url?.trim() || null,
        })),
      };
    }),
  }));

  const difficultyLabel = firstDifficultyName(program.difficulty_levels) ?? "Program";
  const heroImage =
    program.cover_image_url?.trim() || "/Padel_player_makes_202603231105.jpeg";
  const subtitle =
    program.description?.trim() ||
    "Follow sessions in order — complete exercises at your pace.";

  return (
    <ProgramExperienceLayout
      programTitle={program.title}
      subtitle={subtitle}
      difficultyLabel={difficultyLabel}
      heroImage={heroImage}
      promoVideoUrl={program.promo_video_url}
      songUrl={program.song_url}
      statWeeks={formatStatWeeks(program.duration_weeks)}
      statFrequency={formatStatFrequency(program.sessions_per_week)}
      statMinutes={formatStatMins(program.minutes_per_session)}
      backHref="/member/programs"
      backLabel="Back to my programs"
      desktopEyebrow="Your training"
      footer={<ProgramTakeFooter programSlug={slug} />}
    >
      <div className="mb-10 flex items-start gap-3 rounded-2xl border border-gray-100 bg-gray-50/80 p-5">
        <ListOrdered className="mt-0.5 h-6 w-6 shrink-0 text-gray-500" />
        <div>
          <h2 className="text-lg font-medium text-gray-900">How this works</h2>
          <p className="mt-1 text-sm leading-relaxed text-gray-600">
            Work through each session below. Open a video when you need a demo, then mark progress in your own
            notebook or app — we&apos;ll add checkboxes and history soon.
          </p>
        </div>
      </div>

      <div className="mb-12">
        <h2 className="mb-6 text-2xl font-medium">Sessions &amp; exercises</h2>
        <TakeSessionsList programSlug={slug} tracks={takeTracks} />
      </div>
    </ProgramExperienceLayout>
  );
}
