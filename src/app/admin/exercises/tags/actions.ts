"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { getIsAdmin } from "@/utils/supabase/is-admin";

const PATH = "/admin/exercises/tags";

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

export async function createExerciseTag(formData: FormData) {
  const title = (formData.get("title") as string)?.trim();
  if (!title) flashError("Title is required.");

  const supabase = await requireAdmin();

  const { error } = await supabase.from("exercise_tabs").insert({ title });

  if (error) flashError(error.message);

  revalidatePath(PATH);
  revalidatePath("/admin/exercises");
  redirect(`${PATH}?saved=1`);
}

export async function updateExerciseTag(formData: FormData) {
  const id = (formData.get("id") as string)?.trim();
  const title = (formData.get("title") as string)?.trim();
  if (!id) flashError("Missing tag id.");
  if (!title) flashError("Title is required.");

  const supabase = await requireAdmin();

  const { error } = await supabase.from("exercise_tabs").update({ title }).eq("id", id);

  if (error) flashError(error.message);

  revalidatePath(PATH);
  redirect(`${PATH}?saved=1`);
}

export async function deleteExerciseTag(formData: FormData) {
  const id = (formData.get("id") as string)?.trim();
  if (!id) flashError("Missing tag id.");

  const supabase = await requireAdmin();

  const { error } = await supabase.from("exercise_tabs").delete().eq("id", id);

  if (error) flashError(error.message);

  revalidatePath(PATH);
  redirect(`${PATH}?saved=1`);
}
