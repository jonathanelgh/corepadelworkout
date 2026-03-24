"use server";

import { createClient } from "@/utils/supabase/server";

export type EnrollResult =
  | { ok: true; alreadyEnrolled?: boolean }
  | { error: string; code?: "SIGN_IN_REQUIRED" };

/** Free / pre-Stripe: enroll the current user in a published program (idempotent if already active). */
export async function enrollInPublishedProgram(slug: string): Promise<EnrollResult> {
  const trimmed = slug.trim();
  if (!trimmed) {
    return { error: "Invalid program." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Sign in to start this program.", code: "SIGN_IN_REQUIRED" };
  }

  const { data: program, error: pErr } = await supabase
    .from("programs")
    .select("id, price, status")
    .eq("slug", trimmed)
    .eq("status", "published")
    .maybeSingle();

  if (pErr || !program) {
    return { error: "Program not found or not available." };
  }

  const pricePaid = program.price != null && Number.isFinite(Number(program.price)) ? Number(program.price) : 0;

  const { error: insErr } = await supabase.from("program_enrollments").insert({
    user_id: user.id,
    program_id: program.id,
    price_paid: pricePaid,
    currency: "eur",
    status: "active",
  });

  if (insErr) {
    const code = (insErr as { code?: string }).code;
    const msg = insErr.message ?? "";
    if (code === "23505" || msg.toLowerCase().includes("duplicate")) {
      return { ok: true, alreadyEnrolled: true };
    }
    return { error: insErr.message };
  }

  return { ok: true };
}
