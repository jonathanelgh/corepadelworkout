import {
  GoogleGenerativeAI,
  SchemaType,
  type Content,
  type FunctionDeclaration,
} from "@google/generative-ai";
import { resolveGeminiModel } from "@/lib/gemini-config";
import { fillPromptTemplate } from "@/lib/programs/ai-prompts";
import {
  normalizeExercisePhases,
  parseChoiceGroup,
  parseSessionPhase,
  type SessionPhase,
} from "@/lib/programs/session-phase";
import type { ProgramCatalogForAI } from "./programs-catalog";

export type ChatHistoryMessage = {
  role: "user" | "model";
  parts: [{ text: string }];
};

export type WorkoutProposalExercise = {
  exercise_id: string;
  title: string;
  phase: SessionPhase;
  choice_group?: string;
  duration_minutes?: number;
  sets?: number;
  reps?: number;
  rest_after_seconds: number;
};

export type WorkoutProposal = {
  title: string;
  description: string;
  exercises: WorkoutProposalExercise[];
};

export type ProgramProposalSession = {
  name: string;
  description?: string;
  duration_minutes?: number;
  exercises: WorkoutProposalExercise[];
};

export type ProgramProposal = {
  title: string;
  description: string;
  body?: string;
  duration_weeks: number;
  sessions_per_week: number;
  minutes_per_session?: number;
  location_slug?: string;
  sessions: ProgramProposalSession[];
};

export type RecommendProgramsArgs = {
  intro_text: string;
  program_ids: string[];
};

export type AiCoachChatResult =
  | { type: "text"; text: string }
  | { type: "functionCall"; name: "recommend_programs"; args: RecommendProgramsArgs }
  | { type: "functionCall"; name: "generate_workout"; args: WorkoutProposal }
  | { type: "functionCall"; name: "generate_program"; args: ProgramProposal };

function buildSystemInstruction(
  template: string,
  params: {
    programsCatalog: ProgramCatalogForAI[];
    exerciseCatalog: string;
    exerciseCount: number;
    userContextBlock: string;
  },
  options?: { creationOnly?: boolean; consultationBrief?: string }
): string {
  const catalogJson = JSON.stringify(params.programsCatalog, null, 0);

  let out = fillPromptTemplate(template, {
    user_context_block: params.userContextBlock,
    programs_catalog: catalogJson,
    exercise_catalog: params.exerciseCatalog,
    exercise_count: String(params.exerciseCount),
    exercise_titles: "",
  });

  if (options?.consultationBrief?.trim()) {
    out += `\n\n${options.consultationBrief.trim()}`;
  }

  if (options?.creationOnly) {
    out += `

## CRITICAL — this message is a creation request
The admin asked you to build something new. Use generate_program or generate_workout.
Do NOT use recommend_programs — even if similar published programs exist in the catalog.`;
  }

  return out;
}

const TOOLS: FunctionDeclaration[] = [
  {
    name: "generate_program",
    description:
      "Create a brand-new multi-session training program from the exercise catalog (e.g. 4 weeks × 3 sessions/week). Each session must have warm-up, main (with rotation or anti-rotation), and cool-down. Never use this to point at existing published programs.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        title: { type: SchemaType.STRING },
        description: { type: SchemaType.STRING, description: "Short summary for program cards" },
        body: { type: SchemaType.STRING, description: "Optional longer copy for the program detail page" },
        duration_weeks: {
          type: SchemaType.NUMBER,
          description: "Program length in weeks (e.g. 4 for a 4-week block)",
        },
        sessions_per_week: {
          type: SchemaType.NUMBER,
          description: "Training sessions per week (e.g. 3)",
        },
        minutes_per_session: { type: SchemaType.NUMBER },
        location_slug: {
          type: SchemaType.STRING,
          description: "Location slug from the library (e.g. home, gym). Defaults to home.",
        },
        sessions: {
          type: SchemaType.ARRAY,
          description:
            "One entry per session in the full schedule. For 4 weeks × 3/week you MUST return 12 sessions. Each session has its own exercise list.",
          items: {
            type: SchemaType.OBJECT,
            properties: {
              name: { type: SchemaType.STRING, description: "e.g. Week 1 — Day 1: Lower body power" },
              description: { type: SchemaType.STRING },
              duration_minutes: { type: SchemaType.NUMBER },
              exercises: {
          type: SchemaType.ARRAY,
          items: {
            type: SchemaType.OBJECT,
            properties: {
              exercise_id: {
                type: SchemaType.STRING,
                description: "UUID from the exercise catalog — copy exactly from [uuid] in catalog",
              },
              duration_minutes: { type: SchemaType.NUMBER },
              sets: { type: SchemaType.NUMBER },
              reps: { type: SchemaType.NUMBER },
              rest_after_seconds: { type: SchemaType.NUMBER },
              phase: {
                type: SchemaType.STRING,
                description: "warmup, main, or cooldown — every exercise must have a phase",
              },
              choice_group: {
                type: SchemaType.STRING,
                description:
                  "Optional. Same value on 2–3 warmup or cooldown exercises = athlete picks one alternative.",
              },
            },
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
  {
    name: "generate_workout",
    description:
      "Create a brand-new single workout session from the exercise catalog. Use when the admin asks to create, build, make, or generate one custom session (one day only). Structure: warm-up → main (must include rotation or anti-rotation) → cool-down. Never use this to recommend existing published programs.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        title: { type: SchemaType.STRING },
        description: { type: SchemaType.STRING },
        exercises: {
          type: SchemaType.ARRAY,
          items: {
            type: SchemaType.OBJECT,
            properties: {
              exercise_id: {
                type: SchemaType.STRING,
                description: "UUID from the exercise catalog — copy exactly from [uuid] in catalog",
              },
              duration_minutes: { type: SchemaType.NUMBER },
              sets: { type: SchemaType.NUMBER },
              reps: { type: SchemaType.NUMBER },
              rest_after_seconds: { type: SchemaType.NUMBER },
              phase: {
                type: SchemaType.STRING,
                description: "warmup, main, or cooldown — every exercise must have a phase",
              },
              choice_group: {
                type: SchemaType.STRING,
                description:
                  "Optional. Same value on 2–3 warmup or cooldown exercises = athlete picks one alternative.",
              },
            },
            required: ["exercise_id", "rest_after_seconds", "phase"],
          },
        },
      },
      required: ["title", "description", "exercises"],
    },
  },
  {
    name: "recommend_programs",
    description:
      "Browse the existing published program catalog ONLY when the admin explicitly asks to find, recommend, list, or compare programs already in the library. Never use when they ask to create, build, make, or generate something new.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        intro_text: { type: SchemaType.STRING, description: "Short markdown intro before the cards" },
        program_ids: {
          type: SchemaType.ARRAY,
          items: { type: SchemaType.STRING },
          description: "1–5 program UUIDs from the catalog only",
        },
      },
      required: ["intro_text", "program_ids"],
    },
  },
];

function parseOptionalPositiveInt(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v) && v > 0) return Math.floor(v);
  return null;
}

function parseExerciseList(
  rawList: unknown,
  catalogById: Map<string, string>
): WorkoutProposalExercise[] {
  const exercises: WorkoutProposalExercise[] = [];
  const seenIds = new Set<string>();

  if (!Array.isArray(rawList)) return exercises;

  for (const raw of rawList) {
    if (!raw || typeof raw !== "object") continue;
    const ex = raw as Record<string, unknown>;
    const exercise_id = typeof ex.exercise_id === "string" ? ex.exercise_id.trim() : "";
    if (!exercise_id || !/^[0-9a-f-]{36}$/i.test(exercise_id)) continue;
    if (!catalogById.has(exercise_id) || seenIds.has(exercise_id)) continue;
    seenIds.add(exercise_id);

    const rest =
      typeof ex.rest_after_seconds === "number" && Number.isFinite(ex.rest_after_seconds)
        ? Math.max(0, Math.ceil(ex.rest_after_seconds))
        : 0;

    exercises.push({
      exercise_id,
      title: catalogById.get(exercise_id)!,
      phase: parseSessionPhase(ex.phase),
      choice_group: parseChoiceGroup(ex.choice_group) ?? undefined,
      duration_minutes:
        typeof ex.duration_minutes === "number" && Number.isFinite(ex.duration_minutes)
          ? Math.ceil(ex.duration_minutes)
          : undefined,
      sets: typeof ex.sets === "number" && Number.isFinite(ex.sets) ? Math.ceil(ex.sets) : undefined,
      reps: typeof ex.reps === "number" && Number.isFinite(ex.reps) ? Math.ceil(ex.reps) : undefined,
      rest_after_seconds: rest,
    });
  }

  return exercises;
}

function parseWorkoutProposal(
  args: Record<string, unknown>,
  catalogById: Map<string, string>
): WorkoutProposal | null {
  const title = typeof args.title === "string" ? args.title.trim() : "";
  const description = typeof args.description === "string" ? args.description.trim() : "";
  if (!title || !description) return null;

  const exercises = parseExerciseList(args.exercises, catalogById);
  if (exercises.length === 0) return null;
  return { title, description, exercises: normalizeExercisePhases(exercises) };
}

function parseProgramProposal(
  args: Record<string, unknown>,
  catalogById: Map<string, string>
): ProgramProposal | null {
  const title = typeof args.title === "string" ? args.title.trim() : "";
  const description = typeof args.description === "string" ? args.description.trim() : "";
  const duration_weeks = parseOptionalPositiveInt(args.duration_weeks) ?? 1;
  const sessions_per_week = parseOptionalPositiveInt(args.sessions_per_week) ?? 1;
  if (!title || !description) return null;

  const sessions: ProgramProposalSession[] = [];
  if (Array.isArray(args.sessions)) {
    for (const raw of args.sessions) {
      if (!raw || typeof raw !== "object") continue;
      const row = raw as Record<string, unknown>;
      const name = typeof row.name === "string" ? row.name.trim() : "";
      if (!name) continue;

      const exercises = parseExerciseList(row.exercises, catalogById);
      if (exercises.length === 0) continue;

      sessions.push({
        name,
        description: typeof row.description === "string" ? row.description.trim() : undefined,
        duration_minutes:
          typeof row.duration_minutes === "number" && Number.isFinite(row.duration_minutes)
            ? Math.ceil(row.duration_minutes)
            : undefined,
        exercises: normalizeExercisePhases(exercises),
      });
    }
  }

  if (sessions.length === 0) return null;

  return {
    title,
    description,
    body: typeof args.body === "string" ? args.body.trim() : undefined,
    duration_weeks,
    sessions_per_week,
    minutes_per_session:
      typeof args.minutes_per_session === "number" && Number.isFinite(args.minutes_per_session)
        ? Math.ceil(args.minutes_per_session)
        : undefined,
    location_slug:
      typeof args.location_slug === "string" ? args.location_slug.trim().toLowerCase() : undefined,
    sessions,
  };
}

function parseRecommendPrograms(args: Record<string, unknown>): RecommendProgramsArgs | null {
  const intro_text = typeof args.intro_text === "string" ? args.intro_text.trim() : "";
  if (!intro_text) return null;
  const program_ids: string[] = [];
  if (Array.isArray(args.program_ids)) {
    for (const id of args.program_ids) {
      if (typeof id === "string" && /^[0-9a-f-]{36}$/i.test(id)) {
        program_ids.push(id);
      }
    }
  }
  if (program_ids.length === 0) return null;
  return { intro_text, program_ids: program_ids.slice(0, 5) };
}

export async function chatWithAiCoach(params: {
  history: ChatHistoryMessage[];
  programsCatalog: ProgramCatalogForAI[];
  exerciseCatalog: string;
  catalogById: Map<string, string>;
  systemPromptTemplate: string;
  userContextBlock: string;
  creationOnly?: boolean;
  consultationBrief?: string;
}): Promise<AiCoachChatResult> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }
  const geminiApiKey = apiKey;

  if (params.catalogById.size === 0) {
    throw new Error("Your exercise library has no published exercises. Add and publish exercises first.");
  }

  async function runTurn(creationOnly: boolean): Promise<AiCoachChatResult> {
    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const model = genAI.getGenerativeModel({
      model: resolveGeminiModel(),
      systemInstruction: buildSystemInstruction(
        params.systemPromptTemplate,
        {
          programsCatalog: params.programsCatalog,
          exerciseCatalog: params.exerciseCatalog,
          exerciseCount: params.catalogById.size,
          userContextBlock: params.userContextBlock,
        },
        { creationOnly, consultationBrief: params.consultationBrief }
      ),
      tools: [{ functionDeclarations: TOOLS }],
      generationConfig: {
        maxOutputTokens: 8192,
      },
    });

    const contents: Content[] = params.history.map((m) => ({
      role: m.role,
      parts: m.parts,
    }));

    const result = await model.generateContent({ contents });
    const response = result.response;
    const parts = response.candidates?.[0]?.content?.parts ?? [];

    for (const part of parts) {
      const fc = part.functionCall;
      if (!fc?.name) continue;
      const args = (fc.args ?? {}) as Record<string, unknown>;
      if (fc.name === "recommend_programs") {
        const parsed = parseRecommendPrograms(args);
        if (parsed) return { type: "functionCall", name: "recommend_programs", args: parsed };
      }
      if (fc.name === "generate_workout") {
        const parsed = parseWorkoutProposal(args, params.catalogById);
        if (parsed) return { type: "functionCall", name: "generate_workout", args: parsed };
      }
      if (fc.name === "generate_program") {
        const parsed = parseProgramProposal(args, params.catalogById);
        if (parsed) return { type: "functionCall", name: "generate_program", args: parsed };
      }
    }

    const text = response.text()?.trim();
    if (text) return { type: "text", text };

    throw new Error("AI returned an empty response. Try again.");
  }

  const creationOnly = params.creationOnly === true;
  const first = await runTurn(creationOnly);
  if (
    creationOnly &&
    first.type === "functionCall" &&
    first.name === "recommend_programs"
  ) {
    const second = await runTurn(true);
    if (second.type === "functionCall" && second.name === "recommend_programs") {
      throw new Error(
        "The coach tried to recommend existing programs instead of creating a new one. Please try again with your program details (duration, frequency, goals)."
      );
    }
    return second;
  }

  return first;
}
