import type { SupabaseClient } from "@supabase/supabase-js";

/** True when `userId` is listed in `admin_users` (RLS: own row, or admin reads all). */
export async function getIsAdminUser(client: SupabaseClient, userId: string): Promise<boolean> {
  if (!userId) return false;

  const { data } = await client
    .from("admin_users")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();

  return Boolean(data);
}

/** Uses RLS: users may only read their own row in `admin_users`. */
export async function getIsAdmin(client: SupabaseClient): Promise<boolean> {
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) return false;

  return getIsAdminUser(client, user.id);
}
