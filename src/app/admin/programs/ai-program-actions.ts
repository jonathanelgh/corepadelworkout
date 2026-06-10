"use server";

import { createClient } from "@/utils/supabase/server";
import { getIsAdmin } from "@/utils/supabase/is-admin";
import { loadAiPrompt } from "@/lib/programs/ai-prompts";
import { loadProgramAiContext } from "@/lib/programs/exercise-catalog";
import { loadProfileAiContext, userContextBlock } from "@/lib/programs/profile-ai-context";
import { generateProgramWithGemini, type AiProgramGenerateRequest } from "@/lib/programs/gemini-generate-program";
import { mapGeminiDraftToForm, type AiProgramFormDraft } from "@/lib/programs/map-ai-program-draft";

export type GenerateAiProgramResult =
  | { ok: true; draft: AiProgramFormDraft; warnings: string[]; exerciseCount: number }
  | { error: string };

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "You must be signed in.", supabase: null as null };
  }
  if (!(await getIsAdmin(supabase))) {
    return { error: "Not authorized.", supabase: null as null };
  }
  return { error: null, supabase };
}

export async function generateAiProgram(input: AiProgramGenerateRequest): Promise<GenerateAiProgramResult> {
  const auth = await requireAdmin();
  if (auth.error || !auth.supabase) {
    return { error: auth.error ?? "Unauthorized" };
  }

  try {
    const ctx = await loadProgramAiContext(auth.supabase);
    if (ctx.exercises.length === 0) {
      return { error: "Your exercise library is empty. Create exercises before generating a program." };
    }

    const promptTemplate = await loadAiPrompt(auth.supabase, "ai_program_builder");
    const profileContext = input.targetUserId
      ? await loadProfileAiContext(auth.supabase, input.targetUserId)
      : null;
    const geminiDraft = await generateProgramWithGemini(ctx, input, {
      promptTemplate,
      userContextBlock: userContextBlock(profileContext),
    });
    const catalogIds = new Set(ctx.exercises.map((e) => e.id));
    const { draft, warnings } = mapGeminiDraftToForm(geminiDraft, ctx, catalogIds);

    const usedIds = new Set<string>();
    for (const tr of draft.tracks) {
      for (const s of tr.sessions) {
        for (const ex of s.exercises) usedIds.add(ex.exerciseId);
      }
    }

    return {
      ok: true,
      draft,
      warnings,
      exerciseCount: usedIds.size,
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Could not generate program.";
    return { error: msg };
  }
}
