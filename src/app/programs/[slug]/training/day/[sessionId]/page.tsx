import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { ProgramDayOverview } from "@/components/programs/program-day-overview";
import { userHasProgramAccess } from "@/lib/programs/check-program-access";
import { parseProgramFormat, usesProgramProgress } from "@/lib/programs/program-format";
import { loadProgramBySlugForViewer } from "@/lib/programs/load-program-for-viewer";
import { playHrefForSession } from "@/lib/programs/program-progress";
import { programCatalogHref, programDayHref, programTrainingHref } from "@/lib/programs/program-routes";
import { loadSessionWorkout, sessionDisplayLabel } from "@/lib/programs/program-sessions";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ slug: string; sessionId: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug, sessionId } = await params;
  const supabase = await createClient();
  const [{ data: program }, { data: session }] = await Promise.all([
    supabase.from("programs").select("title").eq("slug", slug.trim()).maybeSingle(),
    supabase.from("program_sessions").select("name").eq("id", sessionId).maybeSingle(),
  ]);
  const dayName = session?.name?.trim() || "Training day";
  const programTitle = program?.title?.trim();
  return { title: programTitle ? `${dayName} · ${programTitle}` : dayName };
}

export default async function ProgramDayPage({ params }: PageProps) {
  const { slug, sessionId } = await params;
  const supabase = await createClient();

  const [authRes, loaded] = await Promise.all([
    supabase.auth.getUser(),
    loadProgramBySlugForViewer<{
      id: string;
      title: string;
      cover_image_url: string | null;
      is_free: boolean;
      status: string;
      program_format: string | null;
      minutes_per_session: number | null;
    }>(
      supabase,
      slug,
      `
      id,
      title,
      cover_image_url,
      is_free,
      status,
      program_format,
      minutes_per_session
    `
    ),
  ]);

  const user = authRes.data.user;
  if (!user) {
    redirect(`/login?next=${encodeURIComponent(programDayHref(slug, sessionId))}`);
  }

  if (!loaded) notFound();

  const program = loaded.program;
  const programFormat = parseProgramFormat(program.program_format);

  // Single workouts skip the day overview and go straight to play.
  if (!usesProgramProgress(programFormat)) {
    redirect(playHrefForSession(slug, sessionId));
  }

  const needsAccessCheck = loaded.isAdminDraftPreview || !program.is_free;

  const [hasAccess, workout, runRes, completionRes] = await Promise.all([
    needsAccessCheck
      ? userHasProgramAccess(supabase, user.id, program.id)
      : Promise.resolve(true),
    loadSessionWorkout(supabase, program.id, sessionId),
    supabase
      .from("program_runs")
      .select("id, track_id")
      .eq("user_id", user.id)
      .eq("program_id", program.id)
      .maybeSingle(),
    supabase
      .from("program_session_completions")
      .select("started_at, completed_at")
      .eq("user_id", user.id)
      .eq("session_id", sessionId)
      .maybeSingle(),
  ]);

  if (!hasAccess) {
    redirect(`${programCatalogHref(slug)}?upgrade=1`);
  }

  if (!runRes.data) {
    redirect(programCatalogHref(slug));
  }

  if (!workout) notFound();

  if (runRes.data.track_id !== workout.trackId) {
    redirect(programTrainingHref(slug));
  }

  const startedAt = completionRes.data?.started_at ?? null;
  const completedAt = completionRes.data?.completed_at ?? null;
  const sessionLabel = sessionDisplayLabel(workout.session, 0);
  const durationMinutes =
    workout.session.durationMinutes != null && workout.session.durationMinutes > 0
      ? workout.session.durationMinutes
      : program.minutes_per_session;

  return (
    <ProgramDayOverview
      programSlug={slug}
      programTitle={
        loaded.isAdminDraftPreview ? `${program.title} (Draft)` : program.title
      }
      coverImageUrl={program.cover_image_url}
      sessionId={workout.session.id}
      sessionLabel={sessionLabel}
      description={workout.session.description}
      durationMinutes={durationMinutes}
      exercises={workout.exercises}
      inProgress={Boolean(startedAt && !completedAt)}
      completed={Boolean(completedAt)}
    />
  );
}
