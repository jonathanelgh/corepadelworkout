"use server";

import { createClient } from "@/utils/supabase/server";
import { getIsAdmin } from "@/utils/supabase/is-admin";
import { revalidatePath } from "next/cache";

export type CreateExerciseResult = { ok: true } | { error: string };

export async function createExercise(formData: FormData): Promise<CreateExerciseResult> {
  const title = (formData.get("title") as string)?.trim();
  const description = (formData.get("description") as string)?.trim() || null;
  const how_to = (formData.get("how_to") as string)?.trim() || null;
  const video_url = (formData.get("video_url") as string)?.trim() || null;
  const image_url = (formData.get("image_url") as string)?.trim() || null;
  const location_id = formData.get("location_id") as string;

  if (!title) {
    return { error: "Title is required." };
  }
  if (!location_id) {
    return { error: "Location is required." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "You must be signed in (open /login)." };
  }

  const isAdmin = await getIsAdmin(supabase);
  if (!isAdmin) {
    return {
      error:
        "Not authorized: add your auth user id to public.admin_users in Supabase, then try again.",
    };
  }

  const { error } = await supabase.from("exercises").insert({
    title,
    description,
    how_to,
    video_url,
    image_url,
    location_id,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin/exercises");
  return { ok: true };
}
