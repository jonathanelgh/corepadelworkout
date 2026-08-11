"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { getIsAdmin } from "@/utils/supabase/is-admin";

const PATH = "/admin/programs/categories";
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

function parseCategoryFields(formData: FormData): {
  name: string;
  slug: string;
  description: string | null;
  sortOrder: number;
} {
  const name = (formData.get("name") as string)?.trim();
  let slug = (formData.get("slug") as string)?.trim().toLowerCase() ?? "";
  const descriptionRaw = (formData.get("description") as string)?.trim() ?? "";
  const sortRaw = (formData.get("sort_order") as string)?.trim() ?? "0";

  if (!name) flashError("Name is required.");
  if (!slug) {
    slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }
  if (!slug || !SLUG_PATTERN.test(slug)) {
    flashError(
      "Slug must be lowercase letters, numbers, and single hyphens between words (e.g. warm-up)."
    );
  }

  const sortOrder = Number.parseInt(sortRaw, 10);
  if (!Number.isFinite(sortOrder)) {
    flashError("Sort order must be a number.");
  }

  return {
    name,
    slug,
    description: descriptionRaw.length > 0 ? descriptionRaw : null,
    sortOrder,
  };
}

function revalidateCategoryPaths() {
  revalidatePath(PATH);
  revalidatePath("/admin/programs");
  revalidatePath("/admin/programs/new");
  revalidatePath("/programs");
  revalidatePath("/member");
}

export async function createProgramCategory(formData: FormData) {
  const fields = parseCategoryFields(formData);
  const supabase = await requireAdmin();
  const { error } = await supabase.from("categories").insert({
    name: fields.name,
    slug: fields.slug,
    description: fields.description,
    sort_order: fields.sortOrder,
  });
  if (error) flashError(error.message);
  revalidateCategoryPaths();
  redirect(`${PATH}?saved=1`);
}

export async function updateProgramCategory(formData: FormData) {
  const id = (formData.get("id") as string)?.trim();
  if (!id) flashError("Missing id.");
  const fields = parseCategoryFields(formData);
  const supabase = await requireAdmin();
  const { error } = await supabase
    .from("categories")
    .update({
      name: fields.name,
      slug: fields.slug,
      description: fields.description,
      sort_order: fields.sortOrder,
    })
    .eq("id", id);
  if (error) flashError(error.message);
  revalidateCategoryPaths();
  redirect(`${PATH}?saved=1`);
}

export async function deleteProgramCategory(formData: FormData) {
  const id = (formData.get("id") as string)?.trim();
  if (!id) flashError("Missing id.");
  const supabase = await requireAdmin();
  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) flashError(error.message);
  revalidateCategoryPaths();
  redirect(`${PATH}?saved=1`);
}
