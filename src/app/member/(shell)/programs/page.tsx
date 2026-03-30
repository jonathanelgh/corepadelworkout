import { createClient } from "@/utils/supabase/server";
import { mapProgramRowsToCards, type ProgramRow } from "@/lib/programs/map-program-cards";
import { getHasActivePro } from "@/lib/member/has-active-pro";
import { MemberProgramsLibraryClient } from "./member-programs-client";

export const dynamic = "force-dynamic";

function programsFromEnrollments(
  rows: { programs: ProgramRow | ProgramRow[] | null }[] | null | undefined
): ProgramRow[] {
  const out: ProgramRow[] = [];
  for (const row of rows ?? []) {
    const p = row.programs;
    if (p == null) continue;
    const prog = Array.isArray(p) ? p[0] : p;
    if (prog && typeof prog.slug === "string") out.push(prog);
  }
  return out;
}

export default async function MemberProgramsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [programsRes, categoriesRes, enrollRes, hasPro] = await Promise.all([
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
        program_categories (
          sort_order,
          categories ( name )
        ),
        difficulty_levels ( name )
      `
      )
      .eq("status", "published")
      .order("updated_at", { ascending: false }),
    supabase.from("categories").select("name").order("sort_order", { ascending: true }),
    supabase
      .from("program_enrollments")
      .select(
        `
        programs (
          slug,
          title,
          description,
          cover_image_url,
          duration_weeks,
          price,
          program_categories (
            sort_order,
            categories ( name )
          ),
          difficulty_levels ( name )
        )
      `
      )
      .eq("user_id", user.id)
      .eq("status", "active"),
    getHasActivePro(supabase, user.id),
  ]);

  const loadErrorAll = programsRes.error?.message ?? null;
  const loadErrorMy = enrollRes.error?.message ?? null;

  const allPrograms = mapProgramRowsToCards(programsRes.data as ProgramRow[] | null);
  const myPrograms = mapProgramRowsToCards(programsFromEnrollments(enrollRes.data));

  const namesFromCategories = (categoriesRes.error ? [] : (categoriesRes.data ?? []))
    .map((c) => c.name)
    .filter((n): n is string => typeof n === "string" && n.length > 0 && n !== "All");

  const namesFromPrograms = [
    ...new Set(allPrograms.flatMap((p) => p.categoryNames).filter((n) => n.length > 0 && n !== "All")),
  ];

  const categoryOptionsAll = [
    "All",
    ...[...new Set([...namesFromCategories, ...namesFromPrograms])].sort((a, b) =>
      a.localeCompare(b, undefined, { sensitivity: "base" })
    ),
  ];

  return (
    <MemberProgramsLibraryClient
      allPrograms={allPrograms}
      myPrograms={myPrograms}
      categoryOptionsAll={categoryOptionsAll}
      hasActivePro={hasPro}
      loadErrorAll={loadErrorAll}
      loadErrorMy={loadErrorMy}
    />
  );
}
