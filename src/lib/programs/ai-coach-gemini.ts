import {
  GoogleGenerativeAI,
  SchemaType,
  type Content,
  type FunctionDeclaration,
} from "@google/generative-ai";
import { resolveGeminiModel } from "@/lib/gemini-config";
import { fillPromptTemplate } from "@/lib/programs/ai-prompts";
import type { ProgramCatalogForAI } from "./programs-catalog";

export type ChatHistoryMessage = {
  role: "user" | "model";
  parts: [{ text: string }];
};

export type WorkoutProposalExercise = {
  exercise_id: string;
  title: string;
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

export type RecommendProgramsArgs = {
  intro_text: string;
  program_ids: string[];
};

export type AiCoachChatResult =
  | { type: "text"; text: string }
  | { type: "functionCall"; name: "recommend_programs"; args: RecommendProgramsArgs }
  | { type: "functionCall"; name: "generate_workout"; args: WorkoutProposal };

function buildSystemInstruction(
  template: string,
  params: {
    programsCatalog: ProgramCatalogForAI[];
    exerciseCatalog: string;
    exerciseCount: number;
    userContextBlock: string;
  }
): string {
  const catalogJson = JSON.stringify(params.programsCatalog, null, 0);

  return fillPromptTemplate(template, {
    user_context_block: params.userContextBlock,
    programs_catalog: catalogJson,
    exercise_catalog: params.exerciseCatalog,
    exercise_count: String(params.exerciseCount),
    exercise_titles: "",
  });
}

const TOOLS: FunctionDeclaration[] = [
  {
    name: "recommend_programs",
    description:
      "Recommend 1–5 existing published programs from the catalog when they match the admin's goal.",
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
  {
    name: "generate_workout",
    description:
      "Propose a custom workout using ONLY exercises from the exercise catalog (by exercise_id UUID).",
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
            },
            required: ["exercise_id", "rest_after_seconds"],
          },
        },
      },
      required: ["title", "description", "exercises"],
    },
  },
];

function parseWorkoutProposal(
  args: Record<string, unknown>,
  catalogById: Map<string, string>
): WorkoutProposal | null {
  const title = typeof args.title === "string" ? args.title.trim() : "";
  const description = typeof args.description === "string" ? args.description.trim() : "";
  if (!title || !description) return null;

  const exercises: WorkoutProposalExercise[] = [];
  const seenIds = new Set<string>();

  if (Array.isArray(args.exercises)) {
    for (const raw of args.exercises) {
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
        duration_minutes:
          typeof ex.duration_minutes === "number" && Number.isFinite(ex.duration_minutes)
            ? Math.ceil(ex.duration_minutes)
            : undefined,
        sets:
          typeof ex.sets === "number" && Number.isFinite(ex.sets) ? Math.ceil(ex.sets) : undefined,
        reps:
          typeof ex.reps === "number" && Number.isFinite(ex.reps) ? Math.ceil(ex.reps) : undefined,
        rest_after_seconds: rest,
      });
    }
  }

  if (exercises.length === 0) return null;
  return { title, description, exercises };
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
}): Promise<AiCoachChatResult> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }

  if (params.catalogById.size === 0) {
    throw new Error("Your exercise library has no published exercises. Add and publish exercises first.");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: resolveGeminiModel(),
    systemInstruction: buildSystemInstruction(params.systemPromptTemplate, {
      programsCatalog: params.programsCatalog,
      exerciseCatalog: params.exerciseCatalog,
      exerciseCount: params.catalogById.size,
      userContextBlock: params.userContextBlock,
    }),
    tools: [{ functionDeclarations: TOOLS }],
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
  }

  const text = response.text()?.trim();
  if (text) return { type: "text", text };

  throw new Error("AI returned an empty response. Try again.");
}
