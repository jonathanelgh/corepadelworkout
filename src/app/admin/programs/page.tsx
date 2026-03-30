import { Plus, Search, Edit, Eye, Filter } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { DeleteProgramButton } from "./delete-program-button";

export const dynamic = "force-dynamic";

type PageSearch = Promise<{ error?: string; deleted?: string }>;

type ProgramRow = {
  id: string;
  slug: string;
  title: string;
  status: string;
  price: number | null;
  cover_image_url: string | null;
  categoryLabels: string;
  difficulty_levels: { name: string } | null;
  duration_weeks: number | null;
  sessions_per_week: number | null;
  minutes_per_session: number | null;
};

function formatProgramSchedule(p: ProgramRow): string {
  const parts: string[] = [];
  if (p.duration_weeks != null) parts.push(`${p.duration_weeks} wk`);
  if (p.sessions_per_week != null) parts.push(`${p.sessions_per_week}/wk`);
  if (p.minutes_per_session != null) parts.push(`${p.minutes_per_session} min`);
  return parts.length > 0 ? parts.join(" · ") : "—";
}

function firstRel<T extends { name?: string }>(
  v: T | T[] | null | undefined
): { name: string } | null {
  if (v == null) return null;
  const row = Array.isArray(v) ? v[0] : v;
  if (!row || typeof row !== "object" || !("name" in row)) return null;
  return { name: String((row as { name: string }).name) };
}

function categoryLabelsFromLinks(
  links:
    | { sort_order?: number | null; categories?: { name: string } | { name: string }[] | null }[]
    | { sort_order?: number | null; categories?: { name: string } | { name: string }[] | null }
    | null
    | undefined
): string {
  if (links == null) return "—";
  const arr = Array.isArray(links) ? links : [links];
  const pairs = arr
    .map((l) => {
      const cat = firstRel(l.categories);
      const name = cat?.name?.trim();
      if (!name) return null;
      const order = typeof l.sort_order === "number" && Number.isFinite(l.sort_order) ? l.sort_order : 0;
      return { order, name };
    })
    .filter((x): x is { order: number; name: string } => x != null);
  pairs.sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
  const labels = [...new Set(pairs.map((p) => p.name))];
  return labels.length > 0 ? labels.join(", ") : "—";
}

export default async function AdminPrograms({ searchParams }: { searchParams?: PageSearch }) {
  const sp = (await searchParams) ?? {};
  const supabase = await createClient();
  const { data: raw, error } = await supabase
    .from("programs")
    .select(
      `
      id,
      slug,
      title,
      status,
      price,
      cover_image_url,
      duration_weeks,
      sessions_per_week,
      minutes_per_session,
      program_categories (
        sort_order,
        categories ( name )
      ),
      difficulty_levels ( name )
    `
    )
    .order("updated_at", { ascending: false });

  const programs: ProgramRow[] = (raw ?? []).map((row) => {
    const r = row as {
      id: string;
      slug: string;
      title: string;
      status: string;
      price: number | null;
      cover_image_url: string | null;
      duration_weeks: number | null;
      sessions_per_week: number | null;
      minutes_per_session: number | null;
      program_categories:
        | {
            sort_order?: number | null;
            categories?: { name: string } | { name: string }[] | null;
          }[]
        | {
            sort_order?: number | null;
            categories?: { name: string } | { name: string }[] | null;
          }
        | null;
      difficulty_levels: { name: string } | { name: string }[] | null;
    };
    return {
      id: r.id,
      slug: r.slug,
      title: r.title,
      status: r.status,
      price: r.price,
      cover_image_url: r.cover_image_url,
      duration_weeks: r.duration_weeks,
      sessions_per_week: r.sessions_per_week,
      minutes_per_session: r.minutes_per_session,
      categoryLabels: categoryLabelsFromLinks(r.program_categories),
      difficulty_levels: firstRel(r.difficulty_levels),
    };
  });

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-8">
        <h1 className="text-lg font-semibold text-gray-900">Programs</h1>
        <Link
          href="/admin/programs/new"
          className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add program
        </Link>
      </div>

      <div className="min-h-0 flex-1 overflow-auto p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              Could not load programs: {error.message}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white p-4 rounded-xl border border-gray-200">
            <div className="relative w-full sm:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search programs…"
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                disabled
              />
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                type="button"
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors w-full sm:w-auto justify-center opacity-60 cursor-not-allowed"
                disabled
              >
                <Filter className="w-4 h-4" />
                Filter
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50 text-gray-500 text-sm border-b border-gray-200">
                    <th className="px-6 py-4 font-medium w-96">Program</th>
                    <th className="px-6 py-4 font-medium">Categories</th>
                    <th className="px-6 py-4 font-medium">Level</th>
                    <th className="px-6 py-4 font-medium whitespace-nowrap">Schedule</th>
                    <th className="px-6 py-4 font-medium">Price</th>
                    <th className="px-6 py-4 font-medium">Sales</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                    <th className="px-6 py-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {programs.length === 0 && !error ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                        No programs yet.{" "}
                        <Link href="/admin/programs/new" className="font-medium text-black underline">
                          Create one
                        </Link>
                        .
                      </td>
                    </tr>
                  ) : (
                    programs.map((program) => {
                      const imageSrc =
                        program.cover_image_url ?? "/Padel_coach_standing.webp";
                      const priceLabel =
                        program.price != null ? `€${Number(program.price).toFixed(2)}` : "—";
                      const statusLabel = program.status === "published" ? "Published" : "Draft";
                      return (
                        <tr key={program.id} className="hover:bg-gray-50/50 transition-colors group">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 border border-gray-100 bg-gray-100">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={imageSrc}
                                  alt=""
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div className="font-medium text-gray-900">{program.title}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-gray-600">
                            <span className="inline-flex max-w-xs flex-wrap items-center gap-1">
                              {program.categoryLabels === "—" ? (
                                <span className="text-gray-400">—</span>
                              ) : (
                                program.categoryLabels.split(", ").map((label) => (
                                  <span
                                    key={label}
                                    className="inline-flex items-center rounded-md bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700"
                                  >
                                    {label}
                                  </span>
                                ))
                              )}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-gray-600">
                            {program.difficulty_levels?.name ?? "—"}
                          </td>
                          <td className="px-6 py-4 text-gray-600 text-xs tabular-nums whitespace-nowrap">
                            {formatProgramSchedule(program)}
                          </td>
                          <td className="px-6 py-4 font-medium text-gray-900">{priceLabel}</td>
                          <td className="px-6 py-4 text-gray-600">—</td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium ${
                                program.status === "published"
                                  ? "bg-green-50 text-green-700 border border-green-100"
                                  : "bg-yellow-50 text-yellow-700 border border-yellow-100"
                              }`}
                            >
                              {statusLabel}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-1 sm:gap-2">
                              <Link
                                href={`/programs/${program.slug}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 text-gray-400 hover:text-black hover:bg-gray-100 rounded-md transition-colors inline-flex"
                                title="View live"
                              >
                                <Eye className="w-4 h-4" />
                              </Link>
                              <Link
                                href={`/admin/programs/${program.id}/edit`}
                                className="p-1.5 text-gray-400 hover:text-black hover:bg-gray-100 rounded-md transition-colors inline-flex"
                                title="Edit"
                              >
                                <Edit className="w-4 h-4" />
                              </Link>
                              <DeleteProgramButton programId={program.id} programTitle={program.title} />
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50/50 flex items-center justify-between">
              <span className="text-sm text-gray-500">
                {programs.length === 0 ? "No programs" : `Showing ${programs.length} program(s)`}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
