"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { getIsAdmin } from "@/utils/supabase/is-admin";
import { loadAiPrompt } from "@/lib/programs/ai-prompts";
import {
  chatWithAiCoach,
  type ChatHistoryMessage,
  type WorkoutProposal,
} from "@/lib/programs/ai-coach-gemini";
import {
  catalogForAiPayload,
  fetchProgramsCatalog,
  type ProgramCatalogRow,
} from "@/lib/programs/programs-catalog";
import { formatExerciseCatalogForPrompt, loadProgramAiContext } from "@/lib/programs/exercise-catalog";
import {
  listMembersForAiPicker,
  loadProfileAiContext,
  userContextBlock,
  type MemberPickerOption,
} from "@/lib/programs/profile-ai-context";
import { saveAiWorkoutProgram } from "@/lib/programs/save-ai-workout";
import { generateProgramCoverImage } from "@/lib/programs/generate-program-cover";

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "You must be signed in.", supabase: null as null, user: null as null };
  }
  if (!(await getIsAdmin(supabase))) {
    return { error: "Not authorized.", supabase: null as null, user: null as null };
  }
  return { error: null, supabase, user };
}

export type AiCoachInitialData = {
  programsCatalog: ProgramCatalogRow[];
  members: MemberPickerOption[];
};

export async function loadAiCoachData(): Promise<
  { ok: true; data: AiCoachInitialData } | { error: string }
> {
  const auth = await requireAdmin();
  if (auth.error || !auth.supabase) return { error: auth.error ?? "Unauthorized" };

  try {
    const [programsCatalog, members] = await Promise.all([
      fetchProgramsCatalog(auth.supabase),
      listMembersForAiPicker(auth.supabase),
    ]);
    return { ok: true, data: { programsCatalog, members } };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Could not load catalog." };
  }
}

export type SendAiCoachMessageResult =
  | { type: "text"; text: string }
  | {
      type: "recommend_programs";
      introText: string;
      programs: ProgramCatalogRow[];
    }
  | { type: "workout_proposal"; proposal: WorkoutProposal }
  | { error: string };

export async function sendAiCoachMessage(input: {
  history: ChatHistoryMessage[];
  userMessage: string;
  programsCatalog: ProgramCatalogRow[];
  targetUserId?: string | null;
}): Promise<SendAiCoachMessageResult> {
  const auth = await requireAdmin();
  if (auth.error || !auth.supabase) return { error: auth.error ?? "Unauthorized" };

  const userMessage = input.userMessage.trim();
  if (!userMessage) return { error: "Message cannot be empty." };

  try {
    const ctx = await loadProgramAiContext(auth.supabase);
    const publishedExercises = ctx.exercises.filter((e) => e.status === "published");
    if (publishedExercises.length === 0) {
      return { error: "Your exercise library has no published exercises. Publish exercises before generating workouts." };
    }

    const catalogById = new Map(publishedExercises.map((e) => [e.id, e.title]));
    const exerciseCatalog = formatExerciseCatalogForPrompt(publishedExercises);

    const fullHistory: ChatHistoryMessage[] = [
      ...input.history,
      { role: "user", parts: [{ text: userMessage }] },
    ];

    const systemPromptTemplate = await loadAiPrompt(auth.supabase, "ai_coach_system");
    const profileContext = input.targetUserId
      ? await loadProfileAiContext(auth.supabase, input.targetUserId)
      : null;
    const result = await chatWithAiCoach({
      history: fullHistory,
      programsCatalog: catalogForAiPayload(input.programsCatalog),
      exerciseCatalog,
      catalogById,
      systemPromptTemplate,
      userContextBlock: userContextBlock(profileContext),
    });

    if (result.type === "text") {
      return { type: "text", text: result.text };
    }

    if (result.name === "recommend_programs") {
      const idSet = new Set(result.args.program_ids);
      const programs = input.programsCatalog.filter((p) => idSet.has(p.id));
      return {
        type: "recommend_programs",
        introText: result.args.intro_text,
        programs,
      };
    }

    return { type: "workout_proposal", proposal: result.args };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Chat failed." };
  }
}

export type SaveAiWorkoutResult =
  | {
      ok: true;
      programId: string;
      slug: string;
      title: string;
      description: string;
      coverPending: boolean;
      status: "draft" | "published";
    }
  | { error: string };

export async function saveAiCoachWorkout(
  proposal: WorkoutProposal,
  options?: { publish?: boolean; generateCover?: boolean }
): Promise<SaveAiWorkoutResult> {
  const auth = await requireAdmin();
  if (auth.error || !auth.supabase) return { error: auth.error ?? "Unauthorized" };

  try {
    const ctx = await loadProgramAiContext(auth.supabase);
    const allowedExerciseIds = new Set(
      ctx.exercises.filter((e) => e.status === "published").map((e) => e.id)
    );

    const saved = await saveAiWorkoutProgram(auth.supabase, proposal, {
      status: options?.publish ? "published" : "draft",
      allowedExerciseIds,
    });

    revalidatePath("/admin/programs");
    revalidatePath("/programs");

    const generateCover = options?.generateCover !== false;
    if (generateCover) {
      void generateProgramCoverImage({
        programId: saved.programId,
        title: saved.title,
      }).then((res) => {
        if ("imageUrl" in res) {
          revalidatePath("/admin/programs");
          revalidatePath(`/admin/programs/${saved.programId}/edit`);
        }
      });
    }

    return {
      ok: true,
      programId: saved.programId,
      slug: saved.slug,
      title: saved.title,
      description: saved.description,
      coverPending: generateCover,
      status: saved.status,
    };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Could not save workout." };
  }
}

export async function getProgramCoverUrl(
  programId: string
): Promise<{ imageUrl: string | null } | { error: string }> {
  const auth = await requireAdmin();
  if (auth.error || !auth.supabase) return { error: auth.error ?? "Unauthorized" };

  const { data } = await auth.supabase
    .from("programs")
    .select("cover_image_url")
    .eq("id", programId)
    .maybeSingle();

  return { imageUrl: (data?.cover_image_url as string | null) ?? null };
}

export async function refreshProgramCover(programId: string): Promise<
  { imageUrl: string } | { error: string }
> {
  const auth = await requireAdmin();
  if (auth.error || !auth.supabase) return { error: auth.error ?? "Unauthorized" };

  const { data: program } = await auth.supabase
    .from("programs")
    .select("title")
    .eq("id", programId)
    .maybeSingle();

  if (!program?.title) return { error: "Program not found." };

  const res = await generateProgramCoverImage({
    programId,
    title: program.title as string,
  });

  if ("error" in res) return res;

  revalidatePath("/admin/programs");
  revalidatePath(`/admin/programs/${programId}/edit`);
  return { imageUrl: res.imageUrl };
}
