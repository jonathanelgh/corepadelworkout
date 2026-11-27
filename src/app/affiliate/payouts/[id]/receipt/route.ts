import { NextResponse } from "next/server";
import { buildPaymentReceipt, receiptAmount } from "@/lib/affiliates/receipt-pdf";
import { formatWhen } from "@/lib/affiliates/types";
import { createClient, getRequestUser } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const user = await getRequestUser();
  if (!user) {
    return NextResponse.redirect(new URL("/login?next=/affiliate/payouts", _request.url));
  }

  const supabase = await createClient();
  const { data: affiliate } = await supabase
    .from("affiliates")
    .select("id, display_name, email")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!affiliate) return NextResponse.json({ error: "Not an affiliate." }, { status: 403 });

  const { data: payout } = await supabase
    .from("affiliate_payouts")
    .select("id, amount_cents, currency, status, period_label, paid_at, report_id")
    .eq("id", id)
    .eq("affiliate_id", affiliate.id)
    .eq("status", "paid")
    .maybeSingle();
  if (!payout?.paid_at) return NextResponse.json({ error: "Receipt is available after the payout is paid." }, { status: 404 });

  if (payout.report_id) {
    const { data: report } = await supabase
      .from("affiliate_payout_reports")
      .select("status")
      .eq("id", payout.report_id)
      .maybeSingle();
    if (report && report.status !== "locked") {
      return NextResponse.json({ error: "This payout is not final yet." }, { status: 404 });
    }
  }

  const { data: commissions } = await supabase
    .from("affiliate_commissions")
    .select("earned_at, sale_amount_cents, commission_cents, currency")
    .eq("payout_id", payout.id)
    .order("earned_at", { ascending: true });

  const pdf = buildPaymentReceipt({
    receiptId: payout.id.slice(0, 8).toUpperCase(),
    affiliateName: affiliate.display_name,
    email: affiliate.email,
    period: payout.period_label || "Payout",
    amount: receiptAmount(payout.amount_cents, payout.currency),
    paidOn: formatWhen(payout.paid_at),
    lines: (commissions ?? []).map((row) => ({
      date: formatWhen(row.earned_at),
      sale: receiptAmount(row.sale_amount_cents, row.currency),
      commission: receiptAmount(row.commission_cents, row.currency),
    })),
  });

  const filename = `corepadel-receipt-${payout.id.slice(0, 8)}.pdf`;
  return new NextResponse(new Blob([pdf as BlobPart]), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
