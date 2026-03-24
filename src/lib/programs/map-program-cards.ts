import type { ProgramCard } from "@/app/programs/programs-library-client";

const COVER_FALLBACK = "/Padel_coach_standing.webp";

function firstRel<T extends { name?: string }>(
  v: T | T[] | null | undefined
): { name: string } | null {
  if (v == null) return null;
  const row = Array.isArray(v) ? v[0] : v;
  if (!row || typeof row !== "object" || !("name" in row)) return null;
  return { name: String((row as { name: string }).name) };
}

function formatDurationWeeks(n: number | null): string {
  if (n == null) return "—";
  return `${n} Week${n === 1 ? "" : "s"}`;
}

export type ProgramRow = {
  slug: string;
  title: string;
  description: string | null;
  cover_image_url: string | null;
  duration_weeks: number | null;
  price: number | null;
  categories: { name: string } | { name: string }[] | null;
  difficulty_levels: { name: string } | { name: string }[] | null;
};

export function mapProgramRowToCard(row: ProgramRow): ProgramCard | null {
  const slug = typeof row.slug === "string" ? row.slug.trim() : "";
  if (!slug) return null;
  const cat = firstRel(row.categories);
  const diff = firstRel(row.difficulty_levels);
  return {
    slug,
    title: row.title,
    description: (row.description?.trim() || "No description yet.").slice(0, 2000),
    image: row.cover_image_url?.trim() || COVER_FALLBACK,
    categoryName: cat?.name ?? null,
    difficultyName: diff?.name ?? null,
    durationLabel: formatDurationWeeks(row.duration_weeks),
    price: row.price,
  };
}

export function mapProgramRowsToCards(rows: ProgramRow[] | null | undefined): ProgramCard[] {
  return (rows ?? []).map(mapProgramRowToCard).filter((p): p is ProgramCard => p != null);
}
