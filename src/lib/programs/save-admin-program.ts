import type { SupabaseClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import {
  insertProgramCurriculum,
  type TrackPayload,
} from "@/lib/programs/program-curriculum";
import { parseProgramFormat, type ProgramFormat } from "@/lib/programs/program-format";

export type AdminProgramSaveFields = {
  title: string;
  description: string | null;
  body: string | null;
  category_ids: string[];
  difficulty_level_id: string | null;
  status: "draft" | "published";
  cover_image_url: string | null;
  promo_video_url: string | null;
  song_url: string | null;
  is_free: boolean;
  program_format: ProgramFormat;
  duration_weeks: number | null;
  sessions_per_week: number | null;
  minutes_per_session: number | null;
};

export type AdminProgramSaveInput = {
  programId?: string | null;
  fields: AdminProgramSaveFields;
  tracks: TrackPayload[];
  outcomes: string[];
};

export type AdminProgramSaveResult =
  | { ok: true; programId: string; slug: string }
  | { error: string };

function slugifyTitle(title: string): string {
  const s = title
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-+/g, "-");
  return s.length > 0 ? s : "program";
}

async function uniqueProgramSlug(supabase: SupabaseClient, base: string): Promise<string> {
  let slug = base;
  let n = 0;
  for (;;) {
    const { data } = await supabase.from("programs").select("id").eq("slug", slug).maybeSingle();
    if (!data) return slug;
    n += 1;
    slug = `${base}-${n}`;
  }
}

async function syncProgramCategories(
  supabase: SupabaseClient,
  programId: string,
  categoryIds: string[]
): Promise<void> {
  const { error: delErr } = await supabase.from("program_categories").delete().eq("program_id", programId);
  if (delErr) throw new Error(delErr.message);
  if (categoryIds.length === 0) return;
  const rows = categoryIds.map((category_id, i) => ({
    program_id: programId,
    category_id,
    sort_order: i,
  }));
  const { error: insErr } = await supabase.from("program_categories").insert(rows);
  if (insErr) throw new Error(insErr.message);
}

function revalidateProgramPaths(slug: string) {
  try {
    revalidatePath("/admin/programs");
    revalidatePath("/programs");
    revalidatePath(`/programs/${slug}`);
    revalidatePath(`/admin/programs`);
  } catch (e) {
    console.warn("[save-admin-program] revalidate failed:", e);
  }
}

export function normalizeAdminProgramFields(raw: {
  title?: unknown;
  description?: unknown;
  body?: unknown;
  category_ids?: unknown;
  difficulty_level_id?: unknown;
  status?: unknown;
  cover_image_url?: unknown;
  promo_video_url?: unknown;
  song_url?: unknown;
  is_free?: unknown;
  program_format?: unknown;
  duration_weeks?: unknown;
  sessions_per_week?: unknown;
  minutes_per_session?: unknown;
}): AdminProgramSaveFields | { error: string } {
  const title = typeof raw.title === "string" ? raw.title.trim() : "";
  if (!title) return { error: "Program title is required." };

  const parseNullableInt = (v: unknown): number | null => {
    if (typeof v === "number" && Number.isFinite(v) && v >= 0) return Math.floor(v);
    if (typeof v === "string" && v.trim() !== "") {
      const n = Number.parseInt(v.trim(), 10);
      if (Number.isFinite(n) && n >= 0) return n;
    }
    return null;
  };

  const program_format = parseProgramFormat(raw.program_format);
  const category_ids = Array.isArray(raw.category_ids)
    ? [...new Set(raw.category_ids.filter((x): x is string => typeof x === "string" && x.trim().length > 0))]
    : [];

  return {
    title,
    description: typeof raw.description === "string" && raw.description.trim() ? raw.description.trim() : null,
    body: typeof raw.body === "string" && raw.body.trim() ? raw.body.trim() : null,
    category_ids,
    difficulty_level_id:
      typeof raw.difficulty_level_id === "string" && raw.difficulty_level_id.trim()
        ? raw.difficulty_level_id.trim()
        : null,
    status: raw.status === "published" ? "published" : "draft",
    cover_image_url:
      typeof raw.cover_image_url === "string" && raw.cover_image_url.trim()
        ? raw.cover_image_url.trim()
        : null,
    promo_video_url:
      typeof raw.promo_video_url === "string" && raw.promo_video_url.trim()
        ? raw.promo_video_url.trim()
        : null,
    song_url: typeof raw.song_url === "string" && raw.song_url.trim() ? raw.song_url.trim() : null,
    is_free: raw.is_free === true || raw.is_free === "1" || raw.is_free === "on",
    program_format,
    duration_weeks: program_format === "single_workout" ? null : parseNullableInt(raw.duration_weeks),
    sessions_per_week:
      program_format === "single_workout" ? null : parseNullableInt(raw.sessions_per_week),
    minutes_per_session: parseNullableInt(raw.minutes_per_session),
  };
}

export async function saveAdminProgram(
  supabase: SupabaseClient,
  input: AdminProgramSaveInput
): Promise<AdminProgramSaveResult> {
  const { fields, tracks, outcomes } = input;
  const programId = input.programId?.trim() || null;

  const programRow = {
    title: fields.title,
    description: fields.description,
    body: fields.body,
    difficulty_level_id: fields.difficulty_level_id,
    status: fields.status,
    cover_image_url: fields.cover_image_url,
    promo_video_url: fields.promo_video_url,
    song_url: fields.song_url,
    price: null,
    compare_at_price: null,
    is_free: fields.is_free,
    program_format: fields.program_format,
    duration_weeks: fields.duration_weeks,
    sessions_per_week: fields.sessions_per_week,
    minutes_per_session: fields.minutes_per_session,
    outcomes,
  };

  if (programId) {
    const { data: existing, error: exErr } = await supabase
      .from("programs")
      .select("id, slug")
      .eq("id", programId)
      .maybeSingle();

    if (exErr || !existing) {
      return { error: exErr?.message ?? "Program not found." };
    }

    const { error: updateErr } = await supabase.from("programs").update(programRow).eq("id", programId);
    if (updateErr) return { error: updateErr.message };

    try {
      await syncProgramCategories(supabase, programId, fields.category_ids);
    } catch (e) {
      return { error: e instanceof Error ? e.message : "Could not save categories." };
    }

    const { error: delErr } = await supabase
      .from("program_location_tracks")
      .delete()
      .eq("program_id", programId);
    if (delErr) return { error: delErr.message };

    try {
      await insertProgramCurriculum(supabase, programId, tracks, {
        programFormat: fields.program_format,
        sessionsPerWeek: fields.sessions_per_week,
      });
    } catch (e) {
      return { error: e instanceof Error ? e.message : "Could not save curriculum." };
    }

    revalidateProgramPaths(existing.slug);
    return { ok: true, programId, slug: existing.slug };
  }

  const slug = await uniqueProgramSlug(supabase, slugifyTitle(fields.title));
  const { data: program, error: insertError } = await supabase
    .from("programs")
    .insert({ ...programRow, slug })
    .select("id, slug")
    .single();

  if (insertError || !program) {
    return { error: insertError?.message ?? "Could not create program." };
  }

  try {
    await syncProgramCategories(supabase, program.id, fields.category_ids);
    await insertProgramCurriculum(supabase, program.id, tracks, {
      programFormat: fields.program_format,
      sessionsPerWeek: fields.sessions_per_week,
    });
  } catch (e) {
    await supabase.from("programs").delete().eq("id", program.id);
    return { error: e instanceof Error ? e.message : "Could not save curriculum." };
  }

  revalidateProgramPaths(program.slug);
  return { ok: true, programId: program.id, slug: program.slug };
}
