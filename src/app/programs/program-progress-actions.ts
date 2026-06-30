"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { enrollInPublishedProgram } from "@/app/programs/enroll-actions";
import { userHasProgramAccess } from "@/lib/programs/check-program-access";
import { parseProgramFormat, usesProgramProgress } from "@/lib/programs/program-format";
import {
  cancelProgramRun,
  completeProgramSession,
  ensureProgramRun,
  playHrefForSession,
  startProgramSession,
} from "@/lib/programs/program-progress";
import { programCatalogHref, programTrainingHref } from "@/lib/programs/program-routes";

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

  const { data: program, error: pErr } = await supabase
    .from("programs")
    .select("id, is_free, status, program_format")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (pErr || !program) {
    return { error: "Program not found." };
  }

  const programFormat = parseProgramFormat(program.program_format);

  const hasAccess = await userHasProgramAccess(supabase, user.id, program.id);
  if (!hasAccess) {
    return { error: "This program requires Pro. Upgrade from member settings." };
  }

  if (program.is_free) {
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
    return { ok: true, playHref: programTrainingHref(slug) };
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

  const { data: program, error: pErr } = await supabase
    .from("programs")
    .select("id, status, program_format")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (pErr || !program) {
    return { error: "Program not found." };
  }

  const programFormat = parseProgramFormat(program.program_format);
  if (!usesProgramProgress(programFormat)) {
    return { error: "This workout cannot be cancelled as a program." };
  }

  const result = await cancelProgramRun(supabase, user.id, program.id);
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
