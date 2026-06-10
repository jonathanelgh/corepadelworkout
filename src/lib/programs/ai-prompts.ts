import type { SupabaseClient } from "@supabase/supabase-js";

export const AI_PROMPT_KEYS = ["ai_coach_system", "ai_program_builder", "ai_program_cover"] as const;

export type AiPromptKey = (typeof AI_PROMPT_KEYS)[number];

export type AiPromptRecord = {
  key: AiPromptKey;
  label: string;
  description: string | null;
  body: string;
  updated_at: string | null;
};

export const AI_PROMPT_PLACEHOLDERS: Record<
  AiPromptKey,
  { name: string; description: string }[]
> = {
  ai_coach_system: [
    { name: "user_context_block", description: "Member profile block (name, age, gender, level, pains, goals, environment). Empty when no member is selected." },
    { name: "programs_catalog", description: "JSON array of published programs sent to the AI." },
    { name: "exercise_catalog", description: "Formatted exercise library with UUIDs in square brackets." },
    { name: "exercise_count", description: "Number of published exercises in the catalog." },
  ],
  ai_program_builder: [
    { name: "user_context_block", description: "Member profile block when personalizing for a specific user. Empty when none selected." },
    { name: "coach_brief", description: "Admin brief from the AI builder modal." },
    { name: "location_list", description: "Selected training locations (e.g. Gym (gym), Home (home))." },
    { name: "schedule_targets", description: "Optional weeks / frequency / minutes block (may be empty)." },
    { name: "difficulty_hint", description: "Optional target difficulty block (may be empty)." },
    { name: "program_metadata", description: "Categories, difficulty levels, and location slugs." },
    { name: "exercise_catalog", description: "Formatted exercise list with UUIDs." },
    { name: "exercise_count", description: "Number of exercises in the catalog block." },
    { name: "response_schema", description: "Required JSON shape (do not remove from prompt)." },
  ],
  ai_program_cover: [
    { name: "program_title", description: "Program title used as the cover theme." },
  ],
};

/** Defaults — kept in sync with migration seed. */
export const DEFAULT_AI_PROMPT_BODIES: Record<AiPromptKey, { label: string; description: string; body: string }> = {
  ai_coach_system: {
    label: "AI Coach — system prompt",
    description: "Chat coach for /admin/programs/ai.",
    body: `You are an expert padel strength and conditioning coach helping an admin build programs for Core Padel Workout.
{{user_context_block}}
Rules:
- Use markdown for replies when speaking normally (no HTML).
- You have exactly two tools. Use only ONE tool per turn — never both.
- recommend_programs: when existing published programs in the catalog fit the request. Use only program IDs from the catalog JSON — never invent IDs.
- generate_workout: when the admin wants a new custom single-session workout plan.
- For generate_workout, use ONLY exercises from the exercise catalog below. Every exercise_id MUST be copied exactly from a catalog line (the UUID in square brackets).
- Do NOT invent exercises, IDs, or names not in the catalog.
- Each exercise in generate_workout must include exercise_id and rest_after_seconds (required).
- Be concise and practical for padel athletes.

Published programs catalog (id must be copied exactly):
{{programs_catalog}}

Exercise catalog ({{exercise_count}} published exercises — exercise_id must be copied exactly):
{{exercise_catalog}}`,
  },
  ai_program_builder: {
    label: "AI program builder — generation prompt",
    description: "Full program draft from the create/edit form modal.",
    body: `You are an expert padel strength & conditioning coach building programs for Core Padel Workout.

Design a complete, periodized training program for competitive and recreational padel players.
{{user_context_block}}
## Coach brief
{{coach_brief}}

## Constraints
- Use ONLY exercises from the catalog below. Every exercise_id MUST be copied exactly from a catalog line (the UUID in square brackets).
- Do NOT invent exercises, IDs, or names not in the catalog.
- Build one track per location: {{location_list}}
- For each track, only use exercises whose location matches that track (see @location in catalog).
- Sessions should progress logically (warm-up → main work → accessory/mobility where appropriate).
- Typical session: 6–12 exercises. Vary movement patterns; include padel-relevant rotation, legs, shoulders, and core.
- Prescribe realistic sets/reps/duration/rest for padel S&C (e.g. strength 3–4×6–10, mobility timed, rest 30–90s).
- Avoid repeating the same exercise in one session unless intentional (e.g. ladder drills).
{{schedule_targets}}{{difficulty_hint}}
## Allowed program metadata
{{program_metadata}}

## Exercise catalog ({{exercise_count}} exercises)
{{exercise_catalog}}

Return JSON only (no markdown), matching:
{{response_schema}}

Rules:
- category_slugs and difficulty_level_slug must match slugs from metadata lists, or use empty/null when unsure.
- tracks array must include exactly one entry per requested location slug.
- Session count should match the brief and schedule (e.g. 3 sessions/week × 4 weeks → ~12 sessions per track unless brief says otherwise).
- body: engaging copy explaining who the program is for and how it improves padel performance.`,
  },
  ai_program_cover: {
    label: "AI program cover — image prompt",
    description: "Cover image generation after saving a workout.",
    body: `Cinematic wide shot of a padel athlete training, dynamic motion, professional sports photography, moody lighting, no text, no logos, no watermarks. Theme: {{program_title}}`,
  },
};

export function fillPromptTemplate(template: string, vars: Record<string, string>): string {
  let out = template;
  for (const [key, value] of Object.entries(vars)) {
    out = out.replaceAll(`{{${key}}}`, value);
  }
  return out;
}

export async function loadAiPrompt(
  supabase: SupabaseClient,
  key: AiPromptKey
): Promise<string> {
  const { data, error } = await supabase.from("ai_prompts").select("body").eq("key", key).maybeSingle();
  if (error) throw new Error(error.message);
  if (data?.body && typeof data.body === "string" && data.body.trim()) {
    return data.body;
  }
  return DEFAULT_AI_PROMPT_BODIES[key].body;
}

export async function loadAllAiPrompts(
  supabase: SupabaseClient
): Promise<AiPromptRecord[]> {
  const { data, error } = await supabase
    .from("ai_prompts")
    .select("key, label, description, body, updated_at")
    .in("key", [...AI_PROMPT_KEYS]);

  if (error) throw new Error(error.message);

  const byKey = new Map((data ?? []).map((row) => [row.key as string, row]));

  return AI_PROMPT_KEYS.map((key) => {
    const row = byKey.get(key);
    const fallback = DEFAULT_AI_PROMPT_BODIES[key];
    const bodyRaw = row?.body as string | undefined;
    return {
      key,
      label: (row?.label as string) ?? fallback.label,
      description: (row?.description as string | null) ?? fallback.description,
      body: bodyRaw?.trim() ? bodyRaw : fallback.body,
      updated_at: (row?.updated_at as string | null) ?? null,
    };
  });
}
