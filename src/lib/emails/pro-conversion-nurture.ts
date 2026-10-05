import { createServiceClient } from "@/utils/supabase/service";
import { getPublicSiteUrl } from "@/lib/stripe/config";
import {
  buildProConversionEmail,
  type ProConversionStep,
} from "./pro-conversion-nurture-html";
import { sendProConversionNurtureEmail } from "./send-pro-conversion-nurture";

/** Days after sequence_started_at when each step should send. */
export const PRO_CONVERSION_STEP_OFFSET_DAYS: Record<ProConversionStep, number> = {
  1: 1,
  2: 4,
  3: 8,
  4: 14,
};

export type ProConversionStopReason = "pro" | "offer" | "unsubscribed" | "completed";

type NurtureRow = {
  user_id: string;
  sequence_started_at: string;
  last_step_sent: number;
  next_send_at: string;
  stopped_at: string | null;
  stop_reason: string | null;
  unsubscribe_token: string;
};

type ProfileRow = {
  id: string;
  email: string | null;
  full_name: string | null;
  created_at: string;
};

function addDays(isoOrDate: string | Date, days: number): Date {
  const d = typeof isoOrDate === "string" ? new Date(isoOrDate) : new Date(isoOrDate);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

function firstNameFromFullName(fullName: string | null | undefined): string | null {
  const trimmed = fullName?.trim();
  if (!trimmed) return null;
  return trimmed.split(/\s+/)[0] ?? null;
}

/** Stable 0–47 hour stagger from user id (spread backfill over ~2 days). */
function staggerHoursFromUserId(userId: string): number {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = (hash * 31 + userId.charCodeAt(i)) >>> 0;
  }
  return hash % 48;
}

export function nextSendAtForStep(sequenceStartedAt: string | Date, step: ProConversionStep): Date {
  return addDays(sequenceStartedAt, PRO_CONVERSION_STEP_OFFSET_DAYS[step]);
}

export async function stopProConversionNurture(
  userId: string,
  reason: ProConversionStopReason
): Promise<void> {
  const id = userId.trim();
  if (!id) return;
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("pro_conversion_nurture")
    .select("stopped_at, stop_reason")
    .eq("user_id", id)
    .maybeSingle();
  if (!data) return;
  // Keep explicit unsubscribe; otherwise set / refine stop reason.
  if (data.stop_reason === "unsubscribed") return;
  const now = new Date().toISOString();
  await supabase
    .from("pro_conversion_nurture")
    .update({
      stopped_at: data.stopped_at ?? now,
      stop_reason: reason,
      next_send_at: now,
    })
    .eq("user_id", id);
}

export async function stopProConversionNurtureByToken(
  token: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const trimmed = token.trim();
  if (!trimmed || trimmed.length < 16) {
    return { ok: false, error: "Invalid unsubscribe link." };
  }
  const supabase = createServiceClient();
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("pro_conversion_nurture")
    .update({
      stopped_at: now,
      stop_reason: "unsubscribed",
      next_send_at: now,
    })
    .eq("unsubscribe_token", trimmed)
    .select("user_id")
    .maybeSingle();

  if (error) return { ok: false, error: error.message };
  if (!data) return { ok: false, error: "This unsubscribe link is not valid." };
  return { ok: true };
}

async function userHasActivePro(userId: string): Promise<boolean> {
  const supabase = createServiceClient();
  const nowIso = new Date().toISOString();
  const { data, error } = await supabase
    .from("customer_subscriptions")
    .select("id, status, current_period_end, subscription_plans!inner ( grants_all_programs )")
    .eq("user_id", userId)
    .in("status", ["active", "trialing"])
    .gt("current_period_end", nowIso);

  if (error || !data?.length) return false;
  return data.some((row) => {
    const plan = Array.isArray(row.subscription_plans)
      ? row.subscription_plans[0]
      : row.subscription_plans;
    return Boolean(
      plan &&
        typeof plan === "object" &&
        "grants_all_programs" in plan &&
        (plan as { grants_all_programs: boolean }).grants_all_programs
    );
  });
}

async function userHasOfferRedemption(userId: string): Promise<boolean> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("signup_offer_redemptions")
    .select("id")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();
  if (error) return false;
  return Boolean(data);
}

/** True if user should receive (or stay in) the free→Pro nurture. */
export async function isEligibleForProConversionNurture(userId: string): Promise<boolean> {
  if (await userHasActivePro(userId)) return false;
  if (await userHasOfferRedemption(userId)) return false;
  return true;
}

async function loadProgramTitleHint(userId: string): Promise<string | null> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("program_enrollments")
    .select("programs ( title )")
    .eq("user_id", userId)
    .eq("status", "active")
    .order("enrolled_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data) return null;
  const rel = data.programs as { title: string } | { title: string }[] | null;
  const row = Array.isArray(rel) ? rel[0] : rel;
  const title = row?.title?.trim();
  return title || null;
}

/**
 * Enroll free members who are not yet in the drip.
 * New signups: clock starts at profile.created_at (email 1 at +1 day).
 * Older free members (backfill): staggered start so we do not blast everyone at once.
 */
export async function enrollEligibleProConversionUsers(options?: {
  /** Profiles created before this are treated as backfill (staggered). Default: 2 days ago. */
  backfillBefore?: Date;
  limit?: number;
}): Promise<{ enrolled: number }> {
  const supabase = createServiceClient();
  const limit = options?.limit ?? 200;
  const backfillBefore =
    options?.backfillBefore ?? new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);

  const { data: existing } = await supabase.from("pro_conversion_nurture").select("user_id");
  const enrolledIds = new Set((existing ?? []).map((r) => r.user_id as string));

  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("id, email, full_name, created_at")
    .not("email", "is", null)
    .order("created_at", { ascending: true })
    .limit(2000);

  if (error || !profiles) {
    console.error("[pro-nurture] load profiles failed:", error?.message);
    return { enrolled: 0 };
  }

  const candidates = (profiles as ProfileRow[]).filter(
    (p) => p.email?.trim() && !enrolledIds.has(p.id)
  );

  let enrolled = 0;
  for (const profile of candidates) {
    if (enrolled >= limit) break;
    if (!(await isEligibleForProConversionNurture(profile.id))) continue;

    const createdAt = new Date(profile.created_at);
    const isBackfill = createdAt.getTime() < backfillBefore.getTime();

    let sequenceStartedAt: Date;
    if (isBackfill) {
      // First email due after stagger hours; sequence clock is 1 day before that.
      const staggerMs = staggerHoursFromUserId(profile.id) * 60 * 60 * 1000;
      const firstSendAt = new Date(Date.now() + staggerMs);
      sequenceStartedAt = addDays(firstSendAt, -1);
    } else {
      sequenceStartedAt = createdAt;
    }

    const nextSend = nextSendAtForStep(sequenceStartedAt, 1);
    const { error: insertErr } = await supabase.from("pro_conversion_nurture").insert({
      user_id: profile.id,
      sequence_started_at: sequenceStartedAt.toISOString(),
      last_step_sent: 0,
      next_send_at: nextSend.toISOString(),
    });

    if (insertErr) {
      // Unique race — ignore.
      if (insertErr.code !== "23505") {
        console.error("[pro-nurture] enroll failed:", profile.id, insertErr.message);
      }
      continue;
    }
    enrolled += 1;
  }

  return { enrolled };
}

async function stopIneligibleActiveRows(): Promise<number> {
  const supabase = createServiceClient();
  const { data: active } = await supabase
    .from("pro_conversion_nurture")
    .select("user_id")
    .is("stopped_at", null)
    .limit(500);

  let stopped = 0;
  for (const row of active ?? []) {
    const userId = row.user_id as string;
    if (await userHasOfferRedemption(userId)) {
      await stopProConversionNurture(userId, "offer");
      stopped += 1;
      continue;
    }
    if (await userHasActivePro(userId)) {
      await stopProConversionNurture(userId, "pro");
      stopped += 1;
    }
  }
  return stopped;
}

async function sendDueStep(row: NurtureRow, profile: ProfileRow): Promise<boolean> {
  const nextStep = (row.last_step_sent + 1) as ProConversionStep;
  if (nextStep < 1 || nextStep > 4) return false;

  if (!(await isEligibleForProConversionNurture(row.user_id))) {
    const reason = (await userHasOfferRedemption(row.user_id)) ? "offer" : "pro";
    await stopProConversionNurture(row.user_id, reason);
    return false;
  }

  const email = profile.email?.trim();
  if (!email) {
    await stopProConversionNurture(row.user_id, "completed");
    return false;
  }

  const siteUrl = getPublicSiteUrl();
  const programTitle = nextStep === 2 ? await loadProgramTitleHint(row.user_id) : null;
  const built = buildProConversionEmail({
    step: nextStep,
    firstName: firstNameFromFullName(profile.full_name),
    upgradeUrl: `${siteUrl}/member/upgrade`,
    programsUrl: `${siteUrl}/programs`,
    memberUrl: `${siteUrl}/member`,
    unsubscribeUrl: `${siteUrl}/email/unsubscribe?token=${encodeURIComponent(row.unsubscribe_token)}`,
    programTitle,
  });

  const sent = await sendProConversionNurtureEmail({
    to: email,
    subject: built.subject,
    html: built.html,
    text: built.text,
    idempotencyKey: `pro-nurture-${row.user_id}-step-${nextStep}`,
  });

  if (!sent.ok) {
    console.error("[pro-nurture] send failed:", row.user_id, nextStep, sent.error);
    return false;
  }

  const supabase = createServiceClient();
  if (nextStep === 4) {
    const now = new Date().toISOString();
    await supabase
      .from("pro_conversion_nurture")
      .update({
        last_step_sent: 4,
        stopped_at: now,
        stop_reason: "completed",
        next_send_at: now,
      })
      .eq("user_id", row.user_id);
  } else {
    const following = (nextStep + 1) as ProConversionStep;
    await supabase
      .from("pro_conversion_nurture")
      .update({
        last_step_sent: nextStep,
        next_send_at: nextSendAtForStep(row.sequence_started_at, following).toISOString(),
      })
      .eq("user_id", row.user_id);
  }

  return true;
}

export type ProConversionCronResult = {
  enrolled: number;
  stoppedIneligible: number;
  sent: number;
  dueChecked: number;
  errors: string[];
};

/** Enroll, prune, and send due Pro conversion nurture emails. */
export async function runProConversionNurtureCron(): Promise<ProConversionCronResult> {
  const errors: string[] = [];
  let enrolled = 0;
  let stoppedIneligible = 0;
  let sent = 0;
  let dueChecked = 0;

  try {
    stoppedIneligible = await stopIneligibleActiveRows();
  } catch (e) {
    errors.push(`stopIneligible: ${e instanceof Error ? e.message : String(e)}`);
  }

  try {
    const result = await enrollEligibleProConversionUsers({ limit: 150 });
    enrolled = result.enrolled;
  } catch (e) {
    errors.push(`enroll: ${e instanceof Error ? e.message : String(e)}`);
  }

  const supabase = createServiceClient();
  const nowIso = new Date().toISOString();
  const { data: dueRows, error: dueErr } = await supabase
    .from("pro_conversion_nurture")
    .select(
      "user_id, sequence_started_at, last_step_sent, next_send_at, stopped_at, stop_reason, unsubscribe_token"
    )
    .is("stopped_at", null)
    .lt("last_step_sent", 4)
    .lte("next_send_at", nowIso)
    .order("next_send_at", { ascending: true })
    .limit(50);

  if (dueErr) {
    errors.push(`dueQuery: ${dueErr.message}`);
    return { enrolled, stoppedIneligible, sent, dueChecked, errors };
  }

  const due = (dueRows ?? []) as NurtureRow[];
  dueChecked = due.length;
  if (due.length === 0) {
    return { enrolled, stoppedIneligible, sent, dueChecked, errors };
  }

  const userIds = due.map((r) => r.user_id);
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, email, full_name, created_at")
    .in("id", userIds);

  const profileById = new Map(
    ((profiles ?? []) as ProfileRow[]).map((p) => [p.id, p])
  );

  for (const row of due) {
    const profile = profileById.get(row.user_id);
    if (!profile) continue;
    try {
      const ok = await sendDueStep(row, profile);
      if (ok) sent += 1;
    } catch (e) {
      errors.push(
        `send ${row.user_id}: ${e instanceof Error ? e.message : String(e)}`
      );
    }
  }

  return { enrolled, stoppedIneligible, sent, dueChecked, errors };
}
