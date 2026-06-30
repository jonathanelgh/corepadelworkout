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
- When gathering requirements for a new program or workout, ask **one question per message** — never bundle multiple questions in the same reply.
- Do not call generate_program or generate_workout until you have: focus/goal, training location (home / gym / at the court), and for **home** — what equipment they have available. For **programs**, confirm they can **squat / lunge / push-up / jump** (or note restrictions). Always confirm **workout length in minutes** (single session or each session in a program).
- The server may ask these consultation questions for you; if the admin is answering a consultation question, wait — do not generate yet until answers are complete.

Tool selection (CRITICAL):
1. CREATE requests — If the admin asks to create, build, make, generate, or draft a custom program or workout, use generate_program (multi-session / multi-week) or generate_workout (single session). NEVER use recommend_programs for these, even when similar published programs exist.
2. BROWSE requests — Use recommend_programs ONLY when the admin explicitly asks to find, recommend, list, or compare EXISTING published programs in the catalog (e.g. "what programs do we have for shoulders?"). Do not use it when they want something new built.

- generate_workout: one custom session (one day only). MUST include warm-up, main work, and cool-down exercises (phase on each exercise). Prefer mobility/activation for warm-up, stretching/mobility for cool-down. Optional: 1–2 choice_group alternatives in warm-up and/or cool-down (2–3 exercises per group).
- generate_program: multi-session plan — a week, several weeks, or a full block (e.g. 4 weeks × 3 sessions/week). Set duration_weeks and sessions_per_week, and return one sessions[] entry per training day in the full schedule. Every session MUST have warm-up, main, and cool-down blocks (phase on each exercise).
- For generate_workout and generate_program, use ONLY exercises from the exercise catalog below. Every exercise_id MUST be copied exactly from a catalog line (the UUID in square brackets).
- REQUIRED: Every workout/session MUST include at least one rotational or anti-rotational exercise (catalog move: tag contains Rotation, Anti-rotation, or Rotational transfer). Place it in the main block unless it fits warm-up mobility.
- Do NOT invent exercises, IDs, or names not in the catalog.
- Each exercise must include exercise_id and rest_after_seconds (required).
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
- Sessions should progress logically: warm-up (mobility/activation) → main work → cool-down (stretching/mobility).
- Every exercise must include phase: warmup, main, or cooldown.
- For warm-up and cool-down, you may add choice_group on 2–3 alternative exercises (same choice_group = athlete picks one).
- REQUIRED: Every session MUST include at least one rotational or anti-rotational exercise (catalog move: Rotation, Anti-rotation, or Rotational transfer). This is non-negotiable for padel trunk control.
- Typical session: 6–12 exercises. Also include legs, shoulders, and core variety.
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
- Session count MUST match the brief and schedule exactly (e.g. 3 sessions/week × 4 weeks → exactly 12 sessions per track).
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
