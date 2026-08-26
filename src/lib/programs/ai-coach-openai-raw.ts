import OpenAI from "openai";
import {
  OPENAI_CHAT_LIKE,
  requireOpenAiApiKey,
  resolveOpenAiModel,
  resolveOpenAiReasoningEffort,
} from "@/lib/openai-config";
import {
  getAiCoachOpenAiTools,
  toResponsesFunctionTools,
  type ResponsesFunctionTool,
} from "@/lib/programs/ai-coach-openai";
import type { ChatHistoryMessage } from "@/lib/programs/ai-coach-gemini";
import type { ChatCompletionTool } from "openai/resources/chat/completions";

type ChatCompletionsFunctionTool = Extract<ChatCompletionTool, { type: "function" }>;

export type AiCoachGenerateRequest = {
  history: ChatHistoryMessage[];
  systemPrompt: string;
  toolsEnabled?: boolean;
  forcedTool?: string | null;
  /** Optional; defaults to the app's OpenAI coach tool schemas. */
  tools?: ChatCompletionsFunctionTool[] | ResponsesFunctionTool[];
  model?: string;
};

export type AiCoachGenerateResult =
  | { type: "text"; text: string }
  | { type: "functionCall"; name: string; args: Record<string, unknown> }
  | { type: "error"; error: string };

function toOpenAiMessages(
  history: ChatHistoryMessage[]
): Array<{ role: "user" | "assistant"; content: string }> {
  return history.map((m) => ({
    role: m.role === "model" ? "assistant" : "user",
    content: m.parts.map((p) => p.text).join("\n"),
  }));
}

function normalizeTools(
  tools: AiCoachGenerateRequest["tools"]
): ResponsesFunctionTool[] {
  if (!Array.isArray(tools) || tools.length === 0) {
    return toResponsesFunctionTools(getAiCoachOpenAiTools());
  }
  return tools.map((t) => {
    if ("function" in t && t.function) {
      return {
        type: "function" as const,
        name: t.function.name,
        description: t.function.description,
        parameters: (t.function.parameters ?? null) as Record<string, unknown> | null,
        strict: false,
      };
    }
    const flat = t as ResponsesFunctionTool;
    return {
      type: "function" as const,
      name: flat.name,
      description: flat.description,
      parameters: flat.parameters ?? null,
      strict: flat.strict ?? false,
    };
  });
}

/**
 * Low-level OpenAI coach turn used by `/api/ai-coach/generate` (web + native).
 * Returns a raw tool call or text — callers handle catalog parsing / QC.
 */
export async function runAiCoachOpenAiGenerate(
  input: AiCoachGenerateRequest
): Promise<AiCoachGenerateResult> {
  const apiKey = requireOpenAiApiKey();
  const model = input.model?.trim() || resolveOpenAiModel();
  const reasoningEffort = resolveOpenAiReasoningEffort();
  const toolsEnabled = input.toolsEnabled !== false;
  const history = Array.isArray(input.history) ? input.history : [];
  const systemPrompt = typeof input.systemPrompt === "string" ? input.systemPrompt : "";
  if (!systemPrompt) {
    return { type: "error", error: "Missing systemPrompt." };
  }

  const client = new OpenAI({ apiKey });
  const messages = toOpenAiMessages(history);

  if (toolsEnabled) {
    const tools = normalizeTools(input.tools);
    const forced = input.forcedTool?.trim() || null;
    const response = await client.responses.create({
      model,
      instructions: systemPrompt,
      input: messages.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
      tools,
      tool_choice: forced
        ? { type: "function" as const, name: forced }
        : ("auto" as const),
      reasoning: { effort: reasoningEffort },
      max_output_tokens: OPENAI_CHAT_LIKE.maxOutputTokensTools,
    });

    for (const item of response.output ?? []) {
      if (item.type !== "function_call") continue;
      const name = item.name?.toString() ?? "";
      const rawArgs = item.arguments?.toString() ?? "";
      if (!name) {
        return { type: "error", error: "OpenAI returned a tool call without a function name." };
      }
      try {
        const args = JSON.parse(rawArgs) as Record<string, unknown>;
        return { type: "functionCall", name, args };
      } catch {
        return { type: "error", error: `Could not parse tool arguments JSON for ${name}.` };
      }
    }

    const text =
      typeof response.output_text === "string" ? response.output_text.trim() : "";
    if (text) return { type: "text", text };
    return { type: "error", error: "OpenAI returned empty content and no tool call." };
  }

  const response = await client.chat.completions.create({
    model,
    messages: [{ role: "system", content: systemPrompt }, ...messages],
    max_completion_tokens: OPENAI_CHAT_LIKE.maxOutputTokensChat,
  });

  const content = (response.choices[0]?.message?.content ?? "").toString().trim();
  if (!content) {
    return { type: "error", error: "OpenAI returned empty content and no tool call." };
  }
  return { type: "text", text: content };
}
