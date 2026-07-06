"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { getHasActivePro } from "@/lib/member/has-active-pro";
import { AI_COACH_METHODOLOGY_BLOCK } from "@/lib/programs/ai-coach-methodology";
import { loadAiPrompt } from "@/lib/programs/ai-prompts";
import {
  chatWithAiCoach,
  type AiCoachToolName,
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
  buildMemberAiAthleteContext,
  loadProfileAiContext,
} from "@/lib/programs/profile-ai-context";
import {
  loadMemberCoachTrainingContext,
  memberTrainingContextBlock,
} from "@/lib/programs/load-member-coach-context";
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
import { ensureWorkoutProposalRotation } from "@/lib/programs/ensure-rotational-exercise";
import { ensureWorkoutProposalStructure } from "@/lib/programs/ensure-session-structure";
import { saveAiWorkoutProgram } from "@/lib/programs/save-ai-workout";
import { fetchProgramSessionsForProgram } from "@/lib/programs/program-sessions";
import { playHrefForSession } from "@/lib/programs/program-progress";

const MEMBER_TOOLS: AiCoachToolName[] = ["recommend_programs", "generate_workout"];

async function requireProMember() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "You must be signed in.", supabase: null as null, user: null as null };
  }
  if (!(await getHasActivePro(supabase, user.id))) {
    return { error: "Pro membership required for AI Coach.", supabase: null as null, user: null as null };
  }
  return { error: null, supabase, user };
}

function exercisesForLocation(
  exercises: Awaited<ReturnType<typeof loadProgramAiContext>>["exercises"],
  locationSlug: string | undefined,
  locations: ConsultationLocationOption[]
) {
  if (!locationSlug) return exercises;
  const loc = locations.find((l) => l.slug === locationSlug);
  if (!loc) return exercises;

  const atLocation = exercises.filter((e) => e.locationIds.includes(loc.id));
  if (atLocation.length > 0) return atLocation;

  if (locationSlug === "at-the-court") {
    const courtPortable = exercises.filter(
      (e) =>
        e.locationSlugs.includes("at-the-court") ||
        (e.locationSlugs.includes("home") && e.equipment.length === 0)
    );
    if (courtPortable.length > 0) return courtPortable;
  }

  return atLocation;
}

export type MemberCoachInitialData = {
  programsCatalog: ProgramCatalogRow[];
};

export async function loadMemberCoachData(): Promise<
  { ok: true; data: MemberCoachInitialData } | { error: string }
> {
  const auth = await requireProMember();
  if (auth.error || !auth.supabase) return { error: auth.error ?? "Unauthorized" };

  try {
    const programsCatalog = await fetchProgramsCatalog(auth.supabase);
    return { ok: true, data: { programsCatalog } };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Could not load coach data." };
  }
}

export type SendMemberCoachMessageResult =
  | { type: "text"; text: string }
  | { type: "consultation"; text: string; prompt: ConsultationPrompt }
  | {
      type: "recommend_programs";
      introText: string;
      programs: ProgramCatalogRow[];
    }
  | { type: "workout_proposal"; proposal: WorkoutProposal; locationSlug?: string }
  | { error: string };

export async function sendMemberCoachMessage(input: {
  history: ChatHistoryMessage[];
  userMessage: string;
  programsCatalog: ProgramCatalogRow[];
}): Promise<SendMemberCoachMessageResult> {
  const auth = await requireProMember();
  if (auth.error || !auth.supabase || !auth.user) return { error: auth.error ?? "Unauthorized" };

  const userMessage = input.userMessage.trim();
  if (!userMessage) return { error: "Message cannot be empty." };

  try {
    const ctx = await loadProgramAiContext(auth.supabase);
    const publishedExercises = ctx.exercises.filter((e) => e.status === "published");
    if (publishedExercises.length === 0) {
      return { error: "Workouts are temporarily unavailable. Please try again later." };
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

    const wantsProgram = coachWantsProgram(userTexts);
    const wantsRecommend =
      coachShouldRecommendCatalogOnly(userMessage) || wantsProgram;
    const wantsWorkoutCreate =
      !wantsRecommend &&
      (userTexts.some((t) => coachShouldCreateNew(t)) ||
        shouldRunConsultation(input.history, userMessage));

    const consultation = buildConsultationState(
      input.history,
      userMessage,
      equipmentLibrary,
      locations
    );
    const consultationComplete = isConsultationComplete(
      consultation,
      wantsProgram,
      equipmentLibrary
    );

    if ((wantsWorkoutCreate || wantsProgram) && !consultationComplete) {
      const topic = getCurrentConsultationTopic(consultation, wantsProgram);
      if (topic) {
        const prompt = buildConsultationPrompt(topic, locations, equipmentLibrary, wantsProgram);
        const text = buildConsultationResponseText(consultation, topic, prompt.question, locations);
        return { type: "consultation", text, prompt };
      }
    }

    const generationExercises =
      wantsWorkoutCreate && consultationComplete
        ? exercisesForLocation(publishedExercises, consultation.locationSlug, locations)
        : publishedExercises;

    const catalogById = new Map(generationExercises.map((e) => [e.id, e.title]));
    const exerciseCatalog = formatExerciseCatalogForPrompt(generationExercises);

    const fullHistory: ChatHistoryMessage[] = [
      ...input.history,
      { role: "user", parts: [{ text: userMessage }] },
    ];

    const [profileContext, trainingContext] = await Promise.all([
      loadProfileAiContext(auth.supabase, auth.user.id),
      loadMemberCoachTrainingContext(auth.supabase, auth.user.id),
    ]);

    const userContextBlock =
      buildMemberAiAthleteContext(profileContext) + memberTrainingContextBlock(trainingContext);

    const systemPromptTemplate = await loadAiPrompt(auth.supabase, "ai_member_coach_system");
    const inCreateFlow = wantsWorkoutCreate || wantsRecommend || wantsProgram;
    const consultationBrief = inCreateFlow
      ? formatConsultationGuide(consultation, wantsProgram, equipmentLibrary)
      : undefined;

    const forcedTool: AiCoachToolName | undefined =
      wantsWorkoutCreate && consultationComplete
        ? "generate_workout"
        : wantsRecommend && (wantsProgram ? consultationComplete : true)
          ? "recommend_programs"
          : undefined;

    const coachParams = {
      programsCatalog: catalogForAiPayload(input.programsCatalog),
      exerciseCatalog,
      catalogById,
      systemPromptTemplate,
      userContextBlock,
      extraTemplateVars: { methodology_block: AI_COACH_METHODOLOGY_BLOCK },
      creationOnly: inCreateFlow,
      consultationBrief,
      toolsEnabled:
        !inCreateFlow ||
        (wantsWorkoutCreate && consultationComplete) ||
        (wantsRecommend && (!wantsProgram || consultationComplete)),
      audience: "member" as const,
      allowedTools: MEMBER_TOOLS,
    };

    const generationBrief =
      forcedTool != null
        ? formatGenerationCoachBrief(
            consultation,
            wantsProgram,
            forcedTool === "recommend_programs" ? "recommend_programs" : "generate_workout"
          )
        : consultationBrief;

    const generationHistory: ChatHistoryMessage[] =
      forcedTool != null
        ? [
            {
              role: "user",
              parts: [
                {
                  text: [
                    consultation.goal ?? userMessage,
                    "",
                    `Consultation is complete. Call ${forcedTool} now using the consultation parameters in your instructions.`,
                  ].join("\n"),
                },
              ],
            },
          ]
        : fullHistory;

    let result = await chatWithAiCoach({
      history: forcedTool != null ? generationHistory : fullHistory,
      ...coachParams,
      consultationBrief: generationBrief,
      forcedTool,
    });

    if (
      wantsWorkoutCreate &&
      !consultationComplete &&
      result.type === "functionCall" &&
      (result.name === "generate_workout" || result.name === "recommend_programs")
    ) {
      result = await chatWithAiCoach({
        history: fullHistory,
        ...coachParams,
        toolsEnabled: false,
        consultationBrief: `${consultationBrief ?? ""}\n\n## Not ready to generate yet\nReply with one friendly question about the next missing topic. Do not call tools.`,
      });
    }

    if (forcedTool != null && result.type === "text") {
      result = await chatWithAiCoach({
        history: [
          ...generationHistory,
          { role: "model", parts: [{ text: result.text }] },
          {
            role: "user",
            parts: [
              {
                text: `Call ${forcedTool} now. Return the tool call — do not reply with prose only.`,
              },
            ],
          },
        ],
        ...coachParams,
        consultationBrief: generationBrief,
        forcedTool,
      });
    }

    if (result.type === "text") {
      const cleaned = sanitizeCoachChatReply(result.text);
      const text = cleaned.trim() || result.text.trim();
      if (!text) throw new Error("AI returned an empty response. Try again.");
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
      const { proposal: rotated } = ensureWorkoutProposalRotation(result.args, publishedExercises);
      const { proposal } = ensureWorkoutProposalStructure(rotated, publishedExercises, {
        locationSlug:
          consultation.locationSlug && isValidLocationSlug(consultation.locationSlug)
            ? consultation.locationSlug
            : undefined,
      });
      return {
        type: "workout_proposal",
        proposal,
        locationSlug: consultation.locationSlug,
      };
    }

    return { error: "Unexpected coach response. Try again." };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Chat failed." };
  }
}

export type SaveMemberCoachWorkoutResult =
  | { ok: true; slug: string; title: string; playHref: string }
  | { error: string };

export async function saveMemberCoachWorkout(
  proposal: WorkoutProposal,
  options?: { locationSlug?: string }
): Promise<SaveMemberCoachWorkoutResult> {
  const auth = await requireProMember();
  if (auth.error || !auth.supabase || !auth.user) return { error: auth.error ?? "Unauthorized" };

  try {
    const ctx = await loadProgramAiContext(auth.supabase);
    const publishedExercises = ctx.exercises.filter((e) => e.status === "published");
    const allowedExerciseIds = new Set(publishedExercises.map((e) => e.id));

    const { proposal: rotated } = ensureWorkoutProposalRotation(proposal, publishedExercises);
    const { proposal: fixed } = ensureWorkoutProposalStructure(rotated, publishedExercises, {
      locationSlug: options?.locationSlug,
    });

    const saved = await saveAiWorkoutProgram(auth.supabase, fixed, {
      status: "published",
      allowedExerciseIds,
      createdByUserId: auth.user.id,
      locationSlug: options?.locationSlug,
    });

    const { sessions } = await fetchProgramSessionsForProgram(auth.supabase, saved.programId);
    const session = sessions[0];
    if (!session) {
      return { error: "Workout saved but session not found." };
    }

    revalidatePath("/member");
    revalidatePath("/programs");

    return {
      ok: true,
      slug: saved.slug,
      title: saved.title,
      playHref: playHrefForSession(saved.slug, session.id),
    };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Could not save workout." };
  }
}
