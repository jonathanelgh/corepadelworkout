/** Gemini 2.0 Flash was shut down 2026-06-01; override via GEMINI_MODEL in env. */
export const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash";

export function resolveGeminiModel(): string {
  return process.env.GEMINI_MODEL?.trim() || DEFAULT_GEMINI_MODEL;
}
