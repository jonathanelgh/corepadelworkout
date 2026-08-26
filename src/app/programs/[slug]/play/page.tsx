import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { ActiveWorkoutPlayer } from "@/components/programs/active-workout-player";
import { loadSessionWorkout, sessionDisplayLabel, fetchProgramSessionsForProgram } from "@/lib/programs/program-sessions";
import { parseProgramFormat, usesProgramProgress } from "@/lib/programs/program-format";
import { loadProgramBySlugForViewer } from "@/lib/programs/load-program-for-viewer";
import {
  ensureProgramRun,
  loadProgramProgress,
  playHrefForSession,
} from "@/lib/programs/program-progress";
import { requireProgramWorkoutAccess } from "../../program-access-bar";
import { fetchMemberExerciseLoads } from "@/lib/programs/member-exercise-loads";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ session?: string }>;
};

type PlayProgramRow = {
  id: string;
  title: string;
  cover_image_url: string | null;
  song_url: string | null;
  status: string;
  is_free: boolean;
  program_format: string | null;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const loaded = await loadProgramBySlugForViewer<{ title: string; status: string }>(
    supabase,
    slug,
    "title, status"
  );

  if (!loaded) return { title: "Workout" };
  const title = loaded.isAdminDraftPreview
    ? `${loaded.program.title} · Draft workout`
    : `${loaded.program.title} · Workout`;
  return { title };
}

export default async function ProgramPlayPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { session: sessionId } = await searchParams;
  const supabase = await createClient();

  const loaded = await loadProgramBySlugForViewer<PlayProgramRow>(
    supabase,
    slug,
    "id, title, cover_image_url, song_url, status, is_free, program_format"
  );

  if (!loaded) {
    notFound();
  }

  const row = loaded.program;
  const programFormat = parseProgramFormat(row.program_format);
  const tracksProgress = usesProgramProgress(programFormat);

  await requireProgramWorkoutAccess(row.id, slug, row.is_free, {
    isAdminDraftPreview: loaded.isAdminDraftPreview,
  });

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

  const initialLoads = user
    ? await fetchMemberExerciseLoads(
        supabase,
        user.id,
        workout.exercises.map((e) => e.exerciseId)
      )
    : {};

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
      initialLoads={initialLoads}
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
