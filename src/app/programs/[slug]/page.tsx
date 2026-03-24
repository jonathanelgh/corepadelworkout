import type { Metadata } from "next";
import { CheckCircle2, PlayCircle } from "lucide-react";
import { notFound } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { userHasProgramAccess } from "@/lib/programs/check-program-access";
import { ProgramEnrollBar } from "../program-enroll-bar";
import { ProgramExperienceLayout } from "../program-experience-layout";

export const dynamic = "force-dynamic";

type ProgramRow = {
  id: string;
  title: string;
  description: string | null;
  body: string | null;
  cover_image_url: string | null;
  promo_video_url: string | null;
  price: number | null;
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

function formatPriceEur(price: number | null): string {
  if (price == null) return "—";
  try {
    return new Intl.NumberFormat("en-IE", {
      style: "currency",
      currency: "EUR",
    }).format(Number(price));
  } catch {
    return `€${Number(price).toFixed(2)}`;
  }
}

type CurriculumSession = {
  id: string;
  name: string;
  description: string | null;
  duration_minutes: number | null;
  sort_order: number;
};

type CurriculumTrack = {
  sort_order: number;
  locationName: string | null;
  sessions: CurriculumSession[];
};

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
  raw: CurriculumSession | CurriculumSession[] | null | undefined
): CurriculumSession[] {
  if (raw == null) return [];
  const arr = Array.isArray(raw) ? raw : [raw];
  return arr
    .filter((s) => s && typeof s.id === "string")
    .slice()
    .sort((a, b) => a.sort_order - b.sort_order);
}

function formatSessionMeta(mins: number | null): string {
  if (mins == null || !Number.isFinite(mins) || mins < 0) return "—";
  return `${Math.round(mins)} min`;
}

function buildCurriculumPreview(
  rows: Array<{
    sort_order: number;
    locations: { name: string } | { name: string }[] | null;
    program_sessions: CurriculumSession | CurriculumSession[] | null;
  }> | null
): CurriculumTrack[] {
  if (!rows?.length) return [];
  const tracks = [...rows]
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((row) => ({
      sort_order: row.sort_order,
      locationName: firstLocationName(row.locations),
      sessions: normalizeSessionsList(row.program_sessions),
    }));
  return tracks.filter((t) => t.sessions.length > 0);
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
      price,
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

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const hasAccess =
    user != null ? await userHasProgramAccess(supabase, user.id, program.id) : false;

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
        sort_order
      )
    `
    )
    .eq("program_id", program.id)
    .order("sort_order", { ascending: true });

  const curriculumTracks = buildCurriculumPreview(
    (curriculumRows ?? []) as Array<{
      sort_order: number;
      locations: { name: string } | { name: string }[] | null;
      program_sessions: CurriculumSession | CurriculumSession[] | null;
    }>
  );
  const outcomes = normalizeOutcomes(program.outcomes);
  const aboutBlocks = bodyParagraphs(program.body, program.description);
  const difficultyLabel = firstDifficultyName(program.difficulty_levels) ?? "Program";
  const heroImage =
    program.cover_image_url?.trim() || "/Padel_player_makes_202603231105.jpeg";
  const subtitle =
    program.description?.trim() ||
    "Structured training to level up your game on and off the court.";
  const priceLabel = formatPriceEur(program.price);

  return (
    <ProgramExperienceLayout
      programTitle={program.title}
      subtitle={subtitle}
      difficultyLabel={difficultyLabel}
      heroImage={heroImage}
      promoVideoUrl={program.promo_video_url}
      statWeeks={formatStatWeeks(program.duration_weeks)}
      statFrequency={formatStatFrequency(program.sessions_per_week)}
      statMinutes={formatStatMins(program.minutes_per_session)}
      backHref="/programs"
      backLabel="Back to programs"
      footer={
        <ProgramEnrollBar programSlug={slug} priceLabel={priceLabel} hasAccess={hasAccess} />
      }
    >
      {aboutBlocks.length > 0 && (
        <div className="mb-12">
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

      <div className="mb-12">
        <h2 className="mb-6 text-2xl font-medium">Curriculum Preview</h2>
        {curriculumTracks.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/50 px-5 py-8 text-center text-sm text-gray-500">
            Session details for this program aren&apos;t available yet.
          </p>
        ) : (
          <div className="space-y-8">
            {curriculumTracks.map((track, trackIndex) => (
              <div key={`${track.sort_order}-${trackIndex}`} className="space-y-4">
                {curriculumTracks.length > 1 && track.locationName && (
                  <p className="text-xs font-bold tracking-wider text-gray-400 uppercase">
                    {track.locationName}
                  </p>
                )}
                {track.sessions.map((session, si) => {
                  const label = `Session ${si + 1}`;
                  const desc = session.description?.trim();
                  return (
                    <div
                      key={session.id}
                      className="flex items-start justify-between gap-4 rounded-2xl border border-gray-100 p-5 transition-colors hover:border-gray-300"
                    >
                      <div className="flex min-w-0 flex-1 items-start gap-4">
                        <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-700">
                          <PlayCircle className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="mb-1 text-xs font-bold tracking-wider text-gray-400 uppercase">
                            {label}
                          </div>
                          <div className="font-medium text-gray-900">
                            {session.name?.trim() || `Session ${si + 1}`}
                          </div>
                          {desc && (
                            <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-gray-500">
                              {desc}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="shrink-0 text-sm tabular-nums text-gray-500">
                        {formatSessionMeta(session.duration_minutes)}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </div>
    </ProgramExperienceLayout>
  );
}
