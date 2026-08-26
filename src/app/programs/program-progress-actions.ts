"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { userHasProgramAccess } from "@/lib/programs/check-program-access";
import { loadProgramBySlugForViewer } from "@/lib/programs/load-program-for-viewer";
import { parseProgramFormat, usesProgramProgress } from "@/lib/programs/program-format";
import {
  cancelProgramRun,
  completeProgramSession,
  ensureProgramRun,
  playHrefForSession,
  startProgramSession,
} from "@/lib/programs/program-progress";
import { programCatalogHref, programTrainingHref } from "@/lib/programs/program-routes";
import { enrollInPublishedProgram } from "@/app/programs/enroll-actions";

export async function startProgramTraining(
  programSlug: string
): Promise<{ ok: true; playHref: string } | { error: string; code?: "SIGN_IN_REQUIRED" }> {
  const slug = programSlug.trim();
  if (!slug) return { error: "Invalid program." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Sign in to start this program.", code: "SIGN_IN_REQUIRED" };
  }

  const loaded = await loadProgramBySlugForViewer<{
    id: string;
    is_free: boolean;
    status: string;
    program_format: string | null;
  }>(supabase, slug, "id, is_free, status, program_format");

  if (!loaded) {
    return { error: "Program not found." };
  }

  const { program, isAdminDraftPreview } = loaded;
  const programFormat = parseProgramFormat(program.program_format);

  const hasAccess = await userHasProgramAccess(supabase, user.id, program.id);
  if (!hasAccess) {
    return { error: "This program requires Pro. Upgrade from member settings." };
  }

  // Free published programs get an enrollment row. Draft previews skip enroll (RLS requires published).
  if (program.is_free && !isAdminDraftPreview) {
    const enrolled = await enrollInPublishedProgram(slug);
    if ("error" in enrolled) {
      return { error: enrolled.error, code: enrolled.code };
    }
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("training_environment, training_environments")
    .eq("id", user.id)
    .maybeSingle();

  try {
    const progress = await ensureProgramRun(
      supabase,
      user.id,
      program.id,
      profile,
      programFormat
    );
    const session = progress.nextSession ?? progress.sessions[0];
    if (!session) {
      return { error: "This program has no training content yet." };
    }
    revalidatePath(`/programs/${slug}`);
    revalidatePath(`/programs/${slug}/training`);
    revalidatePath("/member");
    const playHref = usesProgramProgress(programFormat)
      ? programTrainingHref(slug)
      : playHrefForSession(slug, session.id);
    return { ok: true, playHref };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Could not start program." };
  }
}

export async function cancelProgramTraining(
  programSlug: string
): Promise<{ ok: true; redirectHref: string } | { error: string }> {
  const slug = programSlug.trim();
  if (!slug) return { error: "Invalid program." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Sign in required." };
  }

  const loaded = await loadProgramBySlugForViewer<{
    id: string;
    status: string;
    program_format: string | null;
  }>(supabase, slug, "id, status, program_format");

  if (!loaded) {
    return { error: "Program not found." };
  }

  const programFormat = parseProgramFormat(loaded.program.program_format);
  if (!usesProgramProgress(programFormat)) {
    return { error: "This workout cannot be cancelled as a program." };
  }

  const result = await cancelProgramRun(supabase, user.id, loaded.program.id);
  if ("error" in result) return result;

  revalidatePath(`/programs/${slug}`);
  revalidatePath(`/programs/${slug}/training`);
  revalidatePath("/member");

  return { ok: true, redirectHref: programCatalogHref(slug) };
}

export async function logProgramSessionStart(input: {
  programId: string;
  programSlug: string;
  sessionId: string;
}): Promise<{ ok: true } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sign in required." };

  const result = await startProgramSession(
    supabase,
    user.id,
    input.programId,
    input.sessionId
  );
  if ("error" in result) return result;

  revalidatePath(`/programs/${input.programSlug}/training`);
  return { ok: true };
}

export async function logProgramSessionComplete(input: {
  programId: string;
  programSlug: string;
  sessionId: string;
  programFormat?: string;
}): Promise<{ ok: true } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sign in required." };

  const programFormat = parseProgramFormat(input.programFormat);

  const result = await completeProgramSession(
    supabase,
    user.id,
    input.programId,
    input.sessionId,
    programFormat
  );
  if ("error" in result) return result;

  revalidatePath(`/programs/${input.programSlug}`);
  revalidatePath(`/programs/${input.programSlug}/training`);
  revalidatePath("/member");
  return { ok: true };
}
