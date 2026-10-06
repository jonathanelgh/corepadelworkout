import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { ActiveWorkoutPlayer } from "@/components/programs/active-workout-player";
import { loadSessionWorkout, sessionDisplayLabel, fetchProgramSessionsForProgram } from "@/lib/programs/program-sessions";
import { parseProgramFormat, usesProgramProgress } from "@/lib/programs/program-format";
import { loadProgramBySlugForViewer } from "@/lib/programs/load-program-for-viewer";
import {
  ensureProgramRunForTrack,
  loadPlaySessionNav,
  playHrefForSession,
} from "@/lib/programs/program-progress";
import { programDayHref } from "@/lib/programs/program-routes";
import { userHasProgramAccess } from "@/lib/programs/check-program-access";
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

  const [authRes, loaded] = await Promise.all([
    supabase.auth.getUser(),
    loadProgramBySlugForViewer<PlayProgramRow>(
      supabase,
      slug,
      "id, title, cover_image_url, song_url, status, is_free, program_format"
    ),
  ]);

  if (!loaded) {
    notFound();
  }

  const row = loaded.program;
  const programFormat = parseProgramFormat(row.program_format);
  const tracksProgress = usesProgramProgress(programFormat);
  const user = authRes.data.user;

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(`/programs/${slug}/play`)}`);
  }

  const needsAccessCheck = loaded.isAdminDraftPreview || !row.is_free;
  const resolvedSessionId = sessionId?.trim() || null;

  if (!resolvedSessionId) {
    const hasAccess = needsAccessCheck
      ? await userHasProgramAccess(supabase, user.id, row.id)
      : true;
    if (!hasAccess) {
      if (loaded.isAdminDraftPreview) notFound();
      redirect(`/programs/${slug}?upgrade=1`);
    }
    const { data: run } = await supabase
      .from("program_runs")
      .select("track_id")
      .eq("user_id", user.id)
      .eq("program_id", row.id)
      .maybeSingle();
    if (run?.track_id && tracksProgress) {
      const [{ data: sessionRows }, { data: completionRows }] = await Promise.all([
        supabase
          .from("program_sessions")
          .select("id")
          .eq("track_id", run.track_id)
          .order("sort_order", { ascending: true }),
        supabase
          .from("program_session_completions")
          .select("session_id, completed_at")
          .eq("user_id", user.id)
          .eq("program_id", row.id),
      ]);
      const done = new Set(
        (completionRows ?? [])
          .filter((c) => c.completed_at)
          .map((c) => c.session_id as string)
      );
      const targetId =
        (sessionRows ?? []).find((s) => !done.has(s.id as string))?.id ??
        sessionRows?.[0]?.id;
      if (targetId) redirect(playHrefForSession(slug, targetId as string));
    }
    const { data: profile } = await supabase
      .from("profiles")
      .select("training_environment, training_environments")
      .eq("id", user.id)
      .maybeSingle();
    const { sessions } = await fetchProgramSessionsForProgram(supabase, row.id, profile);
    if (sessions[0]) redirect(playHrefForSession(slug, sessions[0].id));
    redirect(`/programs/${slug}`);
  }

  const [hasAccess, workout] = await Promise.all([
    needsAccessCheck
      ? userHasProgramAccess(supabase, user.id, row.id)
      : Promise.resolve(true),
    loadSessionWorkout(supabase, row.id, resolvedSessionId),
  ]);

  if (!hasAccess) {
    if (loaded.isAdminDraftPreview) notFound();
    redirect(`/programs/${slug}?upgrade=1`);
  }

  if (!workout) {
    notFound();
  }

  if (tracksProgress) {
    await ensureProgramRunForTrack(supabase, user.id, row.id, workout.trackId);
  }

  const [initialLoads, nav] = await Promise.all([
    fetchMemberExerciseLoads(
      supabase,
      user.id,
      workout.exercises.map((e) => e.exerciseId)
    ),
    loadPlaySessionNav(
      supabase,
      user.id,
      row.id,
      workout.trackId,
      workout.session.id,
      tracksProgress
    ),
  ]);

  const displayTitle =
    workout.session.name?.trim() || sessionDisplayLabel(workout.session, nav.sessionIndex);

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
      resumeStepIndex={nav.resumeStepIndex}
      nextSessionHref={
        nav.nextSession
          ? tracksProgress
            ? programDayHref(slug, nav.nextSession.id)
            : playHrefForSession(slug, nav.nextSession.id)
          : null
      }
      nextSessionLabel={nav.nextSession?.name ?? null}
      programComplete={nav.programComplete}
    />
  );
}
