"use server";

import { revalidatePath } from "next/cache";
import { randomBytes } from "crypto";
import { sendAffiliateWelcomeEmail } from "@/lib/emails/send-affiliate-welcome";
import { affiliateLink } from "@/lib/affiliates/links";
import { createClient } from "@/utils/supabase/server";
import { createServiceClient } from "@/utils/supabase/service";
import { getIsAdmin } from "@/utils/supabase/is-admin";

export type CreateAffiliateState = {
  error?: string;
  created?: {
    id: string;
    email: string;
    password: string | null;
    link: string;
    code: string;
    existingAccount: boolean;
    emailSent: boolean;
  };
};

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const PASSWORD_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";

function randomFrom(alphabet: string, length: number): string {
  const bytes = randomBytes(length);
  return Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join("");
}

function clean(value: FormDataEntryValue | null, max: number): string {
  return String(value ?? "").trim().slice(0, max);
}

function optional(value: FormDataEntryValue | null, max: number): string | null {
  const text = clean(value, max);
  return text.length > 0 ? text : null;
}

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !(await getIsAdmin(supabase))) {
    return null;
  }
  return user;
}

export async function createAffiliateAction(
  _prev: CreateAffiliateState,
  formData: FormData
): Promise<CreateAffiliateState> {
  const admin = await requireAdmin();
  if (!admin) return { error: "You need an admin account to create affiliates." };

  const displayName = clean(formData.get("display_name"), 80);
  const email = clean(formData.get("email"), 200).toLowerCase();
  const passwordInput = clean(formData.get("password"), 72);
  const phone = optional(formData.get("phone"), 40);
  const instagram = optional(formData.get("instagram"), 200);
  const youtube = optional(formData.get("youtube"), 200);
  const facebook = optional(formData.get("facebook"), 200);
  const tiktok = optional(formData.get("tiktok"), 200);
  const website = optional(formData.get("website"), 200);
  const notes = optional(formData.get("notes"), 2000);
  const percent = Number(formData.get("commission_percent"));
  const months = Number(formData.get("commission_months"));

  if (displayName.length < 1) return { error: "Enter the affiliate name." };
  if (!email.includes("@")) return { error: "Enter a valid email." };
  if (passwordInput && passwordInput.length < 8) {
    return { error: "Password must be at least 8 characters, or leave it blank to generate one." };
  }
  if (!Number.isFinite(percent) || percent < 0 || percent > 100) {
    return { error: "Commission must be between 0 and 100." };
  }
  if (!Number.isInteger(months) || months < 1 || months > 60) {
    return { error: "Commission length must be between 1 and 60 months." };
  }

  const supabase = createServiceClient();
  let existingUserId: string | null;
  try {
    existingUserId = await findUserIdByEmail(supabase, email);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not look up that email." };
  }
  if (existingUserId) {
    const { data: existingAffiliate, error: existingError } = await supabase
      .from("affiliates")
      .select("id")
      .eq("user_id", existingUserId)
      .maybeSingle();
    if (existingError) return { error: existingError.message };
    if (existingAffiliate) return { error: "This account is already an affiliate." };
  }

  let userId = existingUserId;
  let createdNewUser = false;
  let password: string | null = existingUserId ? null : passwordInput || randomFrom(PASSWORD_ALPHABET, 16);
  if (!userId) {
    const { data: created, error: createError } = await supabase.auth.admin.createUser({
      email,
      password: password ?? undefined,
      email_confirm: true,
      user_metadata: { full_name: displayName },
    });
    if (createError || !created.user) {
      const message = createError?.message.toLowerCase() ?? "";
      const recoveredId =
        message.includes("already") || message.includes("registered")
          ? await findAuthUserIdByEmail(supabase, email)
          : null;
      if (!recoveredId) {
        return { error: createError?.message || "Could not create the affiliate account." };
      }
      const { data: existingAffiliate, error: existingError } = await supabase
        .from("affiliates")
        .select("id")
        .eq("user_id", recoveredId)
        .maybeSingle();
      if (existingError) return { error: existingError.message };
      if (existingAffiliate) return { error: "This account is already an affiliate." };
      userId = recoveredId;
      password = null;
    } else {
      userId = created.user.id;
      createdNewUser = true;
    }
  }

  let code = "";
  let affiliateId = "";
  let insertError: string | null = null;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    code = randomFrom(CODE_ALPHABET, 8);
    const { data, error } = await supabase
      .from("affiliates")
      .insert({
        user_id: userId,
        code,
        display_name: displayName,
        email,
        phone,
        instagram,
        youtube,
        facebook,
        tiktok,
        website,
        notes,
        commission_percent: percent,
        commission_months: months,
        created_by: admin.id,
        must_change_password: createdNewUser,
      })
      .select("id")
      .single();
    if (!error && data) {
      affiliateId = data.id;
      insertError = null;
      break;
    }
    insertError = error?.message ?? "Could not save the affiliate.";
    if (!insertError.toLowerCase().includes("code")) break;
  }

  if (!affiliateId) {
    if (createdNewUser) await supabase.auth.admin.deleteUser(userId);
    return { error: insertError || "Could not save the affiliate." };
  }

  const link = affiliateLink(code);
  const sent = await sendAffiliateWelcomeEmail({
    to: email,
    name: displayName,
    password: createdNewUser ? password : null,
    referralLink: link,
  });
  if (!sent.ok) console.error("[affiliate-welcome] send failed:", sent.error);
  const emailSent = sent.ok;

  revalidatePath("/admin/affiliates");
  return {
    created: {
      id: affiliateId,
      email,
      password,
      code,
      link,
      existingAccount: !createdNewUser,
      emailSent,
    },
  };
}

async function findUserIdByEmail(
  supabase: ReturnType<typeof createServiceClient>,
  email: string
): Promise<string | null> {
  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("id")
    .ilike("email", email)
    .limit(1);
  if (error) throw new Error(error.message);
  return profiles?.[0]?.id ?? null;
}

async function findAuthUserIdByEmail(
  supabase: ReturnType<typeof createServiceClient>,
  email: string
): Promise<string | null> {
  for (let page = 1; page <= 20; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
    if (error || data.users.length === 0) return null;
    const match = data.users.find((user) => user.email?.toLowerCase() === email);
    if (match) return match.id;
    if (data.users.length < 200) return null;
  }
  return null;
}

export async function updateAffiliateAction(
  _prev: { error?: string; saved?: boolean },
  formData: FormData
): Promise<{ error?: string; saved?: boolean }> {
  const admin = await requireAdmin();
  if (!admin) return { error: "You need an admin account to edit affiliates." };

  const id = clean(formData.get("id"), 80);
  const displayName = clean(formData.get("display_name"), 80);
  const email = clean(formData.get("email"), 200).toLowerCase();
  const status = clean(formData.get("status"), 20);
  const percent = Number(formData.get("commission_percent"));
  const months = Number(formData.get("commission_months"));
  const password = clean(formData.get("password"), 72);

  if (!id) return { error: "Missing affiliate." };
  if (displayName.length < 1) return { error: "Enter the affiliate name." };
  if (!email.includes("@")) return { error: "Enter a valid email." };
  if (status !== "active" && status !== "paused") return { error: "Choose a status." };
  if (!Number.isFinite(percent) || percent < 0 || percent > 100) {
    return { error: "Commission must be between 0 and 100." };
  }
  if (!Number.isInteger(months) || months < 1 || months > 60) {
    return { error: "Commission length must be between 1 and 60 months." };
  }
  if (password && password.length < 8) return { error: "Password must be at least 8 characters." };

  const supabase = createServiceClient();
  const { data: existing, error: loadError } = await supabase
    .from("affiliates")
    .select("user_id, email")
    .eq("id", id)
    .maybeSingle();
  if (loadError || !existing) return { error: "Affiliate not found." };

  if (email !== existing.email || password) {
    const { error: authError } = await supabase.auth.admin.updateUserById(existing.user_id, {
      ...(email !== existing.email ? { email, email_confirm: true } : {}),
      ...(password ? { password } : {}),
    });
    if (authError) return { error: authError.message };
  }

  const { error } = await supabase
    .from("affiliates")
    .update({
      display_name: displayName,
      email,
      phone: optional(formData.get("phone"), 40),
      instagram: optional(formData.get("instagram"), 200),
      youtube: optional(formData.get("youtube"), 200),
      facebook: optional(formData.get("facebook"), 200),
      tiktok: optional(formData.get("tiktok"), 200),
      website: optional(formData.get("website"), 200),
      notes: optional(formData.get("notes"), 2000),
      status,
      commission_percent: percent,
      commission_months: months,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/admin/affiliates");
  revalidatePath(`/admin/affiliates/${id}`);
  return { saved: true };
}

export async function recordPayoutAction(
  _prev: { error?: string; saved?: boolean },
  formData: FormData
): Promise<{ error?: string; saved?: boolean }> {
  const admin = await requireAdmin();
  if (!admin) return { error: "You need an admin account to record payouts." };

  const id = clean(formData.get("id"), 80);
  const notes = optional(formData.get("notes"), 500);
  const period = optional(formData.get("period_label"), 80);
  if (!id) return { error: "Missing affiliate." };

  const supabase = createServiceClient();
  const { data: unpaid, error } = await supabase
    .from("affiliate_commissions")
    .select("id, commission_cents, currency")
    .eq("affiliate_id", id)
    .is("payout_id", null)
    .order("earned_at", { ascending: true });
  if (error) return { error: error.message };
  if (!unpaid || unpaid.length === 0) return { error: "There is no unpaid commission." };

  const currency = unpaid[0].currency || "eur";
  const rows = unpaid.filter((row) => row.currency === currency);
  const amount = rows.reduce((sum, row) => sum + row.commission_cents, 0);
  if (amount <= 0) return { error: "There is no unpaid commission." };

  const { data: payout, error: payoutError } = await supabase
    .from("affiliate_payouts")
    .insert({
      affiliate_id: id,
      amount_cents: amount,
      currency,
      status: "paid",
      period_label: period,
      notes,
      paid_at: new Date().toISOString(),
      created_by: admin.id,
    })
    .select("id")
    .single();
  if (payoutError || !payout) return { error: payoutError?.message || "Could not record the payout." };

  const { error: markError } = await supabase
    .from("affiliate_commissions")
    .update({ payout_id: payout.id })
    .in(
      "id",
      rows.map((row) => row.id)
    );
  if (markError) return { error: markError.message };

  revalidatePath(`/admin/affiliates/${id}`);
  revalidatePath("/admin/affiliates");
  return { saved: true };
}
