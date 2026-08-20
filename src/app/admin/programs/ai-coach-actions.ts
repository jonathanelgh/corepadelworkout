"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { getIsAdmin } from "@/utils/supabase/is-admin";
import { loadAiPrompt } from "@/lib/programs/ai-prompts";
import {
  chatWithAiCoach,
  buildSystemInstruction,
  type ChatHistoryMessage,
  type AiCoachChatResult,
  type ProgramProposal,
  type WorkoutProposal,
} from "@/lib/programs/ai-coach-gemini";
import { getAiCoachOpenAiTools } from "@/lib/programs/ai-coach-openai";
import {
  resolveAiCoachProvider,
  type AiCoachProvider,
} from "@/lib/programs/ai-coach-provider";
import { resolveProgramDurationWeeks } from "@/lib/programs/program-duration";
import {
  catalogForAiPayload,
  fetchProgramsCatalog,
  type ProgramCatalogRow,
} from "@/lib/programs/programs-catalog";
import { formatExerciseCatalogForPrompt, loadProgramAiContext, type ExerciseCatalogEntry } from "@/lib/programs/exercise-catalog";
import { filterCatalogByTrainingLevel } from "@/lib/programs/exercise-level-eligibility";
import { parseTrainingLevelFromBrief } from "@/lib/programs/program-prescription-rules";
import {
  listMembersForAiPicker,
  loadProfileAiContext,
  buildAdminAiAthleteContext,
  isOnboardingLevel,
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
  ensureProgramProposalStructure,
  ensureWorkoutProposalStructure,
  resolveSessionEnforcementOptions,
} from "@/lib/programs/ensure-session-structure";
import {
  debugLogFromProgram,
  debugLogFromWorkout,
  type AiGenerationDebugLog,
} from "@/lib/programs/ai-generation-debug";
import { saveAiWorkoutProgram } from "@/lib/programs/save-ai-workout";
import { saveAiProgram } from "@/lib/programs/save-ai-program";
import { generateProgramCoverImage } from "@/lib/programs/generate-program-cover";
import { validateProgramProposal, validateWorkoutProposal } from "@/lib/programs/validate-ai-coach-proposal";

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
  | { type: "workout_proposal"; proposal: WorkoutProposal; debugLog: AiGenerationDebugLog }
  | { type: "program_proposal"; proposal: ProgramProposal; debugLog: AiGenerationDebugLog }
  | { error: string };

export async function sendAiCoachMessage(input: {
  history: ChatHistoryMessage[];
  userMessage: string;
  programsCatalog: ProgramCatalogRow[];
  targetUserId?: string | null;
  /** Admin override for workout structure level; omit to use member onboarding when personalized. */
  trainingLevel?: string | null;
  /** LLM provider for generation / chat. Defaults to Gemini. */
  provider?: AiCoachProvider | null;
}): Promise<SendAiCoachMessageResult> {
  const auth = await requireAdmin();
  if (auth.error || !auth.supabase) return { error: auth.error ?? "Unauthorized" };

  const provider = resolveAiCoachProvider(input.provider);
  async function chatWithAiCoachOpenAIviaEdge(params: {
    history: ChatHistoryMessage[];
    programsCatalog: unknown[];
    exerciseCatalog: string;
    catalogById: Map<string, string>;
    bothSidesByExerciseId?: Map<string, boolean>;
    systemPromptTemplate: string;
    userContextBlock: string;
    extraTemplateVars?: Record<string, string>;
    creationOnly?: boolean;
    consultationBrief?: string;
    toolsEnabled?: boolean;
    forcedTool?: string | undefined;
    audience?: "admin" | "member";
  }): Promise<AiCoachChatResult> {
    const systemPrompt = buildSystemInstruction(
      params.systemPromptTemplate,
      {
        programsCatalog: params.programsCatalog as never[],
        exerciseCatalog: params.exerciseCatalog,
        exerciseCount: params.catalogById.size,
        userContextBlock: params.userContextBlock,
        extraTemplateVars: params.extraTemplateVars,
      },
      {
        creationOnly: params.creationOnly,
        consultationBrief: params.consultationBrief,
        toolsEnabled: params.toolsEnabled,
        omitProgramsCatalog: params.forcedTool != null,
        audience: params.audience,
      }
    );

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
    if (!supabaseUrl) throw new Error("NEXT_PUBLIC_SUPABASE_URL not set.");

    const edgeUrl = `${supabaseUrl}/functions/v1/ai-coach-openai-generate`;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

    const toolsEnabled = params.toolsEnabled !== false;
    const forcedTool = params.forcedTool ?? null;
    const tools = getAiCoachOpenAiTools();

    async function attempt(callHistory: ChatHistoryMessage[]): Promise<AiCoachChatResult> {
      const res = await fetch(edgeUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(serviceKey ? { Authorization: `Bearer ${serviceKey}` } : {}),
        },
        body: JSON.stringify({
          history: callHistory,
          systemPrompt,
          toolsEnabled,
          forcedTool,
          tools,
        }),
      });

      const payload = (await res.json().catch(() => null)) as
        | { type?: string; error?: string; name?: string; args?: Record<string, unknown>; text?: string }
        | null;

      if (!payload) {
        throw new Error(`Edge function returned invalid JSON (HTTP ${res.status}).`);
      }
      // Edge function errors should always include { type: "error" }, but keep a fallback
      // for older deployments that may return `{ error: "..." }` without `type`.
      if (payload.type === "error" || typeof payload.error === "string") {
        throw new Error(payload.error ?? "Edge generation failed.");
      }
      if (payload.type === "text") {
        const text = typeof payload.text === "string" ? payload.text : "";
        return { type: "text", text };
      }
      if (payload.type === "functionCall") {
        const name = typeof payload.name === "string" ? payload.name : "";
        if (!name) throw new Error("Edge function returned functionCall without name.");
        if (typeof payload.args !== "object" || payload.args == null) {
          throw new Error(`Edge function returned functionCall ${name} without args.`);
        }
        return {
          type: "functionCall",
          name: name as any,
          args: payload.args as any,
        };
      }
      const preview = (() => {
        try {
          return JSON.stringify(payload).slice(0, 500);
        } catch {
          return "[unserializable payload]";
        }
      })();
      throw new Error(
        `Edge function returned unknown payload (type=${String(payload.type)}). Payload preview: ${preview}`
      );
    }

    // Minimal tool-call retry to cover empty/incomplete tool calls until we add QC fix-loop.
    if (!toolsEnabled || !forcedTool) {
      return await attempt(params.history);
    }

    try {
      return await attempt(params.history);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      const isToolParseError =
        msg.includes("parse") || msg.includes("empty") || msg.includes("tool");
      if (!isToolParseError) throw e;

      if (!forcedTool) throw e;
      const retryHistory: ChatHistoryMessage[] = [
        ...params.history,
        {
          role: "user",
          parts: [
            {
              text: `Call ${forcedTool} now and return ONLY a valid tool call with JSON args (no prose).`,
            },
          ],
        },
      ];
      return await attempt(retryHistory);
    }
  }

  const runCoach =
    provider === "openai" ? chatWithAiCoachOpenAIviaEdge : chatWithAiCoach;

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

    const systemPromptTemplate = await loadAiPrompt(auth.supabase, "ai_coach_system");
    const profileContext = input.targetUserId
      ? await loadProfileAiContext(auth.supabase, input.targetUserId)
      : null;
    const dropdownLevel = isOnboardingLevel(input.trainingLevel) ? input.trainingLevel : null;
    const chatLevel = parseTrainingLevelFromBrief(
      [consultation.goal, userMessage].filter(Boolean).join("\n")
    );
    const adminTrainingLevel = dropdownLevel ?? chatLevel;
    const userContextBlock = buildAdminAiAthleteContext(profileContext, adminTrainingLevel);
    const enforcementOptions = resolveSessionEnforcementOptions({
      locationSlug:
        consultation.locationSlug && isValidLocationSlug(consultation.locationSlug)
          ? consultation.locationSlug
          : undefined,
      trainingLevel: adminTrainingLevel,
      athleteContext: userContextBlock,
      goal: consultation.goal,
    });
    const levelCap = enforcementOptions.trainingLevel ?? "beginner";

    const generationExercises = filterCatalogByTrainingLevel(
      inCreateFlow && consultationComplete
        ? exercisesForLocation(
            publishedExercises,
            consultation.locationSlug,
            locations
          )
        : publishedExercises,
      levelCap
    );

    const catalogById = new Map(generationExercises.map((e) => [e.id, e.title]));
    const bothSidesByExerciseId = new Map(
      generationExercises.map((e) => [e.id, e.bothSides])
    );
    const exerciseCatalogById = new Map(
      generationExercises.map((e) => [e.id, e])
    );
    const exerciseCatalog = formatExerciseCatalogForPrompt(generationExercises);

    const fullHistory: ChatHistoryMessage[] = [
      ...input.history,
      { role: "user", parts: [{ text: userMessage }] },
    ];

    const consultationBrief = inCreateFlow
      ? formatConsultationGuide(consultation, isProgram, equipmentLibrary)
      : undefined;

    const coachParams = {
      programsCatalog: catalogForAiPayload(input.programsCatalog),
      exerciseCatalog,
      catalogById,
      bothSidesByExerciseId,
      systemPromptTemplate,
      userContextBlock,
      creationOnly: inCreateFlow,
      consultationBrief,
      toolsEnabled: !inCreateFlow || consultationComplete,
      audience: "admin" as const,
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

    let result = await runCoach({
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
      result = await runCoach({
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
      result = await runCoach({
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
      let rawProposal = result.args;
      for (let attempt = 0; attempt < 3; attempt++) {
        const validation = validateWorkoutProposal(rawProposal, { exerciseCatalogById });
        if (validation.ok) break;

        if (attempt >= 2) {
          const first = validation.errors[0]?.message ?? "unknown validation error";
          throw new Error(
            `AI workout proposal failed validation after ${attempt + 1} attempts. First error: ${first}`
          );
        }

        const compactErrors = validation.errors
          .slice(0, 8)
          .map((e) => `- ${e.message}`)
          .join("\n");

        const fixHistory: ChatHistoryMessage[] = [
          ...generationHistory,
          {
            role: "user",
            parts: [
              {
                text: [
                  "Validator errors:",
                  compactErrors,
                  "",
                  `Fix and return ONLY the ${toolName} tool call with a fully valid payload (no prose).`,
                ].join("\n"),
              },
            ],
          },
        ];

        const retry = await runCoach({
          history: fixHistory,
          ...coachParams,
          consultationBrief: generationBrief,
          forcedTool: toolName,
          toolsEnabled: true,
        });

        if (retry.type !== "functionCall" || retry.name !== "generate_workout") {
          throw new Error("AI fix loop did not return a generate_workout tool call.");
        }

        rawProposal = retry.args;
      }

      const { proposal, warnings: structureWarnings } = ensureWorkoutProposalStructure(
        rawProposal,
        generationExercises,
        enforcementOptions
      );
      const allWarnings = [...structureWarnings];
      if (allWarnings.length > 0) {
        console.info("[ai-coach] workout enforcement:", allWarnings.join(" "));
      }
      const debugLog = debugLogFromWorkout({
        catalog: generationExercises,
        raw: rawProposal,
        final: proposal,
        enforcementChanges: allWarnings,
        trainingLevel: enforcementOptions.trainingLevel ?? null,
        locationSlug: enforcementOptions.locationSlug ?? null,
        goal: consultation.goal ?? null,
      });
      return { type: "workout_proposal", proposal, debugLog };
    }

    let rawProgramArgs = {
      ...result.args,
      duration_weeks: resolveProgramDurationWeeks(
        consultation.durationWeeks ?? result.args.duration_weeks
      ),
      sessions_per_week:
        consultation.sessionsPerWeek ?? result.args.sessions_per_week,
      minutes_per_session: consultation.minutes ?? result.args.minutes_per_session,
      location_slug:
        consultation.locationSlug && isValidLocationSlug(consultation.locationSlug)
          ? consultation.locationSlug
          : result.args.location_slug,
    };

    for (let attempt = 0; attempt < 3; attempt++) {
      const validation = validateProgramProposal(rawProgramArgs, { exerciseCatalogById });
      if (validation.ok) break;

      if (attempt >= 2) {
        const first = validation.errors[0]?.message ?? "unknown validation error";
        throw new Error(
          `AI program proposal failed validation after ${attempt + 1} attempts. First error: ${first}`
        );
      }

      const compactErrors = validation.errors
        .slice(0, 8)
        .map((e) => `- ${e.message}`)
        .join("\n");

      const fixHistory: ChatHistoryMessage[] = [
        ...generationHistory,
        {
          role: "user",
          parts: [
            {
              text: [
                "Validator errors:",
                compactErrors,
                "",
                `Fix and return ONLY the ${toolName} tool call with a fully valid payload (no prose).`,
              ].join("\n"),
            },
          ],
        },
      ];

      const retry = await runCoach({
        history: fixHistory,
        ...coachParams,
        consultationBrief: generationBrief,
        forcedTool: toolName,
        toolsEnabled: true,
      });

      if (retry.type !== "functionCall" || retry.name !== "generate_program") {
        throw new Error("AI fix loop did not return a generate_program tool call.");
      }

      rawProgramArgs = {
        ...retry.args,
        duration_weeks: resolveProgramDurationWeeks(
          consultation.durationWeeks ?? retry.args.duration_weeks
        ),
        sessions_per_week:
          consultation.sessionsPerWeek ?? retry.args.sessions_per_week,
        minutes_per_session: consultation.minutes ?? retry.args.minutes_per_session,
        location_slug:
          consultation.locationSlug && isValidLocationSlug(consultation.locationSlug)
            ? consultation.locationSlug
            : retry.args.location_slug,
      };
    }

    const { proposal, warnings: structureWarnings } = ensureProgramProposalStructure(
      rawProgramArgs,
      generationExercises,
      enforcementOptions
    );
    const allWarnings = [...structureWarnings];
    if (allWarnings.length > 0) {
      console.info("[ai-coach] program enforcement:", allWarnings.join(" "));
    }
    const debugLog = debugLogFromProgram({
      catalog: generationExercises,
      raw: rawProgramArgs,
      final: proposal,
      enforcementChanges: allWarnings,
      trainingLevel: enforcementOptions.trainingLevel ?? null,
      locationSlug: proposal.location_slug ?? null,
      goal: consultation.goal ?? null,
    });
    return { type: "program_proposal", proposal, debugLog };
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
  options?: {
    publish?: boolean;
    generateCover?: boolean;
    trainingLevel?: string | null;
  }
): Promise<SaveAiCoachProgramResult> {
  const auth = await requireAdmin();
  if (auth.error || !auth.supabase) return { error: auth.error ?? "Unauthorized" };

  try {
    // Round-trip through JSON so the server action never receives non-serializable client junk.
    const cleanProposal = JSON.parse(JSON.stringify(proposal)) as ProgramProposal;
    if (!cleanProposal?.sessions?.length) {
      return { error: "Program has no sessions to save." };
    }

    const ctx = await loadProgramAiContext(auth.supabase);
    const publishedExercises = ctx.exercises.filter((e) => e.status === "published");
    const allowedExerciseIds = new Set(publishedExercises.map((e) => e.id));
    const trainingLevel = isOnboardingLevel(options?.trainingLevel)
      ? options.trainingLevel
      : null;

    // Light touch on save: keep AI draft structure, only ensure weeks/defaults.
    // Full warm-up/tag enforcement already ran at generation time.
    const fixed: ProgramProposal = {
      ...cleanProposal,
      duration_weeks: resolveProgramDurationWeeks(cleanProposal.duration_weeks),
      sessions_per_week: Math.max(1, Math.floor(cleanProposal.sessions_per_week || 3)),
      design_rationale: undefined,
    };

    const saved = await saveAiProgram(auth.supabase, fixed, {
      status: options?.publish ? "published" : "draft",
      allowedExerciseIds,
      durationWeeks: fixed.duration_weeks,
      sessionsPerWeek: fixed.sessions_per_week,
      minutesPerSession: fixed.minutes_per_session,
      trainingLevel,
    });

    try {
      revalidatePath("/admin/programs");
      revalidatePath("/programs");
    } catch (revalidateErr) {
      console.warn("[saveAiCoachProgram] revalidate failed:", revalidateErr);
    }

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
    console.error("[saveAiCoachProgram]", e);
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

    const { proposal: fixed } = ensureWorkoutProposalStructure(proposal, publishedExercises);

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
