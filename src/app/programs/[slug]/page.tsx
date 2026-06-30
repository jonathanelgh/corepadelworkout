import type { Metadata } from "next";
import { CheckCircle2 } from "lucide-react";
import { notFound } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { fetchProgramExercises } from "@/lib/programs/program-exercises";
import { ProgramExperienceLayout } from "../program-experience-layout";
import { ProgramAccessBar } from "../program-access-bar";
import { ProgramDetailTabs } from "@/components/programs/program-detail-tabs";

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

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("programs")
    .select("title, description")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (!data) {
    return { title: "Program" };
  }

  const row = data as { title: string; description: string | null };
  return {
    title: row.title,
    description: row.description?.trim() || undefined,
  };
}

export default async function ProgramDetail({ params }: PageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: raw, error } = await supabase
    .from("programs")
    .select(
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
      duration_weeks,
      sessions_per_week,
      minutes_per_session,
      outcomes,
      difficulty_levels ( name )
    `
    )
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (error) {
    console.error("program detail:", error.message);
    notFound();
  }
  if (!raw) {
    notFound();
  }

  const program = raw as ProgramRow;
  const exercises = await fetchProgramExercises(supabase, program.id);

  const outcomes = normalizeOutcomes(program.outcomes);
  const aboutBlocks = bodyParagraphs(program.body, program.description);
  const difficultyLabel = firstDifficultyName(program.difficulty_levels) ?? "Program";
  const heroImage =
    program.cover_image_url?.trim() || "/Padel_player_makes_202603231105.jpeg";
  const subtitle =
    program.description?.trim() ||
    "Structured training to level up your game on and off the court.";
  const detailsText = program.body?.trim() || program.description?.trim() || null;

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
      backHref="/programs"
      backLabel="Back to programs"
      footer={
        <ProgramAccessBar
          programId={program.id}
          programSlug={slug}
          isFree={program.is_free}
          minutesPerSession={program.minutes_per_session}
        />
      }
    >
      <ProgramDetailTabs description={detailsText} exercises={exercises} />

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
