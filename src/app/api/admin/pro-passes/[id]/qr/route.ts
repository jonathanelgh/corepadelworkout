import { NextResponse } from "next/server";
import { renderProPassQrPng } from "@/lib/billing/pro-passes";
import { createClient } from "@/utils/supabase/server";
import { getIsAdmin } from "@/utils/supabase/is-admin";
import { createServiceClient } from "@/utils/supabase/service";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }
  if (!(await getIsAdmin(supabase))) {
    return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  }

  const { id } = await context.params;
  const passId = id.trim();
  if (!passId) {
    return NextResponse.json({ error: "Missing pass." }, { status: 400 });
  }

  const service = createServiceClient();
  const { data, error } = await service
    .from("signup_offers")
    .select("code, max_redemptions")
    .eq("id", passId)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data || data.max_redemptions !== 1) {
    return NextResponse.json({ error: "Pass not found." }, { status: 404 });
  }

  const png = await renderProPassQrPng(data.code as string);
  const filename = `pro-pass-${data.code}.png`;
  return new NextResponse(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
