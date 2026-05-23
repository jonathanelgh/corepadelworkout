import { revalidatePath } from "next/cache";
import { analyzeExerciseVideoWithGemini } from "@/lib/exercises/gemini-analyze-exercise-video";
import { insertExerciseWithRelations } from "@/lib/exercises/persist-exercise-relations";
import {
  loadExerciseTaxonomyContext,
  matchExerciseLevelId,
  matchLocationId,
  matchTaxonomyIds,
} from "@/lib/exercises/taxonomy-context";
import { sendBulkImportCompleteEmail } from "@/lib/emails/send-bulk-import-complete";
import { createServiceClient } from "@/utils/supabase/service";

type BatchRow = {
  id: string;
  notify_email: string;
  default_location_id: string;
  status: string;
  total_count: number;
};

type ItemRow = {
  id: string;
  sort_order: number;
  original_filename: string;
  video_url: string;
  status: string;
};

export async function processBulkImportBatch(batchId: string): Promise<void> {
  const supabase = createServiceClient();

  const { data: batch, error: batchErr } = await supabase
    .from("exercise_bulk_import_batches")
    .select("id, notify_email, default_location_id, status, total_count")
    .eq("id", batchId)
    .maybeSingle();

  if (batchErr || !batch) {
    console.error("[bulk-import] batch not found:", batchId, batchErr?.message);
    return;
  }

  const b = batch as BatchRow;

  await supabase
    .from("exercise_bulk_import_batches")
    .update({ status: "processing", started_at: new Date().toISOString() })
    .eq("id", batchId);

  const { data: items, error: itemsErr } = await supabase
    .from("exercise_bulk_import_items")
    .select("id, sort_order, original_filename, video_url, status")
    .eq("batch_id", batchId)
    .order("sort_order", { ascending: true });

  if (itemsErr || !items?.length) {
    await supabase
      .from("exercise_bulk_import_batches")
      .update({
        status: "failed",
        error_summary: itemsErr?.message ?? "No items in batch.",
        completed_at: new Date().toISOString(),
      })
      .eq("id", batchId);
    return;
  }

  const taxonomy = await loadExerciseTaxonomyContext(supabase);
  let completed = 0;
  let failed = 0;

  for (const raw of items as ItemRow[]) {
    if (raw.status === "completed") {
      completed += 1;
      continue;
    }

    await supabase
      .from("exercise_bulk_import_items")
      .update({ status: "processing" })
      .eq("id", raw.id);

    try {
      const draft = await analyzeExerciseVideoWithGemini(
        raw.video_url,
        taxonomy,
        raw.original_filename
      );

      const locationId = matchLocationId(draft.location_slug, taxonomy.locations, b.default_location_id);
      const exerciseLevelId = matchExerciseLevelId(draft.exercise_level_slug, taxonomy.exerciseLevels);

      const exerciseId = await insertExerciseWithRelations(
        supabase,
        {
          title: draft.title,
          description: draft.description || null,
          how_to: draft.how_to || null,
          video_url: raw.video_url,
          image_url: null,
          location_id: locationId,
          exercise_level_id: exerciseLevelId,
        },
        {
          equipmentIds: matchTaxonomyIds(draft.equipment_titles, taxonomy.equipment),
          categoryTypeIds: matchTaxonomyIds(draft.category_type_names, taxonomy.categoryTypes),
          movementPatternIds: matchTaxonomyIds(draft.movement_pattern_names, taxonomy.movementPatterns),
          bodyRegionIds: matchTaxonomyIds(draft.body_region_names, taxonomy.bodyRegions),
          bodyPartIds: matchTaxonomyIds(draft.body_part_names, taxonomy.bodyParts),
        }
      );

      await supabase
        .from("exercise_bulk_import_items")
        .update({
          status: "completed",
          exercise_id: exerciseId,
          gemini_raw: draft,
          processed_at: new Date().toISOString(),
          error_message: null,
        })
        .eq("id", raw.id);

      completed += 1;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error("[bulk-import] item failed:", raw.id, msg);
      await supabase
        .from("exercise_bulk_import_items")
        .update({
          status: "failed",
          error_message: msg.slice(0, 2000),
          processed_at: new Date().toISOString(),
        })
        .eq("id", raw.id);
      failed += 1;
    }

    await supabase
      .from("exercise_bulk_import_batches")
      .update({ completed_count: completed, failed_count: failed })
      .eq("id", batchId);
  }

  const finalStatus =
    failed === 0 ? "completed" : completed === 0 ? "failed" : "partial";

  await supabase
    .from("exercise_bulk_import_batches")
    .update({
      status: finalStatus,
      completed_count: completed,
      failed_count: failed,
      completed_at: new Date().toISOString(),
      error_summary: failed > 0 ? `${failed} of ${items.length} videos could not be processed.` : null,
    })
    .eq("id", batchId);

  const site = (process.env.NEXT_PUBLIC_SITE_URL || "https://corepadel.app").replace(/\/$/, "");
  const mail = await sendBulkImportCompleteEmail({
    to: b.notify_email,
    total: items.length,
    completed,
    failed,
    exercisesUrl: `${site}/admin/exercises`,
  });
  if (!mail.ok) {
    console.error("[bulk-import] completion email failed:", mail.error);
  }

  revalidatePath("/admin/exercises");
}
