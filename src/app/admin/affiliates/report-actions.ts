"use server";

import { revalidatePath } from "next/cache";
import { generatePayoutReport, lockPayoutReport, markPayoutPaid } from "@/lib/affiliates/payout-reports";
import { createClient } from "@/utils/supabase/server";
import { getIsAdmin } from "@/utils/supabase/is-admin";

async function requireAdminId(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !(await getIsAdmin(supabase))) return null;
  return user.id;
}

function refresh(month: string) {
  revalidatePath("/admin/affiliates");
  revalidatePath("/admin/affiliates/payouts");
  revalidatePath(`/admin/affiliates/payouts?month=${month}`);
  revalidatePath("/affiliate/payouts");
  revalidatePath("/affiliate");
}

export async function generateReportAction(
  _prev: { error?: string },
  formData: FormData
): Promise<{ error?: string }> {
  const adminId = await requireAdminId();
  if (!adminId) return { error: "You need an admin account to build a payout report." };
  const month = String(formData.get("month") ?? "");
  const result = await generatePayoutReport(month, adminId);
  if (!result.error) refresh(month);
  return result;
}

export async function lockReportAction(
  _prev: { error?: string },
  formData: FormData
): Promise<{ error?: string }> {
  const adminId = await requireAdminId();
  if (!adminId) return { error: "You need an admin account to lock a payout report." };
  const reportId = String(formData.get("report_id") ?? "");
  const month = String(formData.get("month") ?? "");
  if (!reportId) return { error: "Missing report." };
  const result = await lockPayoutReport(reportId, adminId);
  if (!result.error) refresh(month);
  return result;
}

export async function markPaidAction(
  _prev: { error?: string },
  formData: FormData
): Promise<{ error?: string }> {
  const adminId = await requireAdminId();
  if (!adminId) return { error: "You need an admin account to mark a payout paid." };
  const payoutId = String(formData.get("payout_id") ?? "");
  const month = String(formData.get("month") ?? "");
  if (!payoutId) return { error: "Missing payout." };
  const result = await markPayoutPaid(payoutId);
  if (!result.error) refresh(month);
  return result;
}
