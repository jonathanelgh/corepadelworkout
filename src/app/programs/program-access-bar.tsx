import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { userHasProgramAccess } from "@/lib/programs/check-program-access";
import { ProgramAccessBarClient } from "./program-access-bar-client";

export async function ProgramAccessBar({
  programId,
  programSlug,
  isFree,
  minutesPerSession,
}: {
  programId: string;
  programSlug: string;
  isFree: boolean;
  minutesPerSession: number | null;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let hasAccess = isFree;
  if (user && !hasAccess) {
    hasAccess = await userHasProgramAccess(supabase, user.id, programId);
  }

  const playHref = `/programs/${programSlug}/play`;
  const mins =
    minutesPerSession != null && Number.isFinite(minutesPerSession) && minutesPerSession > 0
      ? `${minutesPerSession} min session`
      : null;
  const kcal =
    minutesPerSession != null && Number.isFinite(minutesPerSession) && minutesPerSession > 0
      ? `Est. ${Math.round(minutesPerSession * 4)} Kcal`
      : null;

  return (
    <ProgramAccessBarClient
      programSlug={programSlug}
      playHref={playHref}
      isFree={isFree}
      hasAccess={hasAccess}
      isSignedIn={Boolean(user)}
      minsLabel={mins}
      kcalLabel={kcal}
    />
  );
}

/** Redirect when user cannot access a program workout. */
export async function requireProgramWorkoutAccess(programId: string, programSlug: string, isFree: boolean) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(`/programs/${programSlug}/play`)}`);
  }

  if (isFree) return;

  const hasAccess = await userHasProgramAccess(supabase, user.id, programId);
  if (!hasAccess) {
    redirect(`/programs/${programSlug}?upgrade=1`);
  }
}
