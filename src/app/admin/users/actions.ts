"use server";

import { createClient } from "@/utils/supabase/server";
import { getIsAdmin } from "@/utils/supabase/is-admin";
import {
  loadAdminUserDetail,
  type AdminUserDetail,
} from "@/lib/admin/load-admin-user-detail";

export async function getAdminUserDetail(
  userId: string
): Promise<{ detail: AdminUserDetail } | { error: string }> {
  const id = userId.trim();
  if (!id || !/^[0-9a-f-]{36}$/i.test(id)) {
    return { error: "Invalid user id." };
  }

  const supabase = await createClient();
  if (!(await getIsAdmin(supabase))) {
    return { error: "Not authorized." };
  }

  const detail = await loadAdminUserDetail(supabase, id);
  if (!detail) {
    return { error: "User not found." };
  }

  return { detail };
}
