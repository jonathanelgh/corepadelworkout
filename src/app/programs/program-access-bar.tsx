import { notFound, redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { userHasProgramAccess } from "@/lib/programs/check-program-access";
import { parseProgramFormat, type ProgramFormat } from "@/lib/programs/program-format";
import { loadProgramProgress } from "@/lib/programs/program-progress";
import { ProgramAccessBarClient } from "./program-access-bar-client";

export async function ProgramAccessBar({
  programId,
  programSlug,
  isFree,
  minutesPerSession,
  programFormat,
  isAdminDraftPreview = false,
}: {
  programId: string;
  programSlug: string;
  isFree: boolean;
  minutesPerSession: number | null;
  programFormat: ProgramFormat;
  /** Draft programs are only startable by admins — never treat as public free. */
  isAdminDraftPreview?: boolean;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Drafts are never publicly free; require access (admins pass via RPC).
  let hasAccess = isFree && !isAdminDraftPreview;
  if (user && !hasAccess) {
    hasAccess = await userHasProgramAccess(supabase, user.id, programId);
  }

  let progress = null;
  if (user && hasAccess) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("training_environment, training_environments")
      .eq("id", user.id)
      .maybeSingle();
    progress = await loadProgramProgress(supabase, user.id, programId, profile, programFormat);
  }

  const mins =
    minutesPerSession != null && Number.isFinite(minutesPerSession) && minutesPerSession > 0
      ? `${minutesPerSession} min`
      : null;
  const kcal =
    minutesPerSession != null && Number.isFinite(minutesPerSession) && minutesPerSession > 0
      ? `Est. ${Math.round(minutesPerSession * 4)} Kcal`
      : null;

  return (
    <ProgramAccessBarClient
      programSlug={programSlug}
      programFormat={programFormat}
      isFree={isFree}
      hasAccess={hasAccess}
      isSignedIn={Boolean(user)}
      minsLabel={mins}
      kcalLabel={kcal}
      progress={progress}
      isAdminDraftPreview={isAdminDraftPreview}
    />
  );
}

/** Redirect when user cannot access a program workout. */
export async function requireProgramWorkoutAccess(
  programId: string,
  programSlug: string,
  isFree: boolean,
  opts?: { isAdminDraftPreview?: boolean }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(`/programs/${programSlug}/play`)}`);
  }

  if (opts?.isAdminDraftPreview) {
    const hasAccess = await userHasProgramAccess(supabase, user.id, programId);
    if (!hasAccess) {
      notFound();
    }
    return;
  }

  if (isFree) return;

  const hasAccess = await userHasProgramAccess(supabase, user.id, programId);
  if (!hasAccess) {
    redirect(`/programs/${programSlug}?upgrade=1`);
  }
}

export async function loadProgramFormatForSlug(slug: string): Promise<ProgramFormat> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("programs")
    .select("program_format")
    .eq("slug", slug)
    .maybeSingle();
  return parseProgramFormat(data?.program_format);
}
