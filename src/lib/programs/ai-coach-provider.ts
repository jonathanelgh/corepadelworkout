export type AiCoachProvider = "openai";

export const AI_COACH_PROVIDERS: {
  id: AiCoachProvider;
  label: string;
  shortLabel: string;
}[] = [
  { id: "openai", label: "ChatGPT (GPT-5.6)", shortLabel: "ChatGPT" },
];

export function isAiCoachProvider(v: unknown): v is AiCoachProvider {
  return v === "openai";
}

export function resolveAiCoachProvider(v: unknown): AiCoachProvider {
  return isAiCoachProvider(v) ? "openai" : "openai";
}
