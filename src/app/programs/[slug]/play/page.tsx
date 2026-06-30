import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { ActiveWorkoutPlayer } from "@/components/programs/active-workout-player";
import { loadSessionWorkout, sessionDisplayLabel, fetchProgramSessionsForProgram } from "@/lib/programs/program-sessions";
import { parseProgramFormat, usesProgramProgress } from "@/lib/programs/program-format";
import {
  ensureProgramRun,
  loadProgramProgress,
  playHrefForSession,
} from "@/lib/programs/program-progress";
import { requireProgramWorkoutAccess } from "../../program-access-bar";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ session?: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("programs")
    .select("title")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (!data) return { title: "Workout" };
  return { title: `${(data as { title: string }).title} · Workout` };
}

export default async function ProgramPlayPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { session: sessionId } = await searchParams;
  const supabase = await createClient();

  const { data: program, error } = await supabase
    .from("programs")
    .select("id, title, cover_image_url, song_url, status, is_free, program_format")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (error || !program) {
    notFound();
  }

  const row = program as {
    id: string;
    title: string;
    cover_image_url: string | null;
    song_url: string | null;
    is_free: boolean;
    program_format: string | null;
  };

  const programFormat = parseProgramFormat(row.program_format);
  const tracksProgress = usesProgramProgress(programFormat);

  await requireProgramWorkoutAccess(row.id, slug, row.is_free);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = user
    ? await supabase
        .from("profiles")
        .select("training_environment, training_environments")
        .eq("id", user.id)
        .maybeSingle()
    : { data: null };

  let resolvedSessionId = sessionId?.trim() || null;

  if (!resolvedSessionId) {
    if (user && tracksProgress) {
      const progress = await loadProgramProgress(supabase, user.id, row.id, profile, programFormat);
      const target = progress?.nextSession ?? progress?.sessions[0];
      if (target) redirect(playHrefForSession(slug, target.id));
    } else {
      const { sessions } = await fetchProgramSessionsForProgram(supabase, row.id, profile);
      if (sessions[0]) redirect(playHrefForSession(slug, sessions[0].id));
    }
    redirect(`/programs/${slug}`);
  }

  const workout = await loadSessionWorkout(supabase, row.id, resolvedSessionId);
  if (!workout) {
    notFound();
  }

  if (user && tracksProgress) {
    await ensureProgramRun(supabase, user.id, row.id, profile, programFormat);
  }

  const progress = user
    ? await loadProgramProgress(supabase, user.id, row.id, profile, programFormat)
    : null;

  const sessionIndex = progress?.sessions.findIndex((s) => s.id === resolvedSessionId) ?? -1;
  const nextSession =
    tracksProgress && progress && sessionIndex >= 0
      ? progress.sessions.slice(sessionIndex + 1).find((s) => !s.completedAt) ?? null
      : null;

  const displayTitle =
    workout.session.name?.trim() ||
    (sessionIndex >= 0
      ? sessionDisplayLabel(workout.session, sessionIndex)
      : row.title);

  return (
    <ActiveWorkoutPlayer
      programId={row.id}
      programSlug={slug}
      programTitle={row.title}
      programFormat={programFormat}
      sessionId={workout.session.id}
      sessionName={displayTitle}
      coverImageUrl={row.cover_image_url}
      songUrl={row.song_url}
      exercises={workout.exercises}
      nextSessionHref={nextSession ? playHrefForSession(slug, nextSession.id) : null}
      nextSessionLabel={nextSession?.name ?? null}
      programComplete={
        tracksProgress &&
        progress != null &&
        progress.completedCount + 1 >= progress.totalSessions &&
        !progress.sessions.find((s) => s.id === resolvedSessionId)?.completedAt
      }
    />
  );
}
