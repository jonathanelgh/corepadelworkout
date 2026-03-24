import type { SupabaseClient } from "@supabase/supabase-js";

/** Uses DB function (Pro subscription or active enrollment). */
export async function userHasProgramAccess(
  supabase: SupabaseClient,
  userId: string,
  programId: string
): Promise<boolean> {
  const { data, error } = await supabase.rpc("user_has_program_access", {
    p_user_id: userId,
    p_program_id: programId,
  });

  if (error) {
    console.error("user_has_program_access:", error.message);
    return false;
  }

  return Boolean(data);
}
