import type { SupabaseClient } from "@supabase/supabase-js";

const MAX_CATALOG = 48;
const SUMMARY_MAX = 220;

export type ProgramCatalogRow = {
  id: string;
  title: string;
  slug: string;
  summary: string;
  minutes: number | null;
  weeks: number | null;
  difficulty: string | null;
  cover_image_url: string | null;
};

export type ProgramCatalogForAI = {
  id: string;
  title: string;
  summary: string;
  minutes: number | null;
  weeks: number | null;
  difficulty: string | null;
};

function truncateSummary(text: string | null | undefined): string {
  const t = (text ?? "").trim();
  if (t.length <= SUMMARY_MAX) return t;
  return `${t.slice(0, SUMMARY_MAX - 1)}…`;
}

export function catalogForAiPayload(rows: ProgramCatalogRow[]): ProgramCatalogForAI[] {
  return rows.slice(0, MAX_CATALOG).map((r) => ({
    id: r.id,
    title: r.title,
    summary: r.summary,
    minutes: r.minutes,
    weeks: r.weeks,
    difficulty: r.difficulty,
  }));
}

export async function fetchProgramsCatalog(
  supabase: SupabaseClient
): Promise<ProgramCatalogRow[]> {
  const { data, error } = await supabase
    .from("programs")
    .select(
      `
      id,
      title,
      slug,
      description,
      minutes_per_session,
      duration_weeks,
      cover_image_url,
      difficulty_levels ( name )
    `
    )
    .eq("status", "published")
    .order("title", { ascending: true })
    .limit(MAX_CATALOG);

  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => {
    const diff = row.difficulty_levels;
    const difficultyName = Array.isArray(diff)
      ? (diff[0] as { name?: string } | undefined)?.name ?? null
      : (diff as { name?: string } | null)?.name ?? null;

    return {
      id: row.id as string,
      title: row.title as string,
      slug: row.slug as string,
      summary: truncateSummary(row.description as string | null),
      minutes: (row.minutes_per_session as number | null) ?? null,
      weeks: (row.duration_weeks as number | null) ?? null,
      difficulty: difficultyName,
      cover_image_url: (row.cover_image_url as string | null) ?? null,
    };
  });
}
