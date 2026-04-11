"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { getIsAdmin } from "@/utils/supabase/is-admin";

const PATH = "/admin/exercises/taxonomy";
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

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

function parseNameSlug(formData: FormData): { name: string; slug: string } {
  const name = (formData.get("name") as string)?.trim();
  let slug = (formData.get("slug") as string)?.trim().toLowerCase() ?? "";
  if (!name) flashError("Name is required.");
  if (!slug) {
    slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }
  if (!slug || !SLUG_PATTERN.test(slug)) {
    flashError(
      "Slug must be lowercase letters, numbers, and single hyphens between words (e.g. shoulder-stability)."
    );
  }
  return { name, slug };
}

function revalidateExercisePaths() {
  revalidatePath(PATH);
  revalidatePath("/admin/exercises");
  revalidatePath("/admin/exercises/new");
}

/* ——— exercise_category_types ——— */

export async function createCategoryType(formData: FormData) {
  const { name, slug } = parseNameSlug(formData);
  const supabase = await requireAdmin();
  const { error } = await supabase.from("exercise_category_types").insert({ name, slug });
  if (error) flashError(error.message);
  revalidateExercisePaths();
  redirect(`${PATH}?saved=1`);
}

export async function updateCategoryType(formData: FormData) {
  const id = (formData.get("id") as string)?.trim();
  if (!id) flashError("Missing id.");
  const { name, slug } = parseNameSlug(formData);
  const supabase = await requireAdmin();
  const { error } = await supabase.from("exercise_category_types").update({ name, slug }).eq("id", id);
  if (error) flashError(error.message);
  revalidateExercisePaths();
  redirect(`${PATH}?saved=1`);
}

export async function deleteCategoryType(formData: FormData) {
  const id = (formData.get("id") as string)?.trim();
  if (!id) flashError("Missing id.");
  const supabase = await requireAdmin();
  const { error } = await supabase.from("exercise_category_types").delete().eq("id", id);
  if (error) flashError(error.message);
  revalidateExercisePaths();
  redirect(`${PATH}?saved=1`);
}

/* ——— movement_patterns ——— */

export async function createMovementPattern(formData: FormData) {
  const { name, slug } = parseNameSlug(formData);
  const supabase = await requireAdmin();
  const { error } = await supabase.from("movement_patterns").insert({ name, slug });
  if (error) flashError(error.message);
  revalidateExercisePaths();
  redirect(`${PATH}?saved=1`);
}

export async function updateMovementPattern(formData: FormData) {
  const id = (formData.get("id") as string)?.trim();
  if (!id) flashError("Missing id.");
  const { name, slug } = parseNameSlug(formData);
  const supabase = await requireAdmin();
  const { error } = await supabase.from("movement_patterns").update({ name, slug }).eq("id", id);
  if (error) flashError(error.message);
  revalidateExercisePaths();
  redirect(`${PATH}?saved=1`);
}

export async function deleteMovementPattern(formData: FormData) {
  const id = (formData.get("id") as string)?.trim();
  if (!id) flashError("Missing id.");
  const supabase = await requireAdmin();
  const { error } = await supabase.from("movement_patterns").delete().eq("id", id);
  if (error) flashError(error.message);
  revalidateExercisePaths();
  redirect(`${PATH}?saved=1`);
}

/* ——— body_regions ——— */

export async function createBodyRegion(formData: FormData) {
  const { name, slug } = parseNameSlug(formData);
  const supabase = await requireAdmin();
  const { error } = await supabase.from("body_regions").insert({ name, slug });
  if (error) flashError(error.message);
  revalidateExercisePaths();
  redirect(`${PATH}?saved=1`);
}

export async function updateBodyRegion(formData: FormData) {
  const id = (formData.get("id") as string)?.trim();
  if (!id) flashError("Missing id.");
  const { name, slug } = parseNameSlug(formData);
  const supabase = await requireAdmin();
  const { error } = await supabase.from("body_regions").update({ name, slug }).eq("id", id);
  if (error) flashError(error.message);
  revalidateExercisePaths();
  redirect(`${PATH}?saved=1`);
}

export async function deleteBodyRegion(formData: FormData) {
  const id = (formData.get("id") as string)?.trim();
  if (!id) flashError("Missing id.");
  const supabase = await requireAdmin();
  const { error } = await supabase.from("body_regions").delete().eq("id", id);
  if (error) flashError(error.message);
  revalidateExercisePaths();
  redirect(`${PATH}?saved=1`);
}
