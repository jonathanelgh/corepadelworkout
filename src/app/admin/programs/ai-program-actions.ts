"use server";

import { createClient } from "@/utils/supabase/server";
import { getIsAdmin } from "@/utils/supabase/is-admin";
import { loadAiPrompt } from "@/lib/programs/ai-prompts";
import { loadProgramAiContext } from "@/lib/programs/exercise-catalog";
import {
  buildAdminAiAthleteContext,
  isOnboardingLevel,
  loadProfileAiContext,
} from "@/lib/programs/profile-ai-context";
import { generateProgramWithGemini, type AiProgramGenerateRequest } from "@/lib/programs/gemini-generate-program";
import { filterCatalogByTrainingLevel, resolveExerciseLevelCap } from "@/lib/programs/exercise-level-eligibility";
import { parseTrainingLevelFromBrief } from "@/lib/programs/program-prescription-rules";
import { ensureGeminiDraftRotation } from "@/lib/programs/ensure-rotational-exercise";
import { ensureGeminiDraftStructure, resolveSessionEnforcementOptions } from "@/lib/programs/ensure-session-structure";
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
    const dropdownLevel = isOnboardingLevel(input.trainingLevel) ? input.trainingLevel : null;
    const briefLevel = parseTrainingLevelFromBrief(input.brief);
    const adminTrainingLevel = dropdownLevel ?? briefLevel;
    const userContextBlock = buildAdminAiAthleteContext(profileContext, adminTrainingLevel);
    const difficultySlug = input.difficultyLevelId
      ? ctx.difficulties.find((d) => d.id === input.difficultyLevelId)?.slug ?? null
      : null;
    const levelCap =
      resolveExerciseLevelCap({
        trainingLevel: adminTrainingLevel,
        difficultySlug,
      }) ?? "beginner";
    const enforcementOptions = resolveSessionEnforcementOptions({
      trainingLevel: levelCap,
      athleteContext: userContextBlock,
      goal: input.brief?.trim() || undefined,
    });
    const geminiDraft = await generateProgramWithGemini(ctx, input, {
      promptTemplate,
      userContextBlock,
    });
    const levelCatalog = filterCatalogByTrainingLevel(
      ctx.exercises.filter((e) => e.status === "published"),
      levelCap
    );
    const { draft: rotationDraft, warnings: rotationWarnings } = ensureGeminiDraftRotation(
      geminiDraft,
      levelCatalog,
      ctx.locations,
      { trainingLevel: levelCap }
    );
    const { draft: structuredDraft, warnings: structureWarnings } = ensureGeminiDraftStructure(
      rotationDraft,
      levelCatalog,
      enforcementOptions
    );
    const catalogIds = new Set(levelCatalog.map((e) => e.id));
    const { draft, warnings } = mapGeminiDraftToForm(structuredDraft, ctx, catalogIds, {
      durationWeeks: input.durationWeeks ?? 8,
      sessionsPerWeek: input.sessionsPerWeek,
      trainingLevel: levelCap,
    });

    const usedIds = new Set<string>();
    for (const tr of draft.tracks) {
      for (const s of tr.sessions) {
        for (const ex of s.exercises) usedIds.add(ex.exerciseId);
      }
    }

    return {
      ok: true,
      draft,
      warnings: [...rotationWarnings, ...structureWarnings, ...warnings],
      exerciseCount: usedIds.size,
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Could not generate program.";
    return { error: msg };
  }
}
