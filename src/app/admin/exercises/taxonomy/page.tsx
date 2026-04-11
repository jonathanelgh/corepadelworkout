import Link from "next/link";
import { Layers } from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import {
  AddBodyRegionModal,
  AddCategoryTypeModal,
  AddMovementPatternModal,
} from "./add-taxonomy-modals";
import {
  deleteBodyRegion,
  deleteCategoryType,
  deleteMovementPattern,
  updateBodyRegion,
  updateCategoryType,
  updateMovementPattern,
} from "./actions";
import { TaxonomyTableSection, type TaxonomyRow } from "./taxonomy-table-section";
import { TaxonomyTabsClient } from "./taxonomy-tabs-client";

export const dynamic = "force-dynamic";

type Search = Promise<{ error?: string; saved?: string }>;

export default async function ExerciseTaxonomyPage({ searchParams }: { searchParams?: Search }) {
  const sp = (await searchParams) ?? {};
  const supabase = await createClient();

  const [categoryRes, movementRes, regionRes] = await Promise.all([
    supabase.from("exercise_category_types").select("id, name, slug").order("name", { ascending: true }),
    supabase.from("movement_patterns").select("id, name, slug").order("name", { ascending: true }),
    supabase.from("body_regions").select("id, name, slug").order("name", { ascending: true }),
  ]);

  const categoryTypes = (categoryRes.data ?? []) as TaxonomyRow[];
  const movementPatterns = (movementRes.data ?? []) as TaxonomyRow[];
  const bodyRegions = (regionRes.data ?? []) as TaxonomyRow[];

  const loadError = [categoryRes.error, movementRes.error, regionRes.error].filter(Boolean);
  const errorMessage = loadError.map((e) => e!.message).join(" · ");

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="flex min-h-14 shrink-0 items-center justify-between gap-4 border-b border-gray-200 bg-white px-8 py-3">
        <div className="flex min-w-0 items-start gap-3">
          <Layers className="mt-0.5 h-5 w-5 shrink-0 text-gray-600" />
          <div className="min-w-0">
            <h1 className="text-lg font-semibold text-gray-900">Exercise taxonomy</h1>
            <p className="text-xs text-gray-500">
              Category types, movement patterns, and body regions used when tagging exercises.
            </p>
          </div>
        </div>
        <Link
          href="/admin/exercises"
          className="shrink-0 text-sm text-gray-600 underline-offset-4 hover:text-black hover:underline"
        >
          Back to exercises
        </Link>
      </div>

      <TaxonomyTabsClient
        announcements={
          <>
            {sp.error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{sp.error}</div>
            )}
            {sp.saved && !sp.error && (
              <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">Saved.</div>
            )}
            {errorMessage ? (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                Could not load taxonomy: {errorMessage}
              </div>
            ) : null}
          </>
        }
        categoryPanel={
          <TaxonomyTableSection
            heading="Category types"
            hint="Maps to exercise_category_types — multi-select on each exercise."
            rows={categoryTypes}
            updateAction={updateCategoryType}
            deleteAction={deleteCategoryType}
            addSlot={<AddCategoryTypeModal />}
          />
        }
        movementPanel={
          <TaxonomyTableSection
            heading="Movement patterns"
            hint="Maps to movement_patterns."
            rows={movementPatterns}
            updateAction={updateMovementPattern}
            deleteAction={deleteMovementPattern}
            addSlot={<AddMovementPatternModal />}
          />
        }
        bodyPanel={
          <TaxonomyTableSection
            heading="Body regions"
            hint="Maps to body_regions."
            rows={bodyRegions}
            updateAction={updateBodyRegion}
            deleteAction={deleteBodyRegion}
            addSlot={<AddBodyRegionModal />}
          />
        }
      />
    </div>
  );
}
