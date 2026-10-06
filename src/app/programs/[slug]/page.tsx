import type { Metadata } from "next";
import { CheckCircle2 } from "lucide-react";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { parseProgramFormat, usesProgramProgress } from "@/lib/programs/program-format";
import { loadProgramBySlugForViewer } from "@/lib/programs/load-program-for-viewer";
import { loadProgramProgress } from "@/lib/programs/program-progress";
import { programTrainingHref } from "@/lib/programs/program-routes";
import { ProgramSchedulePanel } from "@/components/programs/program-schedule-panel";
import { ProgramExperienceLayout } from "../program-experience-layout";
import { ProgramAccessBar } from "../program-access-bar";

export const dynamic = "force-dynamic";

type ProgramRow = {
  id: string;
  title: string;
  description: string | null;
  body: string | null;
  cover_image_url: string | null;
  promo_video_url: string | null;
  song_url: string | null;
  price: number | null;
  is_free: boolean;
  status: string;
  program_format: string | null;
  duration_weeks: number | null;
  sessions_per_week: number | null;
  minutes_per_session: number | null;
  outcomes: unknown;
  difficulty_levels: { name: string } | { name: string }[] | null;
};

function firstDifficultyName(
  v: ProgramRow["difficulty_levels"]
): string | null {
  if (v == null) return null;
  const row = Array.isArray(v) ? v[0] : v;
  if (!row || typeof row !== "object" || !("name" in row)) return null;
  return String((row as { name: string }).name);
}

function normalizeOutcomes(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v
    .filter((x): x is string => typeof x === "string")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

function bodyParagraphs(body: string | null, description: string | null): string[] {
  const primary = (body?.trim() || description?.trim() || "").trim();
  if (!primary) return [];
  return primary.split(/\n\n+/).map((p) => p.trim()).filter(Boolean);
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

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ view?: string; upgrade?: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const loaded = await loadProgramBySlugForViewer<{
    title: string;
    description: string | null;
    status: string;
  }>(supabase, slug, "title, description, status");

  if (!loaded) {
    return { title: "Program" };
  }

  const row = loaded.program;
  return {
    title: loaded.isAdminDraftPreview ? `${row.title} (Draft)` : row.title,
    description: row.description?.trim() || undefined,
  };
}

export default async function ProgramDetail({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const sp = await searchParams;
  const supabase = await createClient();

  const loaded = await loadProgramBySlugForViewer<ProgramRow>(
    supabase,
    slug,
    `
      id,
      title,
      description,
      body,
      cover_image_url,
      promo_video_url,
      song_url,
      price,
      is_free,
      status,
      program_format,
      duration_weeks,
      sessions_per_week,
      minutes_per_session,
      outcomes,
      difficulty_levels ( name )
    `
  );

  if (!loaded) {
    notFound();
  }

  const program = loaded.program;
  const isAdminDraftPreview = loaded.isAdminDraftPreview;
  const programFormat = parseProgramFormat(program.program_format);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let progress = null;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("training_environment, training_environments")
      .eq("id", user.id)
      .maybeSingle();
    progress = await loadProgramProgress(supabase, user.id, program.id, profile, programFormat);
  }

  if (
    user &&
    usesProgramProgress(programFormat) &&
    progress?.runId &&
    sp.view !== "info"
  ) {
    redirect(programTrainingHref(slug));
  }

  const outcomes = normalizeOutcomes(program.outcomes);
  const aboutBlocks = bodyParagraphs(program.body, null);
  const difficultyLabel = firstDifficultyName(program.difficulty_levels) ?? "Program";
  const heroImage =
    program.cover_image_url?.trim() || "/Padel_player_makes_202603231105.jpeg";
  const subtitle = program.description?.trim() || "";

  return (
    <ProgramExperienceLayout
      programTitle={program.title}
      subtitle={subtitle}
      difficultyLabel={difficultyLabel}
      heroImage={heroImage}
      promoVideoUrl={program.promo_video_url}
      songUrl={program.song_url}
      statWeeks={programFormat === "single_workout" ? "—" : formatStatWeeks(program.duration_weeks)}
      statFrequency={
        programFormat === "single_workout" ? "One-off" : formatStatFrequency(program.sessions_per_week)
      }
      statMinutes={formatStatMins(program.minutes_per_session)}
      backHref="/programs"
      backLabel="Back to programs"
      draftPreviewBanner={
        isAdminDraftPreview
          ? "Draft preview — only admins can see and test this program."
          : null
      }
      footer={
        <ProgramAccessBar
          programId={program.id}
          programSlug={slug}
          isFree={program.is_free}
          minutesPerSession={program.minutes_per_session}
          programFormat={programFormat}
          isAdminDraftPreview={isAdminDraftPreview}
        />
      }
    >
      {usesProgramProgress(programFormat) && progress && progress.totalSessions > 0 && (
        <ProgramSchedulePanel
          programSlug={slug}
          progress={progress}
          daysInteractive={Boolean(progress.runId)}
        />
      )}

      {aboutBlocks.length > 0 && (
        <div className="mb-12 mt-12">
          <h2 className="mb-4 text-2xl font-medium">About this program</h2>
          <div className="space-y-4 leading-relaxed text-gray-600">
            {aboutBlocks.map((block, i) => (
              <p key={i}>{block}</p>
            ))}
          </div>
        </div>
      )}

      {outcomes.length > 0 && (
        <div className="mb-12 rounded-3xl bg-gray-50 p-8">
          <h3 className="mb-6 text-lg font-medium">What you&apos;ll achieve</h3>
          <ul className="space-y-4">
            {outcomes.map((item, i) => (
              <li key={i} className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-black" />
                <span className="text-gray-700">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </ProgramExperienceLayout>
  );
}
