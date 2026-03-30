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

export type ProgramCategoryLinkRow = {
  sort_order?: number | null;
  categories: { name: string } | { name: string }[] | null;
};

function categoryNamesFromLinks(links: ProgramCategoryLinkRow[] | ProgramCategoryLinkRow | null | undefined): string[] {
  if (links == null) return [];
  const arr = Array.isArray(links) ? links : [links];
  const withMeta = arr
    .map((l) => {
      const cat = firstRel(l.categories);
      const name = cat?.name?.trim();
      if (!name) return null;
      const order = typeof l.sort_order === "number" && Number.isFinite(l.sort_order) ? l.sort_order : 0;
      return { order, name };
    })
    .filter((x): x is { order: number; name: string } => x != null);
  withMeta.sort((a, b) => a.order - b.order || a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));
  return [...new Set(withMeta.map((x) => x.name))];
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
  /** Many-to-many categories (preferred). */
  program_categories?: ProgramCategoryLinkRow[] | ProgramCategoryLinkRow | null;
  /** @deprecated Legacy single relation; kept for compatibility if present in old queries. */
  categories?: { name: string } | { name: string }[] | null;
  difficulty_levels: { name: string } | { name: string }[] | null;
};

export function mapProgramRowToCard(row: ProgramRow): ProgramCard | null {
  const slug = typeof row.slug === "string" ? row.slug.trim() : "";
  if (!slug) return null;
  const fromLinks = categoryNamesFromLinks(row.program_categories);
  const fallbackCat = firstRel(row.categories);
  const categoryNames =
    fromLinks.length > 0
      ? fromLinks
      : fallbackCat?.name
        ? [fallbackCat.name]
        : [];
  const categoryName = categoryNames[0] ?? null;
  const diff = firstRel(row.difficulty_levels);
  return {
    slug,
    title: row.title,
    description: (row.description?.trim() || "No description yet.").slice(0, 2000),
    image: row.cover_image_url?.trim() || COVER_FALLBACK,
    categoryName,
    categoryNames,
    difficultyName: diff?.name ?? null,
    durationLabel: formatDurationWeeks(row.duration_weeks),
    price: row.price,
  };
}

export function mapProgramRowsToCards(rows: ProgramRow[] | null | undefined): ProgramCard[] {
  return (rows ?? []).map(mapProgramRowToCard).filter((p): p is ProgramCard => p != null);
}
