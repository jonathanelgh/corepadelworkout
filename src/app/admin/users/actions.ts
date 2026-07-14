"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { getIsAdmin } from "@/utils/supabase/is-admin";
import {
  loadAdminUserDetail,
  type AdminUserDetail,
} from "@/lib/admin/load-admin-user-detail";
import {
  ADMIN_PRO_GRANT_MONTHS,
  grantProSubscriptionToUser,
  revokeManualProSubscriptionFromUser,
  type AdminProGrantMonths,
} from "@/lib/admin/manage-pro-subscription";

async function requireAdmin() {
  const supabase = await createClient();
  if (!(await getIsAdmin(supabase))) {
    return { error: "Not authorized." as const };
  }
  return { error: null };
}

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

export async function grantAdminUserPro(
  userId: string,
  months: AdminProGrantMonths
): Promise<{ ok: true; detail: AdminUserDetail } | { error: string }> {
  const auth = await requireAdmin();
  if (auth.error) return { error: auth.error };

  const id = userId.trim();
  if (!id || !/^[0-9a-f-]{36}$/i.test(id)) {
    return { error: "Invalid user id." };
  }
  if (!ADMIN_PRO_GRANT_MONTHS.includes(months)) {
    return { error: "Invalid grant duration." };
  }

  const result = await grantProSubscriptionToUser({ userId: id, months });
  if (!result.ok) return { error: result.error };

  const supabase = await createClient();
  const detail = await loadAdminUserDetail(supabase, id);
  if (!detail) return { error: "User not found after update." };

  revalidatePath("/admin/users");
  return { ok: true, detail };
}

export async function revokeAdminUserPro(
  userId: string
): Promise<{ ok: true; detail: AdminUserDetail } | { error: string }> {
  const auth = await requireAdmin();
  if (auth.error) return { error: auth.error };

  const id = userId.trim();
  if (!id || !/^[0-9a-f-]{36}$/i.test(id)) {
    return { error: "Invalid user id." };
  }

  const result = await revokeManualProSubscriptionFromUser(id);
  if (!result.ok) return { error: result.error };

  const supabase = await createClient();
  const detail = await loadAdminUserDetail(supabase, id);
  if (!detail) return { error: "User not found after update." };

  revalidatePath("/admin/users");
  return { ok: true, detail };
}
