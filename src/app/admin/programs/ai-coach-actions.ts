"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { getIsAdmin } from "@/utils/supabase/is-admin";
import { loadAiPrompt } from "@/lib/programs/ai-prompts";
import {
  chatWithAiCoach,
  type ChatHistoryMessage,
  type ProgramProposal,
  type WorkoutProposal,
} from "@/lib/programs/ai-coach-gemini";
import {
  catalogForAiPayload,
  fetchProgramsCatalog,
  type ProgramCatalogRow,
} from "@/lib/programs/programs-catalog";
import { formatExerciseCatalogForPrompt, loadProgramAiContext, type ExerciseCatalogEntry } from "@/lib/programs/exercise-catalog";
import {
  listMembersForAiPicker,
  loadProfileAiContext,
  userContextBlock,
  type MemberPickerOption,
} from "@/lib/programs/profile-ai-context";
import { coachShouldCreateNew, coachShouldRecommendCatalogOnly } from "@/lib/programs/coach-intent";
import {
  buildConsultationState,
  buildConsultationPrompt,
  buildConsultationResponseText,
  coachWantsProgram,
  formatConsultationGuide,
  formatGenerationCoachBrief,
  getCurrentConsultationTopic,
  isConsultationComplete,
  isValidLocationSlug,
  sanitizeCoachChatReply,
  shouldRunConsultation,
  type ConsultationLocationOption,
  type ConsultationPrompt,
} from "@/lib/programs/coach-consultation";
import {
  ensureProgramProposalRotation,
  ensureWorkoutProposalRotation,
} from "@/lib/programs/ensure-rotational-exercise";
import { saveAiWorkoutProgram } from "@/lib/programs/save-ai-workout";
import { saveAiProgram } from "@/lib/programs/save-ai-program";
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

function exercisesForLocation(
  exercises: ExerciseCatalogEntry[],
  locationSlug: string | undefined,
  locations: ConsultationLocationOption[]
): ExerciseCatalogEntry[] {
  if (!locationSlug) return exercises;
  const loc = locations.find((l) => l.slug === locationSlug);
  if (!loc) return exercises;
  const filtered = exercises.filter((e) => e.locationIds.includes(loc.id));
  return filtered.length > 0 ? filtered : exercises;
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
  | { type: "consultation"; text: string; prompt: ConsultationPrompt }
  | {
      type: "recommend_programs";
      introText: string;
      programs: ProgramCatalogRow[];
    }
  | { type: "workout_proposal"; proposal: WorkoutProposal }
  | { type: "program_proposal"; proposal: ProgramProposal }
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

    const { data: locationRows } = await auth.supabase
      .from("locations")
      .select("id, name, slug")
      .order("sort_order", { ascending: true });
    const locations: ConsultationLocationOption[] = (locationRows ?? []).map((row) => ({
      id: row.id as string,
      name: row.name as string,
      slug: row.slug as string,
    }));

    const { data: equipmentRows } = await auth.supabase
      .from("equipment")
      .select("title")
      .order("title", { ascending: true });
    const equipmentLibrary = (equipmentRows ?? [])
      .map((r) => (r.title as string)?.trim())
      .filter(Boolean);

    const userTexts: string[] = [];
    for (const m of input.history) {
      if (m.role === "user") userTexts.push(m.parts[0].text.trim());
    }
    userTexts.push(userMessage);

    const isProgram = coachWantsProgram(userTexts);
    const consultation = buildConsultationState(
      input.history,
      userMessage,
      equipmentLibrary,
      locations
    );
    const consultationComplete = isConsultationComplete(
      consultation,
      isProgram,
      equipmentLibrary
    );
    const inCreateFlow =
      !coachShouldRecommendCatalogOnly(userMessage) &&
      (userTexts.some((t) => coachShouldCreateNew(t)) ||
        shouldRunConsultation(input.history, userMessage));

    if (inCreateFlow && !consultationComplete) {
      const topic = getCurrentConsultationTopic(consultation, isProgram);
      if (topic) {
        const prompt = buildConsultationPrompt(topic, locations, equipmentLibrary, isProgram);
        const text = buildConsultationResponseText(consultation, topic, prompt.question, locations);
        return { type: "consultation", text, prompt };
      }
    }

    const generationExercises =
      inCreateFlow && consultationComplete
        ? exercisesForLocation(
            publishedExercises,
            consultation.locationSlug,
            locations
          )
        : publishedExercises;

    const catalogById = new Map(generationExercises.map((e) => [e.id, e.title]));
    const exerciseCatalog = formatExerciseCatalogForPrompt(generationExercises);

    const fullHistory: ChatHistoryMessage[] = [
      ...input.history,
      { role: "user", parts: [{ text: userMessage }] },
    ];

    const systemPromptTemplate = await loadAiPrompt(auth.supabase, "ai_coach_system");
    const profileContext = input.targetUserId
      ? await loadProfileAiContext(auth.supabase, input.targetUserId)
      : null;
    const consultationBrief = inCreateFlow
      ? formatConsultationGuide(consultation, isProgram, equipmentLibrary)
      : undefined;

    const coachParams = {
      programsCatalog: catalogForAiPayload(input.programsCatalog),
      exerciseCatalog,
      catalogById,
      systemPromptTemplate,
      userContextBlock: userContextBlock(profileContext),
      creationOnly: inCreateFlow,
      consultationBrief,
      toolsEnabled: !inCreateFlow || consultationComplete,
    };

    const toolName = isProgram ? "generate_program" : "generate_workout";

    const generationBrief =
      inCreateFlow && consultationComplete
        ? formatGenerationCoachBrief(consultation, isProgram, toolName)
        : consultationBrief;

    const generationHistory: ChatHistoryMessage[] =
      inCreateFlow && consultationComplete
        ? [
            {
              role: "user",
              parts: [
                {
                  text: [
                    consultation.goal ?? userMessage,
                    "",
                    `Consultation is complete. Call ${toolName} now using the consultation parameters in your instructions.`,
                  ].join("\n"),
                },
              ],
            },
          ]
        : fullHistory;

    let result = await chatWithAiCoach({
      history: generationHistory,
      ...coachParams,
      consultationBrief: generationBrief,
      forcedTool: inCreateFlow && consultationComplete ? toolName : undefined,
    });

    if (
      inCreateFlow &&
      !consultationComplete &&
      result.type === "functionCall" &&
      (result.name === "generate_program" || result.name === "generate_workout")
    ) {
      result = await chatWithAiCoach({
        history: fullHistory,
        ...coachParams,
        toolsEnabled: false,
        consultationBrief: `${consultationBrief ?? ""}\n\n## Not ready to generate yet\nConsultation is still missing required details. Reply with one friendly conversational question about the next missing topic. Do not call tools this turn.`,
      });
    }

    if (
      inCreateFlow &&
      consultationComplete &&
      result.type === "text"
    ) {
      result = await chatWithAiCoach({
        history: [
          ...generationHistory,
          { role: "model", parts: [{ text: result.text }] },
          {
            role: "user",
            parts: [
              {
                text: `Call ${toolName} now. Return the tool call with valid catalog exercise_id UUIDs — do not reply with prose.`,
              },
            ],
          },
        ],
        ...coachParams,
        consultationBrief: generationBrief,
        forcedTool: toolName,
      });
    }

    if (result.type === "text") {
      const cleaned = sanitizeCoachChatReply(result.text);
      const text = cleaned.trim() || result.text.trim();
      if (!text) {
        throw new Error("AI returned an empty response. Try again.");
      }
      return { type: "text", text };
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

    if (result.name === "generate_workout") {
      const { proposal, warnings: rotationWarnings } = ensureWorkoutProposalRotation(
        result.args,
        publishedExercises
      );
      if (rotationWarnings.length > 0) {
        console.info("[ai-coach] rotation enforcement:", rotationWarnings.join(" "));
      }
      return { type: "workout_proposal", proposal };
    }

    const { proposal, warnings: rotationWarnings } = ensureProgramProposalRotation(
      {
        ...result.args,
        duration_weeks: consultation.durationWeeks ?? result.args.duration_weeks,
        sessions_per_week: consultation.sessionsPerWeek ?? result.args.sessions_per_week,
        minutes_per_session: consultation.minutes ?? result.args.minutes_per_session,
        location_slug:
          consultation.locationSlug && isValidLocationSlug(consultation.locationSlug)
            ? consultation.locationSlug
            : result.args.location_slug,
      },
      publishedExercises
    );
    if (rotationWarnings.length > 0) {
      console.info("[ai-coach] rotation enforcement:", rotationWarnings.join(" "));
    }
    return { type: "program_proposal", proposal };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Chat failed." };
  }
}

export type SaveAiCoachProgramResult =
  | {
      ok: true;
      programId: string;
      slug: string;
      title: string;
      description: string;
      sessionCount: number;
      coverPending: boolean;
      status: "draft" | "published";
    }
  | { error: string };

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

export async function saveAiCoachProgram(
  proposal: ProgramProposal,
  options?: { publish?: boolean; generateCover?: boolean }
): Promise<SaveAiCoachProgramResult> {
  const auth = await requireAdmin();
  if (auth.error || !auth.supabase) return { error: auth.error ?? "Unauthorized" };

  try {
    const ctx = await loadProgramAiContext(auth.supabase);
    const publishedExercises = ctx.exercises.filter((e) => e.status === "published");
    const allowedExerciseIds = new Set(publishedExercises.map((e) => e.id));

    const { proposal: fixed } = ensureProgramProposalRotation(proposal, publishedExercises);

    const saved = await saveAiProgram(auth.supabase, fixed, {
      status: options?.publish ? "published" : "draft",
      allowedExerciseIds,
      durationWeeks: fixed.duration_weeks,
      sessionsPerWeek: fixed.sessions_per_week,
      minutesPerSession: fixed.minutes_per_session,
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
      sessionCount: saved.sessionCount,
      coverPending: generateCover,
      status: saved.status,
    };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Could not save program." };
  }
}

export async function saveAiCoachWorkout(
  proposal: WorkoutProposal,
  options?: { publish?: boolean; generateCover?: boolean }
): Promise<SaveAiWorkoutResult> {
  const auth = await requireAdmin();
  if (auth.error || !auth.supabase) return { error: auth.error ?? "Unauthorized" };

  try {
    const ctx = await loadProgramAiContext(auth.supabase);
    const publishedExercises = ctx.exercises.filter((e) => e.status === "published");
    const allowedExerciseIds = new Set(publishedExercises.map((e) => e.id));

    const { proposal: fixed } = ensureWorkoutProposalRotation(proposal, publishedExercises);

    const saved = await saveAiWorkoutProgram(auth.supabase, fixed, {
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
