"use server";

import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabase/server";
import { getIsAdmin } from "@/utils/supabase/is-admin";
import { revalidatePath } from "next/cache";

export type CreateExerciseResult = { ok: true } | { error: string };

function parseUuidList(formData: FormData, key: string): string[] {
  const out: string[] = [];
  for (const x of formData.getAll(key)) {
    if (typeof x === "string" && x.trim().length > 0) out.push(x.trim());
  }
  return [...new Set(out)];
}

async function replaceExerciseEquipment(
  supabase: SupabaseClient,
  exerciseId: string,
  equipmentIds: string[]
): Promise<void> {
  const { error: delErr } = await supabase.from("exercise_equipment").delete().eq("exercise_id", exerciseId);
  if (delErr) throw new Error(delErr.message);
  if (equipmentIds.length === 0) return;
  const rows = equipmentIds.map((equipment_id, sort_order) => ({
    exercise_id: exerciseId,
    equipment_id,
    sort_order,
  }));
  const { error: insErr } = await supabase.from("exercise_equipment").insert(rows);
  if (insErr) throw new Error(insErr.message);
}

async function replaceExerciseTabLinks(
  supabase: SupabaseClient,
  exerciseId: string,
  tabIds: string[]
): Promise<void> {
  const { error: delErr } = await supabase.from("exercise_tab_links").delete().eq("exercise_id", exerciseId);
  if (delErr) throw new Error(delErr.message);
  if (tabIds.length === 0) return;
  const rows = tabIds.map((exercise_tab_id, sort_order) => ({
    exercise_id: exerciseId,
    exercise_tab_id,
    sort_order,
  }));
  const { error: insErr } = await supabase.from("exercise_tab_links").insert(rows);
  if (insErr) throw new Error(insErr.message);
}

export async function createExercise(formData: FormData): Promise<CreateExerciseResult> {
  const title = (formData.get("title") as string)?.trim();
  const description = (formData.get("description") as string)?.trim() || null;
  const how_to = (formData.get("how_to") as string)?.trim() || null;
  const video_url = (formData.get("video_url") as string)?.trim() || null;
  const image_url = (formData.get("image_url") as string)?.trim() || null;
  const location_id = formData.get("location_id") as string;
  const equipmentIds = parseUuidList(formData, "equipment_ids");
  const tabIds = parseUuidList(formData, "exercise_tab_ids");

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

  const { data: row, error: insertError } = await supabase
    .from("exercises")
    .insert({
      title,
      description,
      how_to,
      video_url,
      image_url,
      location_id,
    })
    .select("id")
    .single();

  if (insertError || !row) {
    return { error: insertError?.message ?? "Could not create exercise." };
  }

  try {
    await replaceExerciseEquipment(supabase, row.id, equipmentIds);
    await replaceExerciseTabLinks(supabase, row.id, tabIds);
  } catch (e) {
    await supabase.from("exercises").delete().eq("id", row.id);
    return { error: e instanceof Error ? e.message : "Could not save equipment or tags." };
  }

  revalidatePath("/admin/exercises");
  return { ok: true };
}

export async function updateExercise(formData: FormData): Promise<CreateExerciseResult> {
  const id = (formData.get("id") as string)?.trim();
  const title = (formData.get("title") as string)?.trim();
  const description = (formData.get("description") as string)?.trim() || null;
  const how_to = (formData.get("how_to") as string)?.trim() || null;
  const video_url = (formData.get("video_url") as string)?.trim() || null;
  const image_url = (formData.get("image_url") as string)?.trim() || null;
  const location_id = formData.get("location_id") as string;

  if (!id) {
    return { error: "Missing exercise id." };
  }
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

  const equipmentIds = parseUuidList(formData, "equipment_ids");
  const tabIds = parseUuidList(formData, "exercise_tab_ids");

  const { error } = await supabase
    .from("exercises")
    .update({
      title,
      description,
      how_to,
      video_url,
      image_url,
      location_id,
    })
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  try {
    await replaceExerciseEquipment(supabase, id, equipmentIds);
    await replaceExerciseTabLinks(supabase, id, tabIds);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Could not save equipment or tags." };
  }

  revalidatePath("/admin/exercises");
  return { ok: true };
}
