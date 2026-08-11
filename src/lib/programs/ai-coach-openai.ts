import OpenAI from "openai";
import type {
  ChatCompletionMessageParam,
  ChatCompletionTool,
} from "openai/resources/chat/completions";
import { requireOpenAiApiKey, resolveOpenAiModel } from "@/lib/openai-config";
import {
  buildSystemInstruction,
  IncompleteToolCallError,
  parseProgramProposal,
  parseRecommendPrograms,
  parseWorkoutProposal,
  type AiCoachChatResult,
  type AiCoachToolName,
  type ChatHistoryMessage,
} from "@/lib/programs/ai-coach-gemini";
import type { ProgramCatalogForAI } from "@/lib/programs/programs-catalog";

type FunctionTool = Extract<ChatCompletionTool, { type: "function" }>;

const EXERCISE_PROPERTIES = {
  exercise_id: {
    type: "string",
    description: "UUID from the exercise catalog — copy exactly from [uuid] in catalog",
  },
  duration_seconds: {
    type: "number",
    description:
      "Timed work in seconds. For both_sides catalog exercises this is TOTAL for both sides (app splits evenly). Warm-up/cool-down typically 30–60s.",
  },
  duration_minutes: { type: "number", description: "Avoid — prefer duration_seconds" },
  sets: {
    type: "number",
    description:
      "Sets (fixed across the 8-week block). For main timed work use 2 or 3 rounds with duration_seconds.",
  },
  reps: {
    type: "number",
    description: "Reps per set. For both_sides: reps PER SIDE.",
  },
  rest_between_sets_seconds: {
    type: "number",
    description:
      "Rest between sets. For sets×reps with sets >= 2 use 30. For timed intervals match tag rest band.",
  },
  rest_after_seconds: {
    type: "number",
    description:
      "Rest after the final set before the next exercise. Required on every exercise except the last in a session.",
  },
  phase: {
    type: "string",
    description: "warmup, main, or cooldown — every exercise must have a phase",
  },
  choice_group: {
    type: "string",
    description:
      "Optional. Same value on 2–3 warmup or cooldown exercises = athlete picks one alternative.",
  },
  note: {
    type: "string",
    description:
      "Coach note shown in-workout. For sets×reps with sets >= 2 include: Rest 30 sec between sets. Otherwise technique only — never progression or load.",
  },
  load_prescription: {
    type: "string",
    description: "Leave blank. Athletes choose their own weight — never invent kg/lb amounts.",
  },
} as const;

const OPENAI_TOOLS: FunctionTool[] = [
  {
    type: "function",
    function: {
      name: "generate_program",
      description:
        "Create a multi-week training program as week-1 session templates only (sessions_per_week entries). Default duration_weeks=8 unless the brief requests another length (e.g. 2 or 3). The app expands to duration_weeks and progresses prescriptions. Each session needs exactly 5 warmup, main (rotation/anti-rotation), and exactly 5 cooldown exercises. Never recommend existing published programs.",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string" },
          description: { type: "string", description: "Short summary for program cards" },
          body: { type: "string", description: "Optional longer copy for the program detail page" },
          design_rationale: {
            type: "string",
            description:
              "3–6 sentences: weekly split logic, day roles, footwork 2/1/2, progression intent, and any tradeoffs. For admin review.",
          },
          duration_weeks: {
            type: "number",
            description:
              "Program length in weeks. Default 8. Use 2, 3, etc. when the brief/admin explicitly asks for a shorter or different block (1–16).",
          },
          sessions_per_week: {
            type: "number",
            description: "Training sessions per week (typically 3).",
          },
          minutes_per_session: { type: "number" },
          location_slug: {
            type: "string",
            description: "Location slug from the library (e.g. home, gym). Defaults to home.",
          },
          sessions: {
            type: "array",
            description:
              "ONE WEEK ONLY: return exactly sessions_per_week session templates. App expands to duration_weeks. Each session: exactly 5 warmup, main, exactly 5 cooldown.",
            items: {
              type: "object",
              properties: {
                name: { type: "string", description: "e.g. Day 1: Bilateral lower + push/pull" },
                description: { type: "string" },
                duration_minutes: { type: "number" },
                exercises: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: EXERCISE_PROPERTIES,
                    required: ["exercise_id", "rest_after_seconds", "phase"],
                  },
                },
              },
              required: ["name", "exercises"],
            },
          },
        },
        required: ["title", "description", "duration_weeks", "sessions_per_week", "sessions"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "generate_workout",
      description:
        "Create exactly one workout session (not an 8-week program). Structure: exactly 5 warmup → main (include rotation/anti-rotation; prep before explosive) → exactly 5 cooldown. Use catalog UUIDs only.",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string" },
          description: { type: "string" },
          design_rationale: {
            type: "string",
            description:
              "2–5 sentences: why this session structure, exercise order, and key rule choices. For admin review.",
          },
          exercises: {
            type: "array",
            items: {
              type: "object",
              properties: EXERCISE_PROPERTIES,
              required: ["exercise_id", "rest_after_seconds", "phase"],
            },
          },
        },
        required: ["title", "description", "exercises"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "recommend_programs",
      description:
        "Browse the existing published program catalog ONLY when the admin explicitly asks to find, recommend, list, or compare programs already in the library. Never use when they ask to create, build, make, or generate something new.",
      parameters: {
        type: "object",
        properties: {
          intro_text: { type: "string", description: "Short markdown intro before the cards" },
          program_ids: {
            type: "array",
            items: { type: "string" },
            description: "1–5 program UUIDs from the catalog only",
          },
        },
        required: ["intro_text", "program_ids"],
      },
    },
  },
];

function toOpenAiMessages(history: ChatHistoryMessage[]): ChatCompletionMessageParam[] {
  return history.map((m) => ({
    role: m.role === "model" ? "assistant" : "user",
    content: m.parts.map((p) => p.text).join("\n"),
  }));
}

function parseToolArgsJson(raw: string): Record<string, unknown> | null {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
    return parsed as Record<string, unknown>;
  } catch {
    return null;
  }
}

export async function chatWithAiCoachOpenAI(params: {
  history: ChatHistoryMessage[];
  programsCatalog: ProgramCatalogForAI[];
  exerciseCatalog: string;
  catalogById: Map<string, string>;
  bothSidesByExerciseId?: Map<string, boolean>;
  systemPromptTemplate: string;
  userContextBlock: string;
  extraTemplateVars?: Record<string, string>;
  creationOnly?: boolean;
  consultationBrief?: string;
  toolsEnabled?: boolean;
  forcedTool?: AiCoachToolName;
  audience?: "admin" | "member";
  allowedTools?: AiCoachToolName[];
}): Promise<AiCoachChatResult> {
  const apiKey = requireOpenAiApiKey();

  if (params.catalogById.size === 0) {
    throw new Error("Your exercise library has no published exercises. Add and publish exercises first.");
  }

  const toolsEnabled = params.toolsEnabled !== false;
  const allowedToolSet = new Set<AiCoachToolName>(
    params.allowedTools ?? ["generate_program", "generate_workout", "recommend_programs"]
  );
  const filteredTools = OPENAI_TOOLS.filter((t) =>
    allowedToolSet.has(t.function.name as AiCoachToolName)
  );
  const activeTools: FunctionTool[] =
    params.forcedTool != null
      ? filteredTools.filter((t) => t.function.name === params.forcedTool)
      : filteredTools;

  const client = new OpenAI({ apiKey });
  const model = resolveOpenAiModel();

  async function runTurn(
    creationOnly: boolean,
    history: ChatHistoryMessage[],
    turnToolsEnabled: boolean
  ): Promise<AiCoachChatResult> {
    const system = buildSystemInstruction(
      params.systemPromptTemplate,
      {
        programsCatalog: params.programsCatalog,
        exerciseCatalog: params.exerciseCatalog,
        exerciseCount: params.catalogById.size,
        userContextBlock: params.userContextBlock,
        extraTemplateVars: params.extraTemplateVars,
      },
      {
        creationOnly,
        consultationBrief: params.consultationBrief,
        toolsEnabled: turnToolsEnabled,
        omitProgramsCatalog: params.forcedTool != null,
        audience: params.audience,
      }
    );

    // gpt-5.6+ defaults to reasoning on chat.completions; function tools require
    // reasoning_effort: "none" (or migrating to /v1/responses).
    const response = await client.chat.completions.create({
      model,
      messages: [{ role: "system", content: system }, ...toOpenAiMessages(history)],
      ...(turnToolsEnabled
        ? {
            tools: activeTools,
            tool_choice: params.forcedTool
              ? { type: "function" as const, function: { name: params.forcedTool } }
              : ("auto" as const),
            reasoning_effort: "none" as const,
          }
        : {}),
      max_completion_tokens: turnToolsEnabled ? 32768 : 8192,
    });

    const message = response.choices[0]?.message;
    if (!message) {
      throw new Error("AI returned an empty response. Try again.");
    }

    const toolCalls = message.tool_calls ?? [];
    let failedToolName: string | undefined;

    for (const call of toolCalls) {
      if (call.type !== "function") continue;
      failedToolName = call.function.name;
      const args = parseToolArgsJson(call.function.arguments ?? "");
      if (!args) continue;

      if (call.function.name === "recommend_programs") {
        const parsed = parseRecommendPrograms(args);
        if (parsed) return { type: "functionCall", name: "recommend_programs", args: parsed };
      }
      if (call.function.name === "generate_workout") {
        const parsed = parseWorkoutProposal(
          args,
          params.catalogById,
          params.bothSidesByExerciseId ?? new Map()
        );
        if (parsed) return { type: "functionCall", name: "generate_workout", args: parsed };
      }
      if (call.function.name === "generate_program") {
        const parsed = parseProgramProposal(
          args,
          params.catalogById,
          params.bothSidesByExerciseId ?? new Map()
        );
        if (parsed) return { type: "functionCall", name: "generate_program", args: parsed };
      }
    }

    const text = message.content?.trim();
    if (text) return { type: "text", text };

    if (failedToolName) {
      throw new IncompleteToolCallError(failedToolName);
    }

    const finish = response.choices[0]?.finish_reason;
    if (finish === "length") {
      throw new Error("The AI response was cut off. Try a shorter message or try again.");
    }
    throw new Error("AI returned an empty response. Try again.");
  }

  function isRetryableGenerationError(err: unknown): boolean {
    if (err instanceof IncompleteToolCallError) return true;
    if (err instanceof Error) {
      return err.message.includes("empty response") || err.message.includes("cut off");
    }
    return false;
  }

  async function runTurnWithToolRetries(
    creationOnly: boolean,
    initialHistory: ChatHistoryMessage[],
    turnToolsEnabled: boolean
  ): Promise<AiCoachChatResult> {
    let history = initialHistory;
    const toolName = params.forcedTool ?? "generate_program";
    const retryMessages = [
      `Call ${toolName} now with a complete payload. Copy every exercise_id exactly from catalog UUIDs in square brackets. Include title, description, and exercises with phase, rest_after_seconds (between exercises), rest_between_sets_seconds=30 for sets×reps with sets >= 2 (plus note "Rest 30 sec between sets"), and rest_between_sets_seconds when using timed sets (duration + sets >= 2).`,
      `Your previous response was empty or incomplete. Call ${toolName} again with a compact payload. For programs: return ONLY sessions_per_week session templates (one training week). Each session needs at least 5 warmup exercises (duration_seconds: 60 each), main (include rotation or anti-rotation), and cooldown (≥5 at 60s).`,
      `Final attempt: call ${toolName} only — no prose. Use fewer exercises per session if needed, but return a valid complete tool call.`,
    ];

    for (let attempt = 0; attempt <= retryMessages.length; attempt++) {
      try {
        return await runTurn(creationOnly, history, turnToolsEnabled);
      } catch (err) {
        if (!isRetryableGenerationError(err) || attempt >= retryMessages.length) {
          if (err instanceof IncompleteToolCallError || isRetryableGenerationError(err)) {
            throw new Error(
              "The coach could not finish the draft after several tries. Click send or try again — no need to re-enter consultation answers."
            );
          }
          throw err;
        }
        history = [...history, { role: "user", parts: [{ text: retryMessages[attempt]! }] }];
      }
    }

    throw new Error("Generation failed. Please try again.");
  }

  async function runTurnWithRetry(
    creationOnly: boolean,
    history: ChatHistoryMessage[],
    turnToolsEnabled: boolean
  ): Promise<AiCoachChatResult> {
    if (turnToolsEnabled && creationOnly) {
      return runTurnWithToolRetries(creationOnly, history, turnToolsEnabled);
    }
    try {
      return await runTurn(creationOnly, history, turnToolsEnabled);
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      if (!message.includes("empty response")) throw err;
      return runTurn(
        creationOnly,
        [
          ...history,
          {
            role: "user",
            parts: [
              {
                text: "Please reply with a short helpful message (one question if gathering details).",
              },
            ],
          },
        ],
        turnToolsEnabled
      );
    }
  }

  const creationOnly = params.creationOnly === true;
  const first = await runTurnWithRetry(creationOnly, params.history, toolsEnabled);
  if (creationOnly && first.type === "functionCall" && first.name === "recommend_programs") {
    const second = await runTurnWithRetry(true, params.history, toolsEnabled);
    if (second.type === "functionCall" && second.name === "recommend_programs") {
      throw new Error(
        "The coach tried to recommend existing programs instead of creating a new one. Please try again with your program details (duration, frequency, goals)."
      );
    }
    return second;
  }

  return first;
}
