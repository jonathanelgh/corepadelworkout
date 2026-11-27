import {
  formatMonthLabel,
  isFinishedMonth,
  monthRange,
  parseMonth,
} from "@/lib/affiliates/months";
import { createServiceClient } from "@/utils/supabase/service";

export type PayoutReportLine = {
  payoutId: string;
  affiliateId: string;
  affiliateName: string;
  email: string;
  amountCents: number;
  currency: string;
  status: "pending" | "paid";
  paidAt: string | null;
  invoiceCount: number;
};

export type PayoutReportView = {
  id: string;
  periodStart: string;
  label: string;
  status: "open" | "locked";
  lockedAt: string | null;
  lines: PayoutReportLine[];
  totalCents: number;
  currency: string;
};

type CommissionRow = {
  id: string;
  affiliate_id: string;
  commission_cents: number;
  currency: string;
};

export async function loadPayoutReport(month: string): Promise<PayoutReportView | null> {
  const parsed = parseMonth(month);
  if (!parsed) return null;
  const periodStart = `${month}-01`;
  const supabase = createServiceClient();
  const { data: report, error } = await supabase
    .from("affiliate_payout_reports")
    .select("id, period_start, status, locked_at")
    .eq("period_start", periodStart)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!report) return null;

  const { data: payouts, error: payoutError } = await supabase
    .from("affiliate_payouts")
    .select("id, affiliate_id, amount_cents, currency, status, paid_at")
    .eq("report_id", report.id)
    .order("amount_cents", { ascending: false });
  if (payoutError) throw new Error(payoutError.message);

  const rows = payouts ?? [];
  const affiliateIds = [...new Set(rows.map((row) => row.affiliate_id))];
  const payoutIds = rows.map((row) => row.id);
  const [affiliates, commissions] = await Promise.all([
    affiliateIds.length
      ? supabase.from("affiliates").select("id, display_name, email").in("id", affiliateIds)
      : Promise.resolve({ data: [], error: null }),
    payoutIds.length
      ? supabase.from("affiliate_commissions").select("payout_id").in("payout_id", payoutIds)
      : Promise.resolve({ data: [], error: null }),
  ]);
  if (affiliates.error) throw new Error(affiliates.error.message);
  if (commissions.error) throw new Error(commissions.error.message);

  const affiliateById = new Map((affiliates.data ?? []).map((row) => [row.id, row]));
  const counts = new Map<string, number>();
  for (const commission of commissions.data ?? []) {
    if (!commission.payout_id) continue;
    counts.set(commission.payout_id, (counts.get(commission.payout_id) ?? 0) + 1);
  }

  const lines: PayoutReportLine[] = rows.map((row) => {
    const affiliate = affiliateById.get(row.affiliate_id);
    return {
      payoutId: row.id,
      affiliateId: row.affiliate_id,
      affiliateName: affiliate?.display_name ?? "Affiliate",
      email: affiliate?.email ?? "",
      amountCents: row.amount_cents,
      currency: row.currency,
      status: row.status === "paid" ? "paid" : "pending",
      paidAt: row.paid_at,
      invoiceCount: counts.get(row.id) ?? 0,
    };
  });
  const currency = lines[0]?.currency ?? "eur";
  return {
    id: report.id,
    periodStart: report.period_start,
    label: formatMonthLabel(parsed.year, parsed.month),
    status: report.status === "locked" ? "locked" : "open",
    lockedAt: report.locked_at,
    lines,
    totalCents: lines.filter((line) => line.currency === currency).reduce((sum, line) => sum + line.amountCents, 0),
    currency,
  };
}

export async function generatePayoutReport(month: string, adminId: string): Promise<{ error?: string }> {
  const parsed = parseMonth(month);
  if (!parsed) return { error: "Choose a month." };
  if (!isFinishedMonth(parsed.year, parsed.month)) {
    return { error: "Choose a month that has already ended." };
  }

  const periodStart = `${month}-01`;
  const { start, end } = monthRange(parsed.year, parsed.month);
  const supabase = createServiceClient();
  const { data: existing, error: existingError } = await supabase
    .from("affiliate_payout_reports")
    .select("id, status")
    .eq("period_start", periodStart)
    .maybeSingle();
  if (existingError) return { error: existingError.message };
  if (existing?.status === "locked") return { error: "This month is locked." };

  let reportId = existing?.id as string | undefined;
  if (!reportId) {
    const { data: created, error: createError } = await supabase
      .from("affiliate_payout_reports")
      .insert({ period_start: periodStart, created_by: adminId })
      .select("id")
      .single();
    if (createError || !created) return { error: createError?.message || "Could not create the report." };
    reportId = created.id;
  }

  const { data: pending, error: pendingError } = await supabase
    .from("affiliate_payouts")
    .select("id")
    .eq("report_id", reportId)
    .eq("status", "pending");
  if (pendingError) return { error: pendingError.message };
  const pendingIds = (pending ?? []).map((row) => row.id);
  if (pendingIds.length > 0) {
    const { error: unlinkError } = await supabase
      .from("affiliate_commissions")
      .update({ payout_id: null })
      .in("payout_id", pendingIds);
    if (unlinkError) return { error: unlinkError.message };
    const { error: deleteError } = await supabase.from("affiliate_payouts").delete().in("id", pendingIds);
    if (deleteError) return { error: deleteError.message };
  }

  const { data: commissions, error: commissionError } = await supabase
    .from("affiliate_commissions")
    .select("id, affiliate_id, commission_cents, currency")
    .is("payout_id", null)
    .gte("earned_at", start)
    .lt("earned_at", end);
  if (commissionError) return { error: commissionError.message };

  const groups = new Map<string, CommissionRow[]>();
  for (const row of (commissions ?? []) as CommissionRow[]) {
    const key = `${row.affiliate_id}:${row.currency}`;
    const list = groups.get(key) ?? [];
    list.push(row);
    groups.set(key, list);
  }

  const label = formatMonthLabel(parsed.year, parsed.month);
  for (const rows of groups.values()) {
    const amount = rows.reduce((sum, row) => sum + row.commission_cents, 0);
    if (amount <= 0) continue;
    const { data: payout, error: payoutError } = await supabase
      .from("affiliate_payouts")
      .insert({
        affiliate_id: rows[0].affiliate_id,
        report_id: reportId,
        amount_cents: amount,
        currency: rows[0].currency,
        status: "pending",
        period_label: label,
        created_by: adminId,
      })
      .select("id")
      .single();
    if (payoutError || !payout) return { error: payoutError?.message || "Could not add a payout line." };
    const { error: linkError } = await supabase
      .from("affiliate_commissions")
      .update({ payout_id: payout.id })
      .in(
        "id",
        rows.map((row) => row.id)
      )
      .is("payout_id", null);
    if (linkError) return { error: linkError.message };
  }

  return {};
}

export async function lockPayoutReport(reportId: string, adminId: string): Promise<{ error?: string }> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("affiliate_payout_reports")
    .update({
      status: "locked",
      locked_at: new Date().toISOString(),
      locked_by: adminId,
    })
    .eq("id", reportId)
    .eq("status", "open")
    .select("id")
    .maybeSingle();
  if (error) return { error: error.message };
  if (!data) return { error: "This report is already locked." };
  return {};
}

export async function markPayoutPaid(payoutId: string): Promise<{ error?: string }> {
  const supabase = createServiceClient();
  const { data: payout, error: loadError } = await supabase
    .from("affiliate_payouts")
    .select("id, report_id, status")
    .eq("id", payoutId)
    .maybeSingle();
  if (loadError || !payout) return { error: "Payout not found." };
  if (payout.status === "paid") return {};
  if (!payout.report_id) return { error: "This payout is not part of a monthly report." };

  const { data: report, error: reportError } = await supabase
    .from("affiliate_payout_reports")
    .select("status")
    .eq("id", payout.report_id)
    .maybeSingle();
  if (reportError || !report) return { error: "Report not found." };
  if (report.status !== "locked") return { error: "Lock the report before marking a payout paid." };

  const { error } = await supabase
    .from("affiliate_payouts")
    .update({ status: "paid", paid_at: new Date().toISOString() })
    .eq("id", payoutId)
    .eq("status", "pending");
  if (error) return { error: error.message };
  return {};
}
