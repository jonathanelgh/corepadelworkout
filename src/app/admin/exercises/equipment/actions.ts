"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabase/server";
import { getIsAdmin } from "@/utils/supabase/is-admin";
import { STORAGE_BUCKETS } from "@/utils/supabase/storage";

const PATH = "/admin/exercises/equipment";

function flashError(msg: string): never {
  redirect(`${PATH}?error=${encodeURIComponent(msg)}`);
}

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) flashError("You must be signed in.");
  if (!(await getIsAdmin(supabase))) {
    flashError("Not authorized: add your user to public.admin_users in Supabase.");
  }
  return supabase;
}

function extFromImageFile(file: File): string {
  const n = file.name.split(".").pop();
  if (n && n.length <= 5) return n.toLowerCase();
  if (file.type === "image/jpeg") return "jpg";
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";
  if (file.type === "image/gif") return "gif";
  return "jpg";
}

async function uploadEquipmentPhoto(
  supabase: SupabaseClient,
  file: File
): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Please choose an image file.");
  }
  const maxBytes = 5 * 1024 * 1024;
  if (file.size > maxBytes) {
    throw new Error("Image must be 5 MB or smaller.");
  }
  const folder = crypto.randomUUID();
  const ext = extFromImageFile(file);
  const path = `${folder}/photo.${ext}`;
  const { error: upErr } = await supabase.storage.from(STORAGE_BUCKETS.equipment).upload(path, file, {
    upsert: false,
  });
  if (upErr) throw new Error(upErr.message);
  const { data } = supabase.storage.from(STORAGE_BUCKETS.equipment).getPublicUrl(path);
  return data.publicUrl;
}

export async function createEquipment(formData: FormData) {
  const title = (formData.get("title") as string)?.trim();
  const description = (formData.get("description") as string)?.trim() || null;

  if (!title) flashError("Title is required.");

  const supabase = await requireAdmin();

  let image_url: string | null = null;
  const photo = formData.get("photo");
  if (photo instanceof File && photo.size > 0) {
    try {
      image_url = await uploadEquipmentPhoto(supabase, photo);
    } catch (e) {
      flashError(e instanceof Error ? e.message : "Could not upload image.");
    }
  }

  const { error } = await supabase.from("equipment").insert({
    title,
    description,
    image_url,
  });

  if (error) flashError(error.message);

  revalidatePath(PATH);
  revalidatePath("/admin/exercises");
  redirect(`${PATH}?saved=1`);
}

export async function updateEquipment(formData: FormData) {
  const id = (formData.get("id") as string)?.trim();
  const title = (formData.get("title") as string)?.trim();
  const description = (formData.get("description") as string)?.trim() || null;
  let image_url =
    ((formData.get("image_url") as string) ?? "").trim().length > 0
      ? ((formData.get("image_url") as string) ?? "").trim()
      : null;

  if (!id) flashError("Missing equipment id.");
  if (!title) flashError("Title is required.");

  const supabase = await requireAdmin();

  const photo = formData.get("photo");
  if (photo instanceof File && photo.size > 0) {
    try {
      image_url = await uploadEquipmentPhoto(supabase, photo);
    } catch (e) {
      flashError(e instanceof Error ? e.message : "Could not upload image.");
    }
  }

  const { error } = await supabase
    .from("equipment")
    .update({
      title,
      description,
      image_url,
    })
    .eq("id", id);

  if (error) flashError(error.message);

  revalidatePath(PATH);
  revalidatePath("/admin/exercises");
  redirect(`${PATH}?saved=1`);
}

export async function deleteEquipment(formData: FormData) {
  const id = (formData.get("id") as string)?.trim();
  if (!id) flashError("Missing equipment id.");

  const supabase = await requireAdmin();

  const { error } = await supabase.from("equipment").delete().eq("id", id);

  if (error) flashError(error.message);

  revalidatePath(PATH);
  redirect(`${PATH}?saved=1`);
}
