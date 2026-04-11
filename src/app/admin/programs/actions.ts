"use server";

import { createClient } from "@/utils/supabase/server";
import { getIsAdmin } from "@/utils/supabase/is-admin";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const ADMIN_PROGRAMS_PATH = "/admin/programs";

function redirectProgramsError(msg: string): never {
  redirect(`${ADMIN_PROGRAMS_PATH}?error=${encodeURIComponent(msg)}`);
}

export type CreateProgramResult = { ok: true } | { error: string };

/** Resolved after optional file upload; passed separately so server actions do not lose values to FormData duplicate-key behavior. */
export type ProgramMediaUrls = {
  cover_image_url: string;
  promo_video_url: string;
  song_url: string;
};

type ProgramExercisePayload = {
  exercise_id: string;
  duration_minutes: number | null;
  sets: number | null;
  reps: number | null;
  rest_after_seconds: number | null;
};

type SessionPayload = {
  name: string;
  description: string | null;
  duration_minutes: number | null;
  exercises: ProgramExercisePayload[];
};

type TrackPayload = {
  location_id: string;
  sessions: SessionPayload[];
};

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

async function uniqueProgramSlug(
  supabase: Awaited<ReturnType<typeof createClient>>,
  base: string
): Promise<string> {
  let slug = base;
  let n = 0;
  for (;;) {
    const { data } = await supabase.from("programs").select("id").eq("slug", slug).maybeSingle();
    if (!data) return slug;
    n += 1;
    slug = `${base}-${n}`;
  }
}

function parseOptionalNumber(raw: FormDataEntryValue | null): number | null {
  if (raw == null || raw === "") return null;
  const n = Number.parseFloat(String(raw));
  return Number.isFinite(n) ? n : null;
}

/** Non-negative integer for optional schedule fields; empty or invalid → null. */
function parseOptionalNonNegInt(raw: FormDataEntryValue | null): number | null {
  if (raw == null || raw === "") return null;
  const n = Number.parseInt(String(raw).trim(), 10);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

function parseOptionalNonNegIntField(raw: unknown): number | null {
  if (typeof raw === "number" && Number.isFinite(raw) && raw >= 0) return Math.floor(raw);
  if (typeof raw === "string" && raw.trim() !== "") {
    const n = Number.parseInt(raw.trim(), 10);
    if (Number.isFinite(n) && n >= 0) return n;
  }
  return null;
}

function parseOneProgramExercise(row: Record<string, unknown>): ProgramExercisePayload | null {
  const exercise_id_raw = row.exercise_id ?? row.exerciseId;
  const exercise_id =
    typeof exercise_id_raw === "string" && exercise_id_raw.length > 0 ? exercise_id_raw : "";
  if (!exercise_id) return null;
  const duration_minutes = parseOptionalNonNegIntField(
    row.duration_minutes ?? row.durationMinutes
  );
  const sets = parseOptionalNonNegIntField(row.sets);
  const reps = parseOptionalNonNegIntField(row.reps);
  const rest_after_seconds = parseOptionalNonNegIntField(
    row.rest_after_seconds ?? row.restAfterSeconds ?? row.pause_seconds
  );
  return { exercise_id, duration_minutes, sets, reps, rest_after_seconds };
}

function parseOneSession(o: Record<string, unknown>): SessionPayload {
  const name = typeof o.name === "string" ? o.name : "";
  const descRaw = o.description;
  const description =
    typeof descRaw === "string" && descRaw.trim().length > 0 ? descRaw.trim() : null;
  let duration_minutes: number | null = null;
  const durRaw = o.duration_minutes;
  if (typeof durRaw === "number" && Number.isFinite(durRaw) && durRaw >= 0) {
    duration_minutes = Math.floor(durRaw);
  } else if (typeof durRaw === "string" && durRaw.trim() !== "") {
    const n = Number.parseInt(durRaw, 10);
    if (Number.isFinite(n) && n >= 0) duration_minutes = n;
  }
  const exercises: ProgramExercisePayload[] = [];
  const exRaw = o.exercises;
  if (Array.isArray(exRaw)) {
    for (const item of exRaw) {
      if (item != null && typeof item === "object") {
        const pe = parseOneProgramExercise(item as Record<string, unknown>);
        if (pe) exercises.push(pe);
      }
    }
  }
  if (exercises.length === 0) {
    const idsRaw = o.exercise_ids;
    if (Array.isArray(idsRaw)) {
      for (const x of idsRaw) {
        if (typeof x === "string" && x.length > 0) {
          exercises.push({
            exercise_id: x,
            duration_minutes: null,
            sets: null,
            reps: null,
            rest_after_seconds: null,
          });
        }
      }
    }
  }
  return { name, description, duration_minutes, exercises };
}

function parseCurriculumJson(raw: FormDataEntryValue | null): TrackPayload[] | { error: string } {
  if (raw == null || raw === "") return [];
  if (typeof raw !== "string") return { error: "Invalid curriculum data." };
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return { error: "Curriculum must be a JSON array." };
    const out: TrackPayload[] = [];
    for (const item of parsed) {
      if (item == null || typeof item !== "object") continue;
      const o = item as Record<string, unknown>;
      const locRaw = o.location_id;
      if (typeof locRaw !== "string" || locRaw.length === 0) {
        return { error: "Each workout location must have a location selected." };
      }
      const sessionsRaw = o.sessions;
      const sessions: SessionPayload[] = [];
      if (Array.isArray(sessionsRaw)) {
        for (const s of sessionsRaw) {
          if (s != null && typeof s === "object") {
            sessions.push(parseOneSession(s as Record<string, unknown>));
          }
        }
      }
      out.push({ location_id: locRaw, sessions });
    }
    const seen = new Set<string>();
    for (const t of out) {
      if (seen.has(t.location_id)) {
        return { error: "Each location can only appear once per program." };
      }
      seen.add(t.location_id);
    }
    return out;
  } catch {
    return { error: "Invalid curriculum JSON." };
  }
}

function parseOutcomesJson(raw: FormDataEntryValue | null): string[] | { error: string } {
  if (raw == null || raw === "") return [];
  if (typeof raw !== "string") return { error: "Invalid outcomes data." };
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return { error: "Outcomes must be a JSON array." };
    const out: string[] = [];
    for (const x of parsed) {
      if (typeof x !== "string") continue;
      const t = x.trim();
      if (t.length > 0) out.push(t);
    }
    if (out.length > 50) return { error: "At most 50 outcome lines are allowed." };
    for (const s of out) {
      if (s.length > 500) return { error: "Each outcome line must be at most 500 characters." };
    }
    return out;
  } catch {
    return { error: "Invalid outcomes JSON." };
  }
}

export async function createProgram(
  formData: FormData,
  mediaUrls: ProgramMediaUrls
): Promise<CreateProgramResult> {
  const curriculumParsed = parseCurriculumJson(formData.get("curriculum_json"));
  if ("error" in curriculumParsed) {
    return { error: curriculumParsed.error };
  }
  const tracks = curriculumParsed;

  const outcomesParsed = parseOutcomesJson(formData.get("outcomes_json"));
  if ("error" in outcomesParsed) {
    return { error: outcomesParsed.error };
  }
  const outcomes = outcomesParsed;

  const fields = parseProgramFields(formData, mediaUrls);
  if ("error" in fields) {
    return { error: fields.error };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "You must be signed in (open /login)." };
  }
  if (!(await getIsAdmin(supabase))) {
    return {
      error: "Not authorized: add your auth user id to public.admin_users in Supabase, then try again.",
    };
  }

  const slug = await uniqueProgramSlug(supabase, slugifyTitle(fields.title));

  const { data: program, error: insertError } = await supabase
    .from("programs")
    .insert({
      title: fields.title,
      slug,
      description: fields.description,
      body: fields.body,
      difficulty_level_id: fields.difficulty_level_id,
      status: fields.status,
      cover_image_url: fields.cover_image_url,
      promo_video_url: fields.promo_video_url,
      song_url: fields.song_url,
      price: fields.price,
      compare_at_price: fields.compare_at_price,
      duration_weeks: fields.duration_weeks,
      sessions_per_week: fields.sessions_per_week,
      minutes_per_session: fields.minutes_per_session,
      outcomes,
    })
    .select("id")
    .single();

  if (insertError || !program) {
    return { error: insertError?.message ?? "Could not create program." };
  }

  try {
    await syncProgramCategories(supabase, program.id, fields.category_ids);
    await insertCurriculumForProgram(supabase, program.id, tracks);
  } catch (e) {
    await supabase.from("programs").delete().eq("id", program.id);
    return { error: e instanceof Error ? e.message : "Could not save curriculum." };
  }

  revalidatePath("/admin/programs");
  revalidatePath("/programs");
  return { ok: true };
}

async function syncProgramCategories(
  supabase: Awaited<ReturnType<typeof createClient>>,
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

async function insertCurriculumForProgram(
  supabase: Awaited<ReturnType<typeof createClient>>,
  programId: string,
  tracks: TrackPayload[]
): Promise<void> {
  for (let ti = 0; ti < tracks.length; ti++) {
    const tr = tracks[ti];
    const { data: trackRow, error: tErr } = await supabase
      .from("program_location_tracks")
      .insert({
        program_id: programId,
        location_id: tr.location_id,
        sort_order: ti,
      })
      .select("id")
      .single();

    if (tErr || !trackRow) {
      throw new Error(tErr?.message ?? "Could not create location track.");
    }

    for (let si = 0; si < tr.sessions.length; si++) {
      const s = tr.sessions[si];
      const label = s.name.trim() || `Session ${si + 1}`;
      const { data: sessionRow, error: sErr } = await supabase
        .from("program_sessions")
        .insert({
          track_id: trackRow.id,
          name: label,
          description: s.description,
          duration_minutes: s.duration_minutes,
          sort_order: si,
        })
        .select("id")
        .single();

      if (sErr || !sessionRow) {
        throw new Error(sErr?.message ?? "Could not create session.");
      }

      if (s.exercises.length > 0) {
        const rows = s.exercises.map((ex, j) => ({
          session_id: sessionRow.id,
          exercise_id: ex.exercise_id,
          sort_order: j,
          duration_minutes: ex.duration_minutes,
          sets: ex.sets,
          reps: ex.reps,
          rest_after_seconds: ex.rest_after_seconds,
        }));
        const { error: peError } = await supabase.from("program_exercises").insert(rows);
        if (peError) throw new Error(peError.message);
      }
    }
  }
}

function parseCategoryIds(formData: FormData): string[] {
  const raw = formData.getAll("category_ids");
  const ids: string[] = [];
  for (const x of raw) {
    if (typeof x === "string" && x.trim().length > 0) ids.push(x.trim());
  }
  return [...new Set(ids)];
}

function parseProgramFields(
  formData: FormData,
  mediaUrls: ProgramMediaUrls
): {
  title: string;
  description: string | null;
  body: string | null;
  category_ids: string[];
  difficulty_level_id: string | null;
  status: "draft" | "published";
  cover_image_url: string | null;
  promo_video_url: string | null;
  song_url: string | null;
  price: number | null;
  compare_at_price: number | null;
  duration_weeks: number | null;
  sessions_per_week: number | null;
  minutes_per_session: number | null;
} | { error: string } {
  const title = (formData.get("title") as string)?.trim();
  const description = (formData.get("description") as string)?.trim() || null;
  const body = (formData.get("body") as string)?.trim() || null;
  const difficultyRaw = formData.get("difficulty_level_id") as string | null;
  const status = formData.get("status") === "published" ? "published" : "draft";
  const cover_image_url = mediaUrls.cover_image_url.trim() || null;
  const promo_video_url = mediaUrls.promo_video_url.trim() || null;
  const song_url = mediaUrls.song_url.trim() || null;
  const price = parseOptionalNumber(formData.get("price"));
  const compare_at_price = parseOptionalNumber(formData.get("compare_at_price"));
  const duration_weeks = parseOptionalNonNegInt(formData.get("duration_weeks"));
  const sessions_per_week = parseOptionalNonNegInt(formData.get("sessions_per_week"));
  const minutes_per_session = parseOptionalNonNegInt(formData.get("minutes_per_session"));

  const category_ids = parseCategoryIds(formData);
  const difficulty_level_id = difficultyRaw && difficultyRaw.length > 0 ? difficultyRaw : null;

  if (!title) {
    return { error: "Program title is required." };
  }

  return {
    title,
    description,
    body,
    category_ids,
    difficulty_level_id,
    status,
    cover_image_url,
    promo_video_url,
    song_url,
    price,
    compare_at_price,
    duration_weeks,
    sessions_per_week,
    minutes_per_session,
  };
}

export async function updateProgram(
  formData: FormData,
  mediaUrls: ProgramMediaUrls
): Promise<CreateProgramResult> {
  const programId = (formData.get("program_id") as string)?.trim();
  if (!programId) {
    return { error: "Missing program id." };
  }

  const fields = parseProgramFields(formData, mediaUrls);
  if ("error" in fields) {
    return { error: fields.error };
  }

  const curriculumParsed = parseCurriculumJson(formData.get("curriculum_json"));
  if ("error" in curriculumParsed) {
    return { error: curriculumParsed.error };
  }
  const tracks = curriculumParsed;

  const outcomesParsed = parseOutcomesJson(formData.get("outcomes_json"));
  if ("error" in outcomesParsed) {
    return { error: outcomesParsed.error };
  }
  const outcomes = outcomesParsed;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "You must be signed in (open /login)." };
  }
  if (!(await getIsAdmin(supabase))) {
    return {
      error: "Not authorized: add your auth user id to public.admin_users in Supabase, then try again.",
    };
  }

  const { data: existing, error: exErr } = await supabase
    .from("programs")
    .select("id, slug")
    .eq("id", programId)
    .maybeSingle();

  if (exErr || !existing) {
    return { error: exErr?.message ?? "Program not found." };
  }

  const { error: updateErr } = await supabase
    .from("programs")
    .update({
      title: fields.title,
      description: fields.description,
      body: fields.body,
      difficulty_level_id: fields.difficulty_level_id,
      status: fields.status,
      cover_image_url: fields.cover_image_url,
      promo_video_url: fields.promo_video_url,
      song_url: fields.song_url,
      price: fields.price,
      compare_at_price: fields.compare_at_price,
      duration_weeks: fields.duration_weeks,
      sessions_per_week: fields.sessions_per_week,
      minutes_per_session: fields.minutes_per_session,
      outcomes,
    })
    .eq("id", programId);

  if (updateErr) {
    return { error: updateErr.message };
  }

  try {
    await syncProgramCategories(supabase, programId, fields.category_ids);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Could not save categories." };
  }

  const { error: delErr } = await supabase.from("program_location_tracks").delete().eq("program_id", programId);
  if (delErr) {
    return { error: delErr.message };
  }

  try {
    await insertCurriculumForProgram(supabase, programId, tracks);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Could not save curriculum." };
  }

  revalidatePath("/admin/programs");
  revalidatePath("/programs");
  revalidatePath(`/programs/${existing.slug}`);
  return { ok: true };
}

type DuplicateDbExerciseRow = {
  exercise_id: string;
  sort_order: number;
  duration_minutes: number | null;
  sets: number | null;
  reps: number | null;
  rest_after_seconds: number | null;
};

type DuplicateDbSessionRow = {
  name: string;
  description: string | null;
  duration_minutes: number | null;
  sort_order: number;
  program_exercises: DuplicateDbExerciseRow[] | DuplicateDbExerciseRow | null;
};

type DuplicateDbTrackRow = {
  location_id: string;
  sort_order: number;
  program_sessions: DuplicateDbSessionRow[] | DuplicateDbSessionRow | null;
};

function normalizeProgramOutcomes(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  const out: string[] = [];
  for (const x of v) {
    if (typeof x === "string") {
      const t = x.trim();
      if (t.length > 0) out.push(t);
    }
  }
  return out;
}

function dbTracksToDuplicatePayloads(rows: DuplicateDbTrackRow[] | null): TrackPayload[] {
  if (!rows?.length) return [];
  const sorted = [...rows].sort((a, b) => a.sort_order - b.sort_order);
  return sorted.map((row) => {
    const sess = row.program_sessions;
    const sessionsRaw = Array.isArray(sess) ? sess : sess != null ? [sess] : [];
    const sessionsSorted = [...sessionsRaw].sort((a, b) => a.sort_order - b.sort_order);
    const sessions: SessionPayload[] = sessionsSorted.map((s) => {
      const pe = s.program_exercises;
      const exList = Array.isArray(pe) ? pe : pe != null ? [pe] : [];
      const exSorted = [...exList].sort((a, b) => a.sort_order - b.sort_order);
      const exercises: ProgramExercisePayload[] = exSorted.map((e) => ({
        exercise_id: e.exercise_id,
        duration_minutes: e.duration_minutes,
        sets: e.sets,
        reps: e.reps,
        rest_after_seconds: e.rest_after_seconds,
      }));
      return {
        name: typeof s.name === "string" ? s.name : "",
        description: s.description,
        duration_minutes: s.duration_minutes,
        exercises,
      };
    });
    return { location_id: row.location_id, sessions };
  });
}

export async function duplicateProgram(formData: FormData) {
  const programId = (formData.get("program_id") as string)?.trim();
  if (!programId) redirectProgramsError("Missing program id.");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirectProgramsError("You must be signed in.");
  if (!(await getIsAdmin(supabase))) {
    redirectProgramsError("Not authorized.");
  }

  const { data: src, error: pErr } = await supabase
    .from("programs")
    .select(
      `
      id,
      title,
      description,
      body,
      difficulty_level_id,
      cover_image_url,
      promo_video_url,
      song_url,
      price,
      compare_at_price,
      duration_weeks,
      sessions_per_week,
      minutes_per_session,
      outcomes,
      program_categories ( category_id, sort_order )
    `
    )
    .eq("id", programId)
    .maybeSingle();

  if (pErr) redirectProgramsError(pErr.message);
  if (!src) redirectProgramsError("Program not found.");

  const { data: trackRows, error: tErr } = await supabase
    .from("program_location_tracks")
    .select(
      `
      location_id,
      sort_order,
      program_sessions (
        name,
        description,
        duration_minutes,
        sort_order,
        program_exercises (
          exercise_id,
          sort_order,
          duration_minutes,
          sets,
          reps,
          rest_after_seconds
        )
      )
    `
    )
    .eq("program_id", programId)
    .order("sort_order", { ascending: true });

  if (tErr) redirectProgramsError(tErr.message);

  const newTitle = `${src.title} (copy)`;
  const slug = await uniqueProgramSlug(supabase, slugifyTitle(newTitle));

  const pcRaw = src.program_categories as
    | { category_id: string; sort_order: number }[]
    | { category_id: string; sort_order: number }
    | null;
  const pcArr = Array.isArray(pcRaw) ? pcRaw : pcRaw != null ? [pcRaw] : [];
  const categoryIds = [...pcArr]
    .filter((x) => x && typeof x.category_id === "string")
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((x) => x.category_id);

  const outcomes = normalizeProgramOutcomes(src.outcomes);
  const tracks = dbTracksToDuplicatePayloads((trackRows ?? null) as DuplicateDbTrackRow[] | null);

  const { data: inserted, error: insErr } = await supabase
    .from("programs")
    .insert({
      title: newTitle,
      slug,
      description: src.description,
      body: src.body,
      difficulty_level_id: src.difficulty_level_id,
      status: "draft",
      cover_image_url: src.cover_image_url,
      promo_video_url: src.promo_video_url,
      song_url: src.song_url,
      price: src.price,
      compare_at_price: src.compare_at_price,
      duration_weeks: src.duration_weeks,
      sessions_per_week: src.sessions_per_week,
      minutes_per_session: src.minutes_per_session,
      outcomes,
    })
    .select("id")
    .single();

  if (insErr || !inserted) {
    redirectProgramsError(insErr?.message ?? "Could not duplicate program.");
  }

  try {
    await syncProgramCategories(supabase, inserted.id, categoryIds);
    await insertCurriculumForProgram(supabase, inserted.id, tracks);
  } catch (e) {
    await supabase.from("programs").delete().eq("id", inserted.id);
    redirectProgramsError(e instanceof Error ? e.message : "Could not copy curriculum.");
  }

  revalidatePath(ADMIN_PROGRAMS_PATH);
  revalidatePath("/programs");
  redirect(`/admin/programs/${inserted.id}/edit`);
}

export async function deleteProgram(formData: FormData) {
  const programId = (formData.get("program_id") as string)?.trim();
  if (!programId) redirectProgramsError("Missing program id.");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirectProgramsError("You must be signed in.");
  if (!(await getIsAdmin(supabase))) {
    redirectProgramsError("Not authorized.");
  }

  const { data: row, error: fetchErr } = await supabase
    .from("programs")
    .select("slug")
    .eq("id", programId)
    .maybeSingle();

  if (fetchErr) redirectProgramsError(fetchErr.message);
  if (!row) redirectProgramsError("Program not found.");

  const { error: delErr } = await supabase.from("programs").delete().eq("id", programId);
  if (delErr) redirectProgramsError(delErr.message);

  revalidatePath(ADMIN_PROGRAMS_PATH);
  revalidatePath("/programs");
  revalidatePath(`/programs/${row.slug}`);
  redirect(`${ADMIN_PROGRAMS_PATH}?deleted=1`);
}
