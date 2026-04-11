"use server";

import { createClient } from "@/utils/supabase/server";
import { getIsAdmin } from "@/utils/supabase/is-admin";
import type { StorageBucketId } from "@/utils/supabase/storage";
import { STORAGE_BUCKETS } from "@/utils/supabase/storage";

export type AdminMediaRow = {
  bucket: StorageBucketId;
  path: string;
  size: number;
  updated_at: string | null;
  publicUrl: string;
};

const LIST_LIMIT = 500;

const ADMIN_LIBRARY_BUCKETS: StorageBucketId[] = [
  STORAGE_BUCKETS.exercises,
  STORAGE_BUCKETS.equipment,
  STORAGE_BUCKETS.programs,
];

function assertBucket(id: string): id is StorageBucketId {
  return ADMIN_LIBRARY_BUCKETS.includes(id as StorageBucketId);
}

async function listBucketRecursive(
  supabase: Awaited<ReturnType<typeof createClient>>,
  bucket: StorageBucketId,
  prefix: string
): Promise<Omit<AdminMediaRow, "bucket" | "publicUrl">[]> {
  const out: Omit<AdminMediaRow, "bucket" | "publicUrl">[] = [];
  let offset = 0;

  for (;;) {
    const { data, error } = await supabase.storage.from(bucket).list(prefix, {
      limit: LIST_LIMIT,
      offset,
      sortBy: { column: "name", order: "asc" },
    });

    if (error) {
      throw new Error(error.message);
    }
    if (!data?.length) {
      break;
    }

    for (const item of data) {
      const path = prefix ? `${prefix}/${item.name}` : item.name;
      /* Folders: id is null (Storage list V1 API). */
      if (item.id === null) {
        const nested = await listBucketRecursive(supabase, bucket, path);
        out.push(...nested);
        continue;
      }

      const meta = item.metadata;
      const sizeRaw = meta?.size;
      const size =
        typeof sizeRaw === "number"
          ? sizeRaw
          : typeof sizeRaw === "string"
            ? Number.parseInt(sizeRaw, 10)
            : 0;

      out.push({ path, size, updated_at: item.updated_at ?? null });
    }

    if (data.length < LIST_LIMIT) {
      break;
    }
    offset += LIST_LIMIT;
  }

  return out;
}

export async function listAdminMediaAction(
  bucketFilter: StorageBucketId | "all"
): Promise<{ rows: AdminMediaRow[] } | { error: string }> {
  const supabase = await createClient();
  if (!(await getIsAdmin(supabase))) {
    return { error: "Not authorized." };
  }

  const buckets = bucketFilter === "all" ? ADMIN_LIBRARY_BUCKETS : [bucketFilter];

  try {
    const rows: AdminMediaRow[] = [];
    for (const bucket of buckets) {
      const files = await listBucketRecursive(supabase, bucket, "");
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
      for (const f of files) {
        const { data } = supabase.storage.from(bucket).getPublicUrl(f.path);
        const publicUrl =
          data.publicUrl ||
          `${supabaseUrl.replace(/\/$/, "")}/storage/v1/object/public/${bucket}/${f.path
            .split("/")
            .map((s) => encodeURIComponent(s))
            .join("/")}`;
        rows.push({ bucket, publicUrl, ...f });
      }
    }
    rows.sort((a, b) => {
      const ta = a.updated_at ? new Date(a.updated_at).getTime() : 0;
      const tb = b.updated_at ? new Date(b.updated_at).getTime() : 0;
      return tb - ta;
    });
    return { rows };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Could not list storage." };
  }
}

export async function deleteAdminMediaAction(
  bucket: string,
  path: string
): Promise<{ ok: true } | { error: string }> {
  if (!assertBucket(bucket)) {
    return { error: "Invalid bucket." };
  }
  const supabase = await createClient();
  if (!(await getIsAdmin(supabase))) {
    return { error: "Not authorized." };
  }

  const { error } = await supabase.storage.from(bucket).remove([path]);
  if (error) {
    return { error: error.message };
  }
  return { ok: true };
}
