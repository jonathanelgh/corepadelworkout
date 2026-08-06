/** OpenAI ChatGPT models for admin AI Coach. Override via OPENAI_MODEL. */
export const DEFAULT_OPENAI_MODEL = "gpt-5.6";

export function resolveOpenAiModel(): string {
  return process.env.OPENAI_MODEL?.trim() || DEFAULT_OPENAI_MODEL;
}

export function requireOpenAiApiKey(): string {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }
  return apiKey;
}
