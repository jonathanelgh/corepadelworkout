/** OpenAI models for admin AI Coach. Override via OPENAI_MODEL. */
export const DEFAULT_OPENAI_MODEL = "gpt-5.6-terra";

/** OpenAI image model for program covers. Override via OPENAI_IMAGE_MODEL. */
export const DEFAULT_OPENAI_IMAGE_MODEL = "gpt-image-2";

/**
 * Reasoning effort for Responses API tool calls.
 * Override via OPENAI_REASONING_EFFORT (none | low | medium | high | xhigh | max).
 * Default `low` keeps program generation cheaper than ChatGPT's medium default.
 */
export const OPENAI_REASONING_EFFORTS = [
  "none",
  "low",
  "medium",
  "high",
  "xhigh",
  "max",
] as const;

export type OpenAiReasoningEffort = (typeof OPENAI_REASONING_EFFORTS)[number];

export const DEFAULT_OPENAI_REASONING_EFFORT: OpenAiReasoningEffort = "low";

/**
 * GPT-5.x sampling: omit temperature / top_p / penalties (API rejects non-defaults).
 * Tool calls use the Responses API so reasoning effort can be set (Chat Completions
 * only allows function tools with reasoning_effort "none").
 */
export const OPENAI_CHAT_LIKE = {
  maxOutputTokensTools: 32768,
  maxOutputTokensChat: 8192,
} as const;

/** @deprecated Prefer resolveOpenAiReasoningEffort() — kept for callers expecting a static default. */
export type OpenAiChatLikeReasoningEffort = OpenAiReasoningEffort;

export function resolveOpenAiModel(): string {
  return process.env.OPENAI_MODEL?.trim() || DEFAULT_OPENAI_MODEL;
}

export function resolveOpenAiReasoningEffort(): OpenAiReasoningEffort {
  const raw = process.env.OPENAI_REASONING_EFFORT?.trim().toLowerCase();
  if (raw && (OPENAI_REASONING_EFFORTS as readonly string[]).includes(raw)) {
    return raw as OpenAiReasoningEffort;
  }
  return DEFAULT_OPENAI_REASONING_EFFORT;
}

export function resolveOpenAiImageModel(): string {
  return process.env.OPENAI_IMAGE_MODEL?.trim() || DEFAULT_OPENAI_IMAGE_MODEL;
}

export function requireOpenAiApiKey(): string {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }
  return apiKey;
}
