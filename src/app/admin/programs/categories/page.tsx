import Link from "next/link";
import { Tags } from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import {
  CategoriesListClient,
  type ProgramCategoryRow,
} from "./categories-list-client";

export const dynamic = "force-dynamic";

type Search = Promise<{ error?: string; saved?: string }>;

export default async function AdminProgramCategoriesPage({
  searchParams,
}: {
  searchParams?: Search;
}) {
  const sp = (await searchParams) ?? {};
  const supabase = await createClient();

  const [categoriesRes, linksRes] = await Promise.all([
    supabase
      .from("categories")
      .select("id, name, slug, description, sort_order")
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true }),
    supabase.from("program_categories").select("category_id"),
  ]);

  const countByCategory = new Map<string, number>();
  for (const row of linksRes.data ?? []) {
    const id = row.category_id as string;
    countByCategory.set(id, (countByCategory.get(id) ?? 0) + 1);
  }

  const items: ProgramCategoryRow[] = (categoriesRes.data ?? []).map((row) => ({
    id: row.id as string,
    name: row.name as string,
    slug: row.slug as string,
    description: (row.description as string | null) ?? null,
    sort_order: (row.sort_order as number) ?? 0,
    programCount: countByCategory.get(row.id as string) ?? 0,
  }));

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="flex min-h-14 shrink-0 items-center justify-between gap-4 border-b border-gray-200 bg-white px-8 py-3">
        <div className="flex min-w-0 items-start gap-3">
          <Tags className="mt-0.5 h-5 w-5 shrink-0 text-gray-600" />
          <div className="min-w-0">
            <h1 className="text-lg font-semibold text-gray-900">Program categories</h1>
            <p className="text-xs text-gray-500">
              Tags used to filter and group programs on the storefront and in the member hub.
            </p>
          </div>
        </div>
        <Link
          href="/admin/programs"
          className="shrink-0 text-sm text-gray-600 underline-offset-4 hover:text-black hover:underline"
        >
          Back to programs
        </Link>
      </div>

      <div className="min-h-0 flex-1 overflow-auto p-8">
        <div className="mx-auto max-w-5xl space-y-6">
          {sp.error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {sp.error}
            </div>
          )}
          {sp.saved && !sp.error && (
            <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
              Saved.
            </div>
          )}
          {categoriesRes.error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              Could not load categories: {categoriesRes.error.message}
            </div>
          )}
          {linksRes.error && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              Program counts may be incomplete: {linksRes.error.message}
            </div>
          )}

          <CategoriesListClient items={items} />
        </div>
      </div>
    </div>
  );
}
