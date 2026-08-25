/**
 * Client helper for native / external callers of AI Coach generation.
 *
 * POST {NEXT_PUBLIC_SITE_URL}/api/ai-coach/generate
 * Authorization: Bearer <supabase_user_access_token>
 */
export const AI_COACH_GENERATE_PATH = "/api/ai-coach/generate";

export function resolveAiCoachGenerateUrl(siteUrl?: string | null): string {
  const base = (siteUrl || process.env.NEXT_PUBLIC_SITE_URL || "https://corepadel.app").replace(
    /\/$/,
    ""
  );
  return `${base}${AI_COACH_GENERATE_PATH}`;
}

export type AiCoachGenerateHttpBody = {
  history: Array<{ role: "user" | "model"; parts: [{ text: string }] }>;
  systemPrompt: string;
  toolsEnabled?: boolean;
  forcedTool?: "generate_program" | "generate_workout" | "recommend_programs" | null;
  model?: string;
};

export type AiCoachGenerateHttpResult =
  | { type: "text"; text: string }
  | { type: "functionCall"; name: string; args: Record<string, unknown> }
  | { type: "error"; error: string };

/** Call the Vercel generation endpoint with a Supabase user access token (native apps). */
export async function postAiCoachGenerate(params: {
  accessToken: string;
  body: AiCoachGenerateHttpBody;
  siteUrl?: string | null;
  signal?: AbortSignal;
}): Promise<AiCoachGenerateHttpResult> {
  const res = await fetch(resolveAiCoachGenerateUrl(params.siteUrl), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${params.accessToken}`,
    },
    body: JSON.stringify(params.body),
    signal: params.signal,
  });

  const payload = (await res.json().catch(() => null)) as AiCoachGenerateHttpResult | null;
  if (!payload || typeof payload !== "object") {
    return { type: "error", error: `Generation failed (HTTP ${res.status}).` };
  }
  if (payload.type === "error") {
    return { type: "error", error: payload.error || `Generation failed (HTTP ${res.status}).` };
  }
  return payload;
}
