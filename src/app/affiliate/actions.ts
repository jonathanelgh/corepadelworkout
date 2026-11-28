"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { createServiceClient } from "@/utils/supabase/service";

export type AffiliateSettingsState = { error?: string; saved?: boolean };

function clean(value: FormDataEntryValue | null, max: number): string {
  return String(value ?? "").trim().slice(0, max);
}

export async function updateAffiliateSettings(
  _prev: AffiliateSettingsState,
  formData: FormData
): Promise<AffiliateSettingsState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sign in again." };

  const displayName = clean(formData.get("display_name"), 80);
  if (displayName.length < 1) return { error: "Enter your name." };

  const { error } = await supabase
    .from("affiliates")
    .update({
      display_name: displayName,
      phone: clean(formData.get("phone"), 40) || null,
      instagram: clean(formData.get("instagram"), 200) || null,
      youtube: clean(formData.get("youtube"), 200) || null,
      facebook: clean(formData.get("facebook"), 200) || null,
      tiktok: clean(formData.get("tiktok"), 200) || null,
      website: clean(formData.get("website"), 200) || null,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", user.id);
  if (error) return { error: error.message };

  revalidatePath("/affiliate");
  revalidatePath("/affiliate/settings");
  return { saved: true };
}

export async function changeAffiliatePassword(
  _prev: { error?: string; saved?: boolean },
  formData: FormData
): Promise<{ error?: string; saved?: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sign in again." };

  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm_password") ?? "");
  if (password.length < 8 || password.length > 72) {
    return { error: "Use a password between 8 and 72 characters." };
  }
  if (password !== confirm) return { error: "Passwords do not match." };

  const service = createServiceClient();
  const { data: affiliate, error: lookupError } = await service
    .from("affiliates")
    .select("id, must_change_password")
    .eq("user_id", user.id)
    .maybeSingle();
  if (lookupError) return { error: lookupError.message };
  if (!affiliate?.must_change_password) return { error: "Your password is already set." };

  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: error.message };

  const { error: updateError } = await service
    .from("affiliates")
    .update({ must_change_password: false, updated_at: new Date().toISOString() })
    .eq("id", affiliate.id);
  if (updateError) return { error: updateError.message };

  revalidatePath("/affiliate");
  return { saved: true };
}
