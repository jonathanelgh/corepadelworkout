"use server";

import { after } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { getIsAdmin } from "@/utils/supabase/is-admin";
import { processBulkImportBatch } from "@/lib/exercises/bulk-import-processor";

export type BulkImportUploadedFile = {
  storagePath: string;
  videoUrl: string;
  originalFilename: string;
};

export type StartBulkImportResult =
  | { ok: true; batchId: string; total: number }
  | { error: string };

export type BulkImportStatusResult =
  | {
      ok: true;
      status: string;
      total: number;
      completed: number;
      failed: number;
      items: { id: string; originalFilename: string; status: string; errorMessage: string | null }[];
    }
  | { error: string };

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "You must be signed in.", user: null, supabase };
  }
  if (!(await getIsAdmin(supabase))) {
    return { error: "Not authorized.", user: null, supabase };
  }
  return { error: null, user, supabase };
}

export async function startBulkExerciseImport(
  locationId: string,
  files: BulkImportUploadedFile[]
): Promise<StartBulkImportResult> {
  const auth = await requireAdmin();
  if (auth.error || !auth.user) {
    return { error: auth.error ?? "Unauthorized" };
  }

  const loc = locationId?.trim();
  if (!loc) {
    return { error: "Default location is required for bulk import." };
  }
  if (!files.length) {
    return { error: "Add at least one video." };
  }
  if (files.length > 20) {
    return { error: "Maximum 20 videos per batch." };
  }

  const notifyEmail = auth.user.email?.trim();
  if (!notifyEmail) {
    return { error: "Your account needs an email address to receive the completion notice." };
  }

  const { data: batch, error: batchErr } = await auth.supabase
    .from("exercise_bulk_import_batches")
    .insert({
      created_by: auth.user.id,
      notify_email: notifyEmail,
      default_location_id: loc,
      status: "pending",
      total_count: files.length,
    })
    .select("id")
    .single();

  if (batchErr || !batch) {
    return { error: batchErr?.message ?? "Could not create import batch." };
  }

  const batchId = batch.id as string;
  const itemRows = files.map((f, i) => ({
    batch_id: batchId,
    sort_order: i,
    original_filename: f.originalFilename,
    storage_path: f.storagePath,
    video_url: f.videoUrl,
    status: "pending",
  }));

  const { error: itemsErr } = await auth.supabase.from("exercise_bulk_import_items").insert(itemRows);
  if (itemsErr) {
    await auth.supabase.from("exercise_bulk_import_batches").delete().eq("id", batchId);
    return { error: itemsErr.message };
  }

  after(async () => {
    try {
      await processBulkImportBatch(batchId);
    } catch (e) {
      console.error("[bulk-import] background processing failed:", e);
    }
  });

  return { ok: true, batchId, total: files.length };
}

export async function getBulkImportBatchStatus(batchId: string): Promise<BulkImportStatusResult> {
  const auth = await requireAdmin();
  if (auth.error || !auth.user) {
    return { error: auth.error ?? "Unauthorized" };
  }

  const { data: batch, error: batchErr } = await auth.supabase
    .from("exercise_bulk_import_batches")
    .select("id, status, total_count, completed_count, failed_count, created_by")
    .eq("id", batchId)
    .maybeSingle();

  if (batchErr || !batch) {
    return { error: "Import batch not found." };
  }
  if ((batch as { created_by: string }).created_by !== auth.user.id) {
    return { error: "Not allowed." };
  }

  const { data: items } = await auth.supabase
    .from("exercise_bulk_import_items")
    .select("id, original_filename, status, error_message")
    .eq("batch_id", batchId)
    .order("sort_order", { ascending: true });

  const b = batch as {
    status: string;
    total_count: number;
    completed_count: number;
    failed_count: number;
  };

  return {
    ok: true,
    status: b.status,
    total: b.total_count,
    completed: b.completed_count,
    failed: b.failed_count,
    items: (items ?? []).map((row) => ({
      id: row.id as string,
      originalFilename: row.original_filename as string,
      status: row.status as string,
      errorMessage: (row.error_message as string | null) ?? null,
    })),
  };
}
