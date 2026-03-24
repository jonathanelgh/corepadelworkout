import { createClient } from "@/utils/supabase/server";
import { mapProgramRowsToCards, type ProgramRow } from "@/lib/programs/map-program-cards";
import { ProgramsLibraryClient } from "./programs-library-client";

export const dynamic = "force-dynamic";

export default async function ProgramsPage() {
  const supabase = await createClient();

  const [programsRes, categoriesRes] = await Promise.all([
    supabase
      .from("programs")
      .select(
        `
        slug,
        title,
        description,
        cover_image_url,
        duration_weeks,
        price,
        categories ( name ),
        difficulty_levels ( name )
      `
      )
      .eq("status", "published")
      .order("updated_at", { ascending: false }),
    supabase.from("categories").select("name").order("sort_order", { ascending: true }),
  ]);

  const loadError = programsRes.error?.message ?? null;

  const programs = mapProgramRowsToCards(programsRes.data as ProgramRow[] | null);

  const namesFromCategories = (categoriesRes.error ? [] : (categoriesRes.data ?? []))
    .map((c) => c.name)
    .filter((n): n is string => typeof n === "string" && n.length > 0 && n !== "All");

  const namesFromPrograms = [
    ...new Set(
      programs
        .map((p) => p.categoryName)
        .filter((n): n is string => n != null && n.length > 0 && n !== "All")
    ),
  ];

  const categoryOptions = [
    "All",
    ...[...new Set([...namesFromCategories, ...namesFromPrograms])].sort((a, b) =>
      a.localeCompare(b, undefined, { sensitivity: "base" })
    ),
  ];

  return (
    <ProgramsLibraryClient
      programs={programs}
      categoryOptions={categoryOptions}
      loadError={loadError}
    />
  );
}
