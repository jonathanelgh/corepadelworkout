import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { ProgramDayOverview } from "@/components/programs/program-day-overview";
import { userHasProgramAccess } from "@/lib/programs/check-program-access";
import { parseProgramFormat, usesProgramProgress } from "@/lib/programs/program-format";
import { loadProgramBySlugForViewer } from "@/lib/programs/load-program-for-viewer";
import { loadProgramProgress, playHrefForSession } from "@/lib/programs/program-progress";
import { programCatalogHref, programDayHref, programTrainingHref } from "@/lib/programs/program-routes";
import { loadSessionWorkout, sessionDisplayLabel } from "@/lib/programs/program-sessions";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ slug: string; sessionId: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug, sessionId } = await params;
  const supabase = await createClient();
  const loaded = await loadProgramBySlugForViewer<{ id: string; title: string; status: string }>(
    supabase,
    slug,
    "id, title, status"
  );
  if (!loaded) return { title: "Training day" };

  const workout = await loadSessionWorkout(supabase, loaded.program.id, sessionId);
  const dayName = workout?.session.name?.trim() || "Training day";
  return { title: `${dayName} · ${loaded.program.title}` };
}

export default async function ProgramDayPage({ params }: PageProps) {
  const { slug, sessionId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect(
      `/login?next=${encodeURIComponent(programDayHref(slug, sessionId))}`
    );
  }

  const loaded = await loadProgramBySlugForViewer<{
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
  );

  if (!loaded) notFound();

  const program = loaded.program;
  const programFormat = parseProgramFormat(program.program_format);

  // Single workouts skip the day overview and go straight to play.
  if (!usesProgramProgress(programFormat)) {
    redirect(playHrefForSession(slug, sessionId));
  }

  const hasAccess =
    (!loaded.isAdminDraftPreview && program.is_free) ||
    (await userHasProgramAccess(supabase, user.id, program.id));
  if (!hasAccess) {
    redirect(`${programCatalogHref(slug)}?upgrade=1`);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("training_environment, training_environments")
    .eq("id", user.id)
    .maybeSingle();

  const progress = await loadProgramProgress(
    supabase,
    user.id,
    program.id,
    profile,
    programFormat
  );

  if (!progress?.runId) {
    redirect(programCatalogHref(slug));
  }

  const workout = await loadSessionWorkout(supabase, program.id, sessionId);
  if (!workout) notFound();

  const sessionIndex = progress.sessions.findIndex((s) => s.id === sessionId);
  if (sessionIndex < 0) {
    // Session exists on another track / not part of this run.
    redirect(programTrainingHref(slug));
  }

  const sessionProgress = progress.sessions[sessionIndex]!;
  const sessionLabel = sessionDisplayLabel(workout.session, sessionIndex);
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
      inProgress={Boolean(sessionProgress.startedAt && !sessionProgress.completedAt)}
      completed={Boolean(sessionProgress.completedAt)}
    />
  );
}
