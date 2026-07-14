import { randomUUID } from "node:crypto";
import { notFound } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { inferExercisePrescriptionType } from "@/lib/programs/program-exercises";
import { parseProgramFormat } from "@/lib/programs/program-format";
import { loadProgramExerciseOptions } from "@/lib/exercises/program-exercise-options";
import { clampProgramPrescriptionType } from "@/lib/exercises/program-prescription-mode";
import { listMembersForAiPicker } from "@/lib/programs/profile-ai-context";
import {
  CreateProgramForm,
  type ProgramFormInitialValues,
  type SessionBlock,
  type SessionExerciseEntry,
  type TrackBlock,
} from "../../new/create-program-form";

export const dynamic = "force-dynamic";

type ExerciseRow = {
  exercise_id: string;
  sort_order: number;
  duration_minutes: number | null;
  duration_seconds: number | null;
  sets: number | null;
  reps: number | null;
  rest_between_sets_seconds: number | null;
  rest_between_sides_seconds: number | null;
  rest_after_seconds: number | null;
  session_phase: "warmup" | "main" | "cooldown" | null;
  choice_group: string | null;
  note: string | null;
};
type SessionRow = {
  name: string;
  description: string | null;
  duration_minutes: number | null;
  sort_order: number;
  week_id: string | null;
  program_exercises: ExerciseRow[] | ExerciseRow | null;
};
type WeekRow = {
  id: string;
  sort_order: number;
};
type TrackRow = {
  location_id: string;
  sort_order: number;
  program_weeks: WeekRow[] | WeekRow | null;
  program_sessions: SessionRow[] | SessionRow | null;
};

function mapSessionRow(
  s: SessionRow,
  idx: number,
  exerciseOptions: ExerciseOption[]
): SessionBlock {
  const pe = s.program_exercises;
  const exList = Array.isArray(pe) ? pe : pe != null ? [pe] : [];
  const ex = exList.slice().sort((a, b) => a.sort_order - b.sort_order);
  const exercises: SessionExerciseEntry[] = ex.map((e) => {
    let durationValue = "";
    let durationUnit: SessionExerciseEntry["durationUnit"] = "sec";
    if (e.duration_seconds != null && Number.isFinite(e.duration_seconds)) {
      durationValue = String(e.duration_seconds);
      durationUnit = "sec";
    } else if (e.duration_minutes != null && Number.isFinite(e.duration_minutes)) {
      durationValue = String(e.duration_minutes);
      durationUnit = "min";
    }
    const inferred = inferExercisePrescriptionType({
      durationSeconds: e.duration_seconds,
      durationMinutes: e.duration_minutes,
      sets: e.sets,
      restBetweenSetsSeconds: e.rest_between_sets_seconds,
    });
    const mode =
      exerciseOptions.find((x) => x.id === e.exercise_id)?.programPrescriptionMode ?? "all";
    return {
      key: randomUUID(),
      exerciseId: e.exercise_id,
      sessionPhase: e.session_phase ?? "main",
      choiceGroup: e.choice_group?.trim() ?? "",
      prescriptionType: clampProgramPrescriptionType(mode, inferred),
      durationValue,
      durationUnit,
      sets: e.sets != null && Number.isFinite(e.sets) ? String(e.sets) : "",
      reps: e.reps != null && Number.isFinite(e.reps) ? String(e.reps) : "",
      restBetweenSetsSeconds:
        e.rest_between_sets_seconds != null && Number.isFinite(e.rest_between_sets_seconds)
          ? String(e.rest_between_sets_seconds)
          : "",
      restBetweenSidesSeconds:
        e.rest_between_sides_seconds != null && Number.isFinite(e.rest_between_sides_seconds)
          ? String(e.rest_between_sides_seconds)
          : "",
      restAfterSeconds:
        e.rest_after_seconds != null && Number.isFinite(e.rest_after_seconds)
          ? String(e.rest_after_seconds)
          : "",
      note: e.note?.trim() ?? "",
    };
  });
  return {
    key: randomUUID(),
    name: s.name?.trim() || `Day ${idx + 1}`,
    description: s.description ?? "",
    durationMinutes:
      s.duration_minutes != null && Number.isFinite(s.duration_minutes)
        ? String(s.duration_minutes)
        : "",
    exercises,
  };
}

function normalizeOutcomesJson(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v
    .filter((x): x is string => typeof x === "string")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

import type { ExerciseOption } from "../../new/exercise-search-combobox";

function mapTracks(
  rows: TrackRow[] | null,
  fallbackLocationId: string,
  exerciseOptions: ExerciseOption[]
): TrackBlock[] {
  if (!rows?.length) {
    return [
      {
        key: randomUUID(),
        locationId: fallbackLocationId,
        sessions: [
          {
            key: randomUUID(),
            name: "Day 1",
            description: "",
            durationMinutes: "",
            exercises: [],
          },
        ],
        weekSizes: [1],
      },
    ];
  }

  const sorted = [...rows].sort((a, b) => a.sort_order - b.sort_order);

  return sorted.map((row) => {
    const weeksRaw = row.program_weeks;
    const weeksList = Array.isArray(weeksRaw) ? weeksRaw : weeksRaw != null ? [weeksRaw] : [];
    const weeksSorted = [...weeksList].sort((a, b) => a.sort_order - b.sort_order);

    const sess = row.program_sessions;
    const sessionsRaw = Array.isArray(sess) ? sess : sess != null ? [sess] : [];
    const sessionsSorted = [...sessionsRaw].sort((a, b) => a.sort_order - b.sort_order);

    let sessions: SessionBlock[] = [];
    let weekSizes: number[] | undefined;

    if (weeksSorted.length > 0) {
      const byWeek = new Map<string, SessionRow[]>();
      const orphans: SessionRow[] = [];
      for (const s of sessionsSorted) {
        if (s.week_id) {
          const list = byWeek.get(s.week_id) ?? [];
          list.push(s);
          byWeek.set(s.week_id, list);
        } else {
          orphans.push(s);
        }
      }

      weekSizes = [];
      for (const week of weeksSorted) {
        const weekSessions = (byWeek.get(week.id) ?? []).sort((a, b) => a.sort_order - b.sort_order);
        if (weekSessions.length > 0) {
          weekSizes.push(weekSessions.length);
          sessions.push(
            ...weekSessions.map((s, idx) => mapSessionRow(s, sessions.length + idx, exerciseOptions))
          );
        }
      }

      if (orphans.length > 0) {
        weekSizes.push(orphans.length);
        sessions.push(
          ...orphans.map((s, idx) => mapSessionRow(s, sessions.length + idx, exerciseOptions))
        );
      }
    } else {
      sessions = sessionsSorted.map((s, idx) => mapSessionRow(s, idx, exerciseOptions));
    }

    return {
      key: randomUUID(),
      locationId: row.location_id,
      sessions:
        sessions.length > 0
          ? sessions
          : [
              {
                key: randomUUID(),
                name: "Day 1",
                description: "",
                durationMinutes: "",
                exercises: [],
              },
            ],
      ...(weekSizes?.length ? { weekSizes } : {}),
    };
  });
}

type PageProps = { params: Promise<{ id: string }> };

export default async function EditProgramPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const [
    programRes,
    tracksRes,
    categoriesRes,
    difficultiesRes,
    exerciseOptionsRes,
    locationsRes,
    members,
  ] = await Promise.all([
    supabase
      .from("programs")
      .select(
        `
        id,
        title,
        slug,
        description,
        body,
        difficulty_level_id,
        status,
        cover_image_url,
        promo_video_url,
        song_url,
        is_free,
        program_format,
        duration_weeks,
        sessions_per_week,
        minutes_per_session,
        outcomes,
        program_categories ( category_id, sort_order )
      `
      )
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("program_location_tracks")
      .select(
        `
        location_id,
        sort_order,
        program_weeks ( id, sort_order ),
        program_sessions (
          name,
          description,
          duration_minutes,
          sort_order,
          week_id,
          program_exercises (
            exercise_id,
            sort_order,
            duration_minutes,
            duration_seconds,
            sets,
            reps,
            rest_between_sets_seconds,
            rest_between_sides_seconds,
            rest_after_seconds,
            session_phase,
            choice_group,
            note
          )
        )
      `
      )
      .eq("program_id", id)
      .order("sort_order", { ascending: true }),
    supabase.from("categories").select("id, name, slug").order("sort_order", { ascending: true }),
    supabase.from("difficulty_levels").select("id, name, slug").order("sort_order", { ascending: true }),
    loadProgramExerciseOptions(supabase),
    supabase.from("locations").select("id, name, slug").order("sort_order", { ascending: true }),
    listMembersForAiPicker(supabase),
  ]);

  if (!programRes.data) {
    notFound();
  }

  const p = programRes.data as {
    id: string;
    title: string;
    description: string | null;
    body: string | null;
    difficulty_level_id: string | null;
    status: string;
    cover_image_url: string | null;
    promo_video_url: string | null;
    song_url: string | null;
    is_free: boolean;
    program_format: string | null;
    duration_weeks: number | null;
    sessions_per_week: number | null;
    minutes_per_session: number | null;
    outcomes: unknown;
    program_categories: { category_id: string; sort_order: number }[] | { category_id: string; sort_order: number } | null;
  };

  const pcRaw = p.program_categories;
  const pcArr = Array.isArray(pcRaw) ? pcRaw : pcRaw != null ? [pcRaw] : [];
  const sortedCategoryIds = [...pcArr]
    .filter((x) => x && typeof x.category_id === "string")
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((x) => x.category_id);

  const locations = locationsRes.data ?? [];
  const defaultLocationId = locations[0]?.id ?? "";

  const tracks = mapTracks(
    tracksRes.data as TrackRow[] | null,
    defaultLocationId,
    exerciseOptionsRes.exercises
  );

  const initial: ProgramFormInitialValues = {
    title: p.title,
    description: p.description ?? "",
    body: p.body ?? "",
    categoryIds: sortedCategoryIds,
    difficultyLevelId: p.difficulty_level_id ?? "",
    coverImageUrl: p.cover_image_url ?? "",
    promoVideoUrl: p.promo_video_url ?? "",
    songUrl: p.song_url ?? "",
    isFree: Boolean(p.is_free),
    status: p.status === "published" ? "published" : "draft",
    durationWeeks: p.duration_weeks != null ? String(p.duration_weeks) : "",
    sessionsPerWeek: p.sessions_per_week != null ? String(p.sessions_per_week) : "",
    minutesPerSession: p.minutes_per_session != null ? String(p.minutes_per_session) : "",
    programFormat: parseProgramFormat(p.program_format),
    outcomes: normalizeOutcomesJson(p.outcomes),
    tracks,
  };

  const loadError = [
    programRes.error,
    tracksRes.error,
    categoriesRes.error,
    difficultiesRes.error,
    exerciseOptionsRes.error,
    locationsRes.error,
  ]
    .filter(Boolean)
    .map((e) => (typeof e === "string" ? e : (e as { message: string }).message))
    .join(" · ");

  return (
    <CreateProgramForm
      programId={p.id}
      initial={initial}
      categories={categoriesRes.data ?? []}
      difficulties={difficultiesRes.data ?? []}
      exercises={exerciseOptionsRes.exercises}
      locations={locations}
      defaultLocationId={defaultLocationId}
      loadError={loadError || null}
      members={members}
    />
  );
}
