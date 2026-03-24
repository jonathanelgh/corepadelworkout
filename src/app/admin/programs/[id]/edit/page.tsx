import { randomUUID } from "node:crypto";
import { notFound } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import {
  CreateProgramForm,
  type ProgramFormInitialValues,
  type SessionBlock,
  type TrackBlock,
} from "../../new/create-program-form";

export const dynamic = "force-dynamic";

type ExerciseRow = { exercise_id: string; sort_order: number };
type SessionRow = {
  name: string;
  description: string | null;
  duration_minutes: number | null;
  sort_order: number;
  program_exercises: ExerciseRow[] | ExerciseRow | null;
};
type TrackRow = {
  location_id: string;
  sort_order: number;
  program_sessions: SessionRow[] | SessionRow | null;
};

function normalizeOutcomesJson(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v
    .filter((x): x is string => typeof x === "string")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

function mapTracks(rows: TrackRow[] | null, fallbackLocationId: string): TrackBlock[] {
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
            exerciseIds: [],
          },
        ],
      },
    ];
  }

  const sorted = [...rows].sort((a, b) => a.sort_order - b.sort_order);

  return sorted.map((row) => {
    const sess = row.program_sessions;
    const sessionsRaw = Array.isArray(sess) ? sess : sess != null ? [sess] : [];
    const sessionsSorted = [...sessionsRaw].sort((a, b) => a.sort_order - b.sort_order);
    const sessions: SessionBlock[] = sessionsSorted.map((s, idx) => {
      const pe = s.program_exercises;
      const exList = Array.isArray(pe) ? pe : pe != null ? [pe] : [];
      const ex = exList.slice().sort((a, b) => a.sort_order - b.sort_order);
      return {
        key: randomUUID(),
        name: s.name?.trim() || `Day ${idx + 1}`,
        description: s.description ?? "",
        durationMinutes:
          s.duration_minutes != null && Number.isFinite(s.duration_minutes)
            ? String(s.duration_minutes)
            : "",
        exerciseIds: ex.map((e) => e.exercise_id),
      };
    });
    return {
      key: randomUUID(),
      locationId: row.location_id,
      sessions: sessions.length > 0 ? sessions : [
        {
          key: randomUUID(),
          name: "Day 1",
          description: "",
          durationMinutes: "",
          exerciseIds: [],
        },
      ],
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
    exercisesRes,
    locationsRes,
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
        category_id,
        difficulty_level_id,
        status,
        cover_image_url,
        promo_video_url,
        price,
        compare_at_price,
        duration_weeks,
        sessions_per_week,
        minutes_per_session,
        outcomes
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
        program_sessions (
          name,
          description,
          duration_minutes,
          sort_order,
          program_exercises (
            exercise_id,
            sort_order
          )
        )
      `
      )
      .eq("program_id", id)
      .order("sort_order", { ascending: true }),
    supabase.from("categories").select("id, name, slug").order("sort_order", { ascending: true }),
    supabase.from("difficulty_levels").select("id, name, slug").order("sort_order", { ascending: true }),
    supabase.from("exercises").select("id, title, location_id").order("title", { ascending: true }),
    supabase.from("locations").select("id, name, slug").order("sort_order", { ascending: true }),
  ]);

  if (!programRes.data) {
    notFound();
  }

  const p = programRes.data as {
    id: string;
    title: string;
    description: string | null;
    body: string | null;
    category_id: string | null;
    difficulty_level_id: string | null;
    status: string;
    cover_image_url: string | null;
    promo_video_url: string | null;
    price: number | null;
    compare_at_price: number | null;
    duration_weeks: number | null;
    sessions_per_week: number | null;
    minutes_per_session: number | null;
    outcomes: unknown;
  };

  const locations = locationsRes.data ?? [];
  const defaultLocationId = locations[0]?.id ?? "";

  const tracks = mapTracks(tracksRes.data as TrackRow[] | null, defaultLocationId);

  const initial: ProgramFormInitialValues = {
    title: p.title,
    description: p.description ?? "",
    body: p.body ?? "",
    categoryId: p.category_id ?? "",
    difficultyLevelId: p.difficulty_level_id ?? "",
    coverImageUrl: p.cover_image_url ?? "",
    promoVideoUrl: p.promo_video_url ?? "",
    price: p.price != null ? String(p.price) : "",
    compareAtPrice: p.compare_at_price != null ? String(p.compare_at_price) : "",
    status: p.status === "published" ? "published" : "draft",
    durationWeeks: p.duration_weeks != null ? String(p.duration_weeks) : "",
    sessionsPerWeek: p.sessions_per_week != null ? String(p.sessions_per_week) : "",
    minutesPerSession: p.minutes_per_session != null ? String(p.minutes_per_session) : "",
    outcomes: normalizeOutcomesJson(p.outcomes),
    tracks,
  };

  const loadError = [
    programRes.error,
    tracksRes.error,
    categoriesRes.error,
    difficultiesRes.error,
    exercisesRes.error,
    locationsRes.error,
  ]
    .filter(Boolean)
    .map((e) => e!.message)
    .join(" · ");

  return (
    <CreateProgramForm
      programId={p.id}
      initial={initial}
      categories={categoriesRes.data ?? []}
      difficulties={difficultiesRes.data ?? []}
      exercises={exercisesRes.data ?? []}
      locations={locations}
      defaultLocationId={defaultLocationId}
      loadError={loadError || null}
    />
  );
}
