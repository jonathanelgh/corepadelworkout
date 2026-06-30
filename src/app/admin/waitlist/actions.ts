"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { getIsAdmin } from "@/utils/supabase/is-admin";
import { createServiceClient } from "@/utils/supabase/service";
import { sendLaunchLiveEmail } from "@/lib/emails/send-launch-live-email";
import { loadPreLaunchSignups, type PreLaunchSignupRow } from "@/lib/pre-launch/early-access";

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in.", supabase: null as null };
  if (!(await getIsAdmin(supabase))) return { error: "Not authorized.", supabase: null as null };
  return { error: null, supabase };
}

export async function loadWaitlistForAdmin(): Promise<
  { ok: true; rows: PreLaunchSignupRow[] } | { error: string }
> {
  const auth = await requireAdmin();
  if (auth.error || !auth.supabase) return { error: auth.error ?? "Unauthorized" };

  try {
    const rows = await loadPreLaunchSignups(createServiceClient());
    return { ok: true, rows };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Could not load waitlist." };
  }
}

export async function sendWaitlistLaunchEmail(
  signupId: string
): Promise<{ ok: true; sentAt: string } | { error: string }> {
  const auth = await requireAdmin();
  if (auth.error) return { error: auth.error };

  const service = createServiceClient();
  const { data: row, error } = await service
    .from("pre_launch_signups")
    .select("id, email, signup_token")
    .eq("id", signupId)
    .maybeSingle();

  if (error || !row) return { error: "Waitlist signup not found." };

  const mail = await sendLaunchLiveEmail({
    to: row.email,
    signupToken: row.signup_token,
  });
  if (!mail.ok) return { error: mail.error };

  const sentAt = new Date().toISOString();
  const { error: updateErr } = await service
    .from("pre_launch_signups")
    .update({ launch_email_sent_at: sentAt })
    .eq("id", signupId);

  if (updateErr) return { error: updateErr.message };

  revalidatePath("/admin/waitlist");
  return { ok: true, sentAt };
}

export async function sendWaitlistLaunchEmailBulk(
  onlyUnsent: boolean
): Promise<{ ok: true; sent: number; failed: number } | { error: string }> {
  const auth = await requireAdmin();
  if (auth.error || !auth.supabase) return { error: auth.error ?? "Unauthorized" };

  let rows: PreLaunchSignupRow[];
  try {
    rows = await loadPreLaunchSignups(createServiceClient());
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Could not load waitlist." };
  }

  const targets = onlyUnsent
    ? rows.filter((r) => !r.launch_email_sent_at)
    : rows;

  let sent = 0;
  let failed = 0;

  for (const row of targets) {
    const result = await sendWaitlistLaunchEmail(row.id);
    if ("error" in result) failed += 1;
    else sent += 1;
  }

  revalidatePath("/admin/waitlist");
  return { ok: true, sent, failed };
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/** Send a preview launch email without updating waitlist sent status. */
export async function sendWaitlistLaunchEmailTest(input: {
  to: string;
  signupId?: string | null;
}): Promise<{ ok: true } | { error: string }> {
  const auth = await requireAdmin();
  if (auth.error) return { error: auth.error };

  const to = input.to.trim().toLowerCase();
  if (!to) return { error: "Enter an email address." };
  if (!isValidEmail(to)) return { error: "Enter a valid email address." };

  const service = createServiceClient();

  let query = service.from("pre_launch_signups").select("id, email, signup_token");
  if (input.signupId?.trim()) {
    query = query.eq("id", input.signupId.trim());
  } else {
    query = query.order("created_at", { ascending: true }).limit(1);
  }

  const { data: row, error } = await query.maybeSingle();
  if (error) return { error: error.message };
  if (!row) {
    return {
      error: input.signupId
        ? "Waitlist signup not found."
        : "Add at least one waitlist signup to use as the sample signup link.",
    };
  }

  const mail = await sendLaunchLiveEmail({
    to,
    signupToken: row.signup_token,
    test: true,
  });
  if (!mail.ok) return { error: mail.error };

  return { ok: true };
}
