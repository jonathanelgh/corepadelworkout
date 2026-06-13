import { redirect } from "next/navigation";

type PageProps = { params: Promise<{ slug: string; sessionId: string }> };

/** Legacy per-session route — redirects to unified program player */
export default async function SessionWorkoutRedirect({ params }: PageProps) {
  const { slug } = await params;
  redirect(`/programs/${slug}/play`);
}
