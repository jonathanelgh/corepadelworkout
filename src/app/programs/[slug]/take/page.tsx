import { redirect } from "next/navigation";

type PageProps = { params: Promise<{ slug: string }> };

/** Legacy route — mobile-style flow uses a single linear workout at /play */
export default async function ProgramTakeRedirect({ params }: PageProps) {
  const { slug } = await params;
  redirect(`/programs/${slug}/play`);
}
