import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { fetchProgramExercises } from "@/lib/programs/program-exercises";
import { ActiveWorkoutPlayer } from "@/components/programs/active-workout-player";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("programs")
    .select("title")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (!data) return { title: "Workout" };
  return { title: `${(data as { title: string }).title} · Workout` };
}

export default async function ProgramPlayPage({ params }: PageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: program, error } = await supabase
    .from("programs")
    .select("id, title, cover_image_url, song_url, status")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (error || !program) {
    notFound();
  }

  const row = program as {
    id: string;
    title: string;
    cover_image_url: string | null;
    song_url: string | null;
  };

  const exercises = await fetchProgramExercises(supabase, row.id);

  return (
    <ActiveWorkoutPlayer
      programSlug={slug}
      programTitle={row.title}
      coverImageUrl={row.cover_image_url}
      songUrl={row.song_url}
      exercises={exercises}
    />
  );
}
