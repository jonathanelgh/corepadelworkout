"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { getIsAdmin } from "@/utils/supabase/is-admin";
import { createServiceClient } from "@/utils/supabase/service";
import {
  generateProPassCode,
  loadProPasses,
  PRO_PASS_BATCH_MAX,
  PRO_PASS_MONTHS,
  type ProPassRow,
} from "@/lib/billing/pro-passes";

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." as const };
  if (!(await getIsAdmin(supabase))) return { error: "Not authorized." as const };
  return { error: null };
}

export async function createProPasses(input: {
  count: number;
  expiresAt: string | null;
}): Promise<{ ok: true; rows: ProPassRow[] } | { error: string }> {
  const auth = await requireAdmin();
  if (auth.error) return { error: auth.error };

  const count = Number(input.count);
  if (!Number.isInteger(count) || count < 1 || count > PRO_PASS_BATCH_MAX) {
    return { error: `Create between 1 and ${PRO_PASS_BATCH_MAX} passes.` };
  }

  let expiresAt: string | null = null;
  if (input.expiresAt) {
    const expiry = new Date(input.expiresAt);
    if (Number.isNaN(expiry.getTime())) return { error: "Invalid expiry date." };
    if (expiry.getTime() <= Date.now()) return { error: "Expiry must be in the future." };
    expiresAt = expiry.toISOString();
  }

  const service = createServiceClient();
  const inserts = Array.from({ length: count }, () => ({
    code: generateProPassCode(),
    name: "12 months of Pro",
    months: PRO_PASS_MONTHS,
    active: true,
    max_redemptions: 1,
    expires_at: expiresAt,
  }));

  const { error } = await service.from("signup_offers").insert(inserts);
  if (error) {
    if (error.code === "23505") return { error: "A generated code collided. Try again." };
    return { error: error.message };
  }

  revalidatePath("/admin/passes");
  try {
    const rows = await loadProPasses(service);
    const createdCodes = new Set(inserts.map((row) => row.code));
    return { ok: true, rows: rows.filter((row) => createdCodes.has(row.code)) };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Passes were created, but the list failed to refresh." };
  }
}
