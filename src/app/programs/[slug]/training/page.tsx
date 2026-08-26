import { notFound, redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { userHasProgramAccess } from "@/lib/programs/check-program-access";
import { parseProgramFormat, usesProgramProgress } from "@/lib/programs/program-format";
import { loadProgramBySlugForViewer } from "@/lib/programs/load-program-for-viewer";
import { loadProgramProgress, playHrefForSession } from "@/lib/programs/program-progress";
import { programCatalogHref } from "@/lib/programs/program-routes";
import { fetchProgramSessionsForProgram } from "@/lib/programs/program-sessions";
import { ActiveProgramHub } from "@/components/programs/active-program-hub";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ slug: string }> };

function firstDifficultyName(
  v: { name: string } | { name: string }[] | null | undefined
): string | null {
  if (v == null) return null;
  const row = Array.isArray(v) ? v[0] : v;
  if (!row || typeof row !== "object" || !("name" in row)) return null;
  return String((row as { name: string }).name);
}

export default async function ProgramTrainingPage({ params }: PageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent(`/programs/${slug}/training`)}`);
  }

  const loaded = await loadProgramBySlugForViewer<{
    id: string;
    title: string;
    cover_image_url: string | null;
    is_free: boolean;
    status: string;
    program_format: string | null;
    minutes_per_session: number | null;
    difficulty_levels: { name: string } | { name: string }[] | null;
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
      minutes_per_session,
      difficulty_levels ( name )
    `
  );

  if (!loaded) {
    notFound();
  }

  const program = loaded.program;
  const programFormat = parseProgramFormat(program.program_format);

  const { data: profile } = await supabase
    .from("profiles")
    .select("training_environment, training_environments")
    .eq("id", user.id)
    .maybeSingle();

  if (!usesProgramProgress(programFormat)) {
    const { sessions } = await fetchProgramSessionsForProgram(supabase, program.id, profile);
    const first = sessions[0];
    if (first) {
      redirect(playHrefForSession(slug, first.id));
    }
    redirect(programCatalogHref(slug));
  }

  const hasAccess =
    (!loaded.isAdminDraftPreview && program.is_free) ||
    (await userHasProgramAccess(supabase, user.id, program.id));
  if (!hasAccess) {
    redirect(`${programCatalogHref(slug)}?upgrade=1`);
  }

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

  return (
    <ActiveProgramHub
      programSlug={slug}
      programTitle={
        loaded.isAdminDraftPreview ? `${program.title} (Draft)` : program.title
      }
      coverImageUrl={program.cover_image_url}
      minutesPerSession={program.minutes_per_session}
      difficultyLabel={firstDifficultyName(program.difficulty_levels)}
      progress={progress}
    />
  );
}
