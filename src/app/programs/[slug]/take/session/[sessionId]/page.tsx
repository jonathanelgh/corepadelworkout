import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { userHasProgramAccess } from "@/lib/programs/check-program-access";
import { SessionWorkoutClient, type WorkoutExercise } from "@/app/programs/session-workout-client";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ slug: string; sessionId: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug, sessionId } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("program_sessions")
    .select("name")
    .eq("id", sessionId)
    .maybeSingle();

  if (!data) return { title: "Workout" };
  return { title: `${(data as { name: string }).name} · Workout` };
}

export default async function SessionWorkoutPage({ params }: PageProps) {
  const { slug, sessionId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(`/programs/${slug}/take/session/${sessionId}`)}`);
  }

  const { data: sessionRow, error: sErr } = await supabase
    .from("program_sessions")
    .select("id, name, description, track_id")
    .eq("id", sessionId)
    .maybeSingle();

  if (sErr || !sessionRow) {
    notFound();
  }

  const session = sessionRow as {
    id: string;
    name: string;
    description: string | null;
    track_id: string;
  };

  const { data: trackRow } = await supabase
    .from("program_location_tracks")
    .select("program_id")
    .eq("id", session.track_id)
    .maybeSingle();

  if (!trackRow) {
    notFound();
  }

  const programId = (trackRow as { program_id: string }).program_id;

  const { data: programRow } = await supabase
    .from("programs")
    .select("id, slug, status")
    .eq("id", programId)
    .maybeSingle();

  const program = programRow as { id: string; slug: string; status: string } | null;
  if (!program || program.slug !== slug || program.status !== "published") {
    notFound();
  }

  const allowed = await userHasProgramAccess(supabase, user.id, program.id);
  if (!allowed) {
    redirect(`/programs/${slug}/take`);
  }

  const { data: peRows, error: peErr } = await supabase
    .from("program_exercises")
    .select(
      `
      sort_order,
      exercises (
        id,
        title,
        description,
        how_to,
        video_url
      )
    `
    )
    .eq("session_id", session.id)
    .order("sort_order", { ascending: true });

  if (peErr) {
    console.error("session workout exercises:", peErr.message);
  }

  type PeIn = {
    sort_order: number;
    exercises: WorkoutExercise | WorkoutExercise[] | null;
  };

  const exercises: WorkoutExercise[] = [];
  for (const row of (peRows ?? []) as PeIn[]) {
    const e = row.exercises;
    const ex = Array.isArray(e) ? e[0] : e;
    if (ex && typeof ex.id === "string" && ex.title) {
      exercises.push({
        id: ex.id,
        title: ex.title,
        description: ex.description ?? null,
        how_to: ex.how_to ?? null,
        video_url: ex.video_url ?? null,
      });
    }
  }

  return (
    <SessionWorkoutClient
      programSlug={slug}
      sessionName={session.name?.trim() || "Session"}
      sessionDescription={session.description}
      exercises={exercises}
    />
  );
}
