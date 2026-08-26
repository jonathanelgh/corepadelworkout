import type { SupabaseClient } from "@supabase/supabase-js";
import { getIsAdmin } from "@/utils/supabase/is-admin";

export type ProgramPublishStatus = "draft" | "published" | string;

/**
 * Member-facing routes only serve published programs.
 * Admins may also open drafts (by slug) to test without publishing.
 */
export async function canViewerAccessProgramStatus(
  supabase: SupabaseClient,
  status: ProgramPublishStatus | null | undefined
): Promise<{ allowed: boolean; isAdminDraftPreview: boolean }> {
  if (status === "published") {
    return { allowed: true, isAdminDraftPreview: false };
  }
  if (status === "draft") {
    const isAdmin = await getIsAdmin(supabase);
    if (isAdmin) return { allowed: true, isAdminDraftPreview: true };
  }
  return { allowed: false, isAdminDraftPreview: false };
}

/**
 * Load a program by slug for member/admin preview routes.
 * Returns null when the program does not exist or the viewer may not see it.
 */
export async function loadProgramBySlugForViewer<T extends { status: string }>(
  supabase: SupabaseClient,
  slug: string,
  select: string
): Promise<{ program: T; isAdminDraftPreview: boolean } | null> {
  const trimmed = slug.trim();
  if (!trimmed) return null;

  const { data, error } = await supabase
    .from("programs")
    .select(select)
    .eq("slug", trimmed)
    .maybeSingle();

  if (error || !data) return null;

  const program = data as unknown as T;
  const access = await canViewerAccessProgramStatus(supabase, program.status);
  if (!access.allowed) return null;

  return { program, isAdminDraftPreview: access.isAdminDraftPreview };
}
