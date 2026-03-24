import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Admin buckets (exercises, equipment, programs): upload requires `public.admin_users`.
 * `avatars`: customers upload under `{userId}/…` (see storage RLS).
 */

/** Must match `storage.buckets.id` in migrations */
export const STORAGE_BUCKETS = {
  exercises: "exercises",
  equipment: "equipment",
  programs: "programs",
  avatars: "avatars",
} as const;

export type StorageBucketId = (typeof STORAGE_BUCKETS)[keyof typeof STORAGE_BUCKETS];

/** Path inside bucket, e.g. `exerciseId/poster.webp` */
export function publicObjectUrl(
  supabaseUrl: string,
  bucket: StorageBucketId,
  path: string
): string {
  const base = supabaseUrl.replace(/\/$/, "");
  const encoded = path
    .split("/")
    .map((s) => encodeURIComponent(s))
    .join("/");
  return `${base}/storage/v1/object/public/${bucket}/${encoded}`;
}

export function getPublicObjectUrl(
  client: SupabaseClient,
  bucket: StorageBucketId,
  path: string
): string {
  const { data } = client.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}
