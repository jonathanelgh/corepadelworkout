import type { SupabaseClient } from "@supabase/supabase-js";

export type TaxonomyOption = { id: string; name: string; slug?: string };

export type ExerciseTaxonomyContext = {
  locations: TaxonomyOption[];
  equipment: TaxonomyOption[];
  categoryTypes: TaxonomyOption[];
  movementPatterns: TaxonomyOption[];
  bodyRegions: TaxonomyOption[];
  bodyParts: TaxonomyOption[];
  exerciseLevels: TaxonomyOption[];
};

export async function loadExerciseTaxonomyContext(
  supabase: SupabaseClient
): Promise<ExerciseTaxonomyContext> {
  const [locations, equipment, categoryTypes, movementPatterns, bodyRegions, bodyParts, exerciseLevels] =
    await Promise.all([
      supabase.from("locations").select("id, name, slug").order("sort_order", { ascending: true }),
      supabase.from("equipment").select("id, title").order("title", { ascending: true }),
      supabase.from("exercise_category_types").select("id, name").order("name", { ascending: true }),
      supabase.from("movement_patterns").select("id, name").order("name", { ascending: true }),
      supabase.from("body_regions").select("id, name").order("name", { ascending: true }),
      supabase.from("body_parts").select("id, name").order("name", { ascending: true }),
      supabase.from("exercise_levels").select("id, name, slug").order("sort_order", { ascending: true }),
    ]);

  return {
    locations: (locations.data ?? []).map((r) => ({
      id: r.id as string,
      name: r.name as string,
      slug: r.slug as string,
    })),
    equipment: (equipment.data ?? []).map((r) => ({
      id: r.id as string,
      name: r.title as string,
    })),
    categoryTypes: (categoryTypes.data ?? []).map((r) => ({
      id: r.id as string,
      name: r.name as string,
    })),
    movementPatterns: (movementPatterns.data ?? []).map((r) => ({
      id: r.id as string,
      name: r.name as string,
    })),
    bodyRegions: (bodyRegions.data ?? []).map((r) => ({
      id: r.id as string,
      name: r.name as string,
    })),
    bodyParts: (bodyParts.data ?? []).map((r) => ({
      id: r.id as string,
      name: r.name as string,
    })),
    exerciseLevels: (exerciseLevels.data ?? []).map((r) => ({
      id: r.id as string,
      name: r.name as string,
      slug: r.slug as string,
    })),
  };
}

function normalizeName(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}

/** Match Gemini-returned labels to taxonomy IDs (exact then contains). */
export function matchTaxonomyIds(names: string[], options: TaxonomyOption[]): string[] {
  const ids: string[] = [];
  const seen = new Set<string>();
  for (const raw of names) {
    const n = normalizeName(raw);
    if (!n) continue;
    const exact = options.find((o) => normalizeName(o.name) === n);
    const partial =
      exact ??
      options.find((o) => {
        const on = normalizeName(o.name);
        return on.includes(n) || n.includes(on);
      });
    if (partial && !seen.has(partial.id)) {
      seen.add(partial.id);
      ids.push(partial.id);
    }
  }
  return ids;
}

export function matchExerciseLevelId(
  slugOrName: string | null | undefined,
  levels: TaxonomyOption[]
): string | null {
  if (!slugOrName?.trim()) return null;
  const n = normalizeName(slugOrName);
  const bySlug = levels.find((l) => l.slug && normalizeName(l.slug) === n);
  if (bySlug) return bySlug.id;
  const byName = levels.find((l) => normalizeName(l.name) === n);
  return byName?.id ?? null;
}

export function matchLocationId(
  slugOrName: string | null | undefined,
  locations: TaxonomyOption[],
  fallbackId: string
): string {
  if (!slugOrName?.trim()) return fallbackId;
  const n = normalizeName(slugOrName);
  const bySlug = locations.find((l) => l.slug && normalizeName(l.slug) === n);
  if (bySlug) return bySlug.id;
  const byName = locations.find((l) => normalizeName(l.name) === n);
  return byName?.id ?? fallbackId;
}

export function formatTaxonomyForPrompt(ctx: ExerciseTaxonomyContext): string {
  const line = (label: string, items: TaxonomyOption[]) =>
    `${label}: ${items.map((i) => i.name).join(", ") || "(none)"}`;

  return [
    line("Locations", ctx.locations),
    line("Exercise levels", ctx.exerciseLevels),
    line("Category types", ctx.categoryTypes),
    line("Movement patterns", ctx.movementPatterns),
    line("Body regions", ctx.bodyRegions),
    line("Body parts", ctx.bodyParts),
    line("Equipment", ctx.equipment),
  ].join("\n");
}
