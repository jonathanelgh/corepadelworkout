/** OpenAI ChatGPT models for admin AI Coach. Override via OPENAI_MODEL. */
export const DEFAULT_OPENAI_MODEL = "gpt-5.6";

/** OpenAI image model for program covers. Override via OPENAI_IMAGE_MODEL. */
export const DEFAULT_OPENAI_IMAGE_MODEL = "gpt-image-2";

/**
 * Match ChatGPT chat defaults for GPT-5.x:
 * - omit temperature / top_p / penalties (ChatGPT doesn’t expose them; GPT-5 rejects non-defaults)
 * - reasoning effort = medium (API + ChatGPT default)
 *
 * Tool calls must use the Responses API to keep medium reasoning — Chat Completions
 * only allows function tools with reasoning_effort "none".
 */
export const OPENAI_CHAT_LIKE = {
  reasoningEffort: "medium",
  maxOutputTokensTools: 32768,
  maxOutputTokensChat: 8192,
} as const;

export type OpenAiChatLikeReasoningEffort = (typeof OPENAI_CHAT_LIKE)["reasoningEffort"];

export function resolveOpenAiModel(): string {
  return process.env.OPENAI_MODEL?.trim() || DEFAULT_OPENAI_MODEL;
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
