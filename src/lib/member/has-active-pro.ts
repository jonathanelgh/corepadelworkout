import type { SupabaseClient } from "@supabase/supabase-js";

type SubRow = {
  status: string;
  current_period_end: string;
  subscription_plans: { grants_all_programs: boolean } | { grants_all_programs: boolean }[] | null;
};

function planGrantsAll(sub: SubRow): boolean {
  const p = sub.subscription_plans;
  if (p == null) return false;
  const row = Array.isArray(p) ? p[0] : p;
  return Boolean(row?.grants_all_programs);
}

/** True when user has an active/trialing subscription whose plan grants all programs (e.g. Pro). */
export async function getHasActivePro(supabase: SupabaseClient, userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("customer_subscriptions")
    .select("status, current_period_end, subscription_plans!inner ( grants_all_programs )")
    .eq("user_id", userId);

  if (error || !data?.length) return false;

  const now = Date.now();
  return (data as SubRow[]).some((row) => {
    if (!planGrantsAll(row)) return false;
    if (row.status !== "active" && row.status !== "trialing") return false;
    const end = new Date(row.current_period_end).getTime();
    return Number.isFinite(end) && end > now;
  });
}
