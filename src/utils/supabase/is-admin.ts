import type { SupabaseClient } from "@supabase/supabase-js";

/** Uses RLS: users may only read their own row in `admin_users`. */
export async function getIsAdmin(client: SupabaseClient): Promise<boolean> {
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) return false;

  const { data } = await client
    .from("admin_users")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  return Boolean(data);
}
