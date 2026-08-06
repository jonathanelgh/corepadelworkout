import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  formatExerciseCatalogForPrompt,
  formatProgramMetaForPrompt,
  type ExerciseCatalogEntry,
  type ProgramAiContext,
} from "@/lib/programs/exercise-catalog";
import { resolveGeminiModel } from "@/lib/gemini-config";
import { fillPromptTemplate } from "@/lib/programs/ai-prompts";
import { appendHardAiConstraints } from "@/lib/programs/ai-hard-constraints";
import {
  normalizeExercisePhases,
  parseChoiceGroup,
  parseSessionPhase,
  type SessionPhase,
} from "@/lib/programs/session-phase";
import {
  filterCatalogByTrainingLevel,
  resolveExerciseLevelCap,
} from "@/lib/programs/exercise-level-eligibility";
import { isOnboardingLevel } from "@/lib/programs/profile-ai-context";

export type GeminiProgramExercise = {
  exercise_id: string;
  phase: SessionPhase;
  choice_group: string | null;
  duration_seconds: number | null;
  duration_minutes: number | null;
  sets: number | null;
  reps: number | null;
  rest_between_sets_seconds: number | null;
  rest_after_seconds: number | null;
  load_prescription?: string | null;
  note?: string | null;
};

export type GeminiProgramSession = {
  name: string;
  description: string | null;
  duration_minutes: number | null;
  exercises: GeminiProgramExercise[];
};

export type GeminiProgramTrack = {
  location_slug: string;
  sessions: GeminiProgramSession[];
};

export type GeminiProgramDraft = {
  title: string;
  description: string;
  body: string;
  difficulty_level_slug: string | null;
  category_slugs: string[];
  duration_weeks: number | null;
  sessions_per_week: number | null;
  minutes_per_session: number | null;
  outcomes: string[];
  tracks: GeminiProgramTrack[];
};

export type AiProgramGenerateRequest = {
  brief: string;
  /** Location UUIDs to build tracks for (must exist in context). */
  locationIds: string[];
  durationWeeks?: number | null;
  sessionsPerWeek?: number | null;
  minutesPerSession?: number | null;
  difficultyLevelId?: string | null;
  /** When set, member profile is injected into the prompt for personalization. */
  targetUserId?: string | null;
  /** Admin override for workout structure level. */
  trainingLevel?: string | null;
};

export const AI_PROGRAM_RESPONSE_SCHEMA = `{
  "title": "string (compelling program name)",
  "description": "string (1-3 sentences for program cards)",
  "body": "string (2-4 paragraphs markdown-friendly plain text for sales/detail page)",
  "difficulty_level_slug": "string | null (from difficulty levels list)",
  "category_slugs": ["string (slugs from categories list)"],
  "duration_weeks": "number | null",
  "sessions_per_week": "number | null",
  "minutes_per_session": "number | null",
  "outcomes": ["string (3-6 achievement bullets)"],
  "tracks": [
    {
      "location_slug": "string (slug from locations list)",
      "sessions": [
        {
          "name": "string (e.g. Week 1 — Power & rotation)",
          "description": "string | null",
          "duration_minutes": "number | null",
          "exercises": [
            {
              "exercise_id": "string (UUID from catalog ONLY)",
              "phase": "warmup | main | cooldown",
              "choice_group": "string | null (same group = pick-one alternative in warm-up/cool-down)",
              "duration_seconds": "number | null (REQUIRED for warmup: always 60)",
              "duration_minutes": "number | null (main/cool-down timed work — not for warm-up)",
              "sets": "number | null",
              "reps": "number | null",
              "rest_between_sets_seconds": "number | null",
              "rest_after_seconds": "number | null",
              "load_prescription": "null — leave blank; athletes choose their own weight (never invent kg/lb)",
              "note": "string | null (sets×reps with 2+ sets: include \"Rest 30 sec between sets\"; otherwise technique/setup only — never weekly increases)"
            }
          ]
        }
      ]
    }
  ]
}`;

function parseOptionalInt(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v) && v >= 0) return Math.floor(v);
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number.parseInt(v.trim(), 10);
    if (Number.isFinite(n) && n >= 0) return n;
  }
  return null;
}

function parseExerciseRow(row: unknown): GeminiProgramExercise | null {
  if (!row || typeof row !== "object") return null;
  const r = row as Record<string, unknown>;
  const exercise_id = typeof r.exercise_id === "string" ? r.exercise_id.trim() : "";
  if (!exercise_id) return null;
  return {
    exercise_id,
    phase: parseSessionPhase(r.phase),
    choice_group: parseChoiceGroup(r.choice_group),
    duration_seconds: parseOptionalInt(r.duration_seconds),
    duration_minutes: parseOptionalInt(r.duration_minutes),
    sets: parseOptionalInt(r.sets),
    reps: parseOptionalInt(r.reps),
    rest_between_sets_seconds: parseOptionalInt(r.rest_between_sets_seconds),
    rest_after_seconds: parseOptionalInt(r.rest_after_seconds),
    load_prescription: null,
    note: typeof r.note === "string" && r.note.trim() ? r.note.trim() : null,
  };
}

function parseSession(row: unknown): GeminiProgramSession | null {
  if (!row || typeof row !== "object") return null;
  const r = row as Record<string, unknown>;
  const name = typeof r.name === "string" ? r.name.trim() : "";
  if (!name) return null;
  const exercisesRaw = Array.isArray(r.exercises) ? r.exercises : [];
  const exercises = exercisesRaw.map(parseExerciseRow).filter((x): x is GeminiProgramExercise => x != null);
  const normalized = normalizeExercisePhases(
    exercises.map((e) => ({ ...e, phase: e.phase }))
  );
  return {
    name,
    description: typeof r.description === "string" ? r.description.trim() || null : null,
    duration_minutes: parseOptionalInt(r.duration_minutes),
    exercises: normalized,
  };
}

function parseTrack(row: unknown): GeminiProgramTrack | null {
  if (!row || typeof row !== "object") return null;
  const r = row as Record<string, unknown>;
  const location_slug = typeof r.location_slug === "string" ? r.location_slug.trim() : "";
  if (!location_slug) return null;
  const sessionsRaw = Array.isArray(r.sessions) ? r.sessions : [];
  const sessions = sessionsRaw.map(parseSession).filter((x): x is GeminiProgramSession => x != null);
  if (sessions.length === 0) return null;
  return { location_slug, sessions };
}

function parseDraftJson(text: string): GeminiProgramDraft {
  const trimmed = text.trim();
  const jsonMatch = trimmed.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Gemini did not return valid JSON.");

  const parsed = JSON.parse(jsonMatch[0]) as Record<string, unknown>;
  const title = typeof parsed.title === "string" ? parsed.title.trim() : "";
  if (!title) throw new Error("Gemini response missing title.");

  const arr = (v: unknown): string[] =>
    Array.isArray(v) ? v.filter((x): x is string => typeof x === "string").map((s) => s.trim()).filter(Boolean) : [];

  const tracksRaw = Array.isArray(parsed.tracks) ? parsed.tracks : [];
  const tracks = tracksRaw.map(parseTrack).filter((x): x is GeminiProgramTrack => x != null);
  if (tracks.length === 0) throw new Error("Gemini response missing curriculum tracks.");

  return {
    title,
    description: typeof parsed.description === "string" ? parsed.description.trim() : "",
    body: typeof parsed.body === "string" ? parsed.body.trim() : "",
    difficulty_level_slug:
      typeof parsed.difficulty_level_slug === "string"
        ? parsed.difficulty_level_slug.trim() || null
        : null,
    category_slugs: arr(parsed.category_slugs),
    duration_weeks: parseOptionalInt(parsed.duration_weeks),
    sessions_per_week: parseOptionalInt(parsed.sessions_per_week),
    minutes_per_session: parseOptionalInt(parsed.minutes_per_session),
    outcomes: arr(parsed.outcomes),
    tracks,
  };
}

function normalizeSlug(s: string): string {
  return s.trim().toLowerCase();
}

function catalogForLocations(
  all: ExerciseCatalogEntry[],
  locationSlugs: Set<string>,
  locationIdBySlug: Map<string, string>
): ExerciseCatalogEntry[] {
  const locationIds = new Set<string>();
  for (const slug of locationSlugs) {
    const id = locationIdBySlug.get(normalizeSlug(slug));
    if (id) locationIds.add(id);
  }
  if (locationIds.size === 0) return all;
  return all.filter((e) => e.locationIds.some((id) => locationIds.has(id)));
}

export async function generateProgramWithGemini(
  ctx: ProgramAiContext,
  input: AiProgramGenerateRequest,
  options: { promptTemplate: string; userContextBlock?: string }
): Promise<GeminiProgramDraft> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }

  const brief = input.brief.trim();
  if (brief.length < 20) {
    throw new Error("Describe the program in at least 20 characters.");
  }

  const selectedLocations = ctx.locations.filter((l) => input.locationIds.includes(l.id));
  if (selectedLocations.length === 0) {
    throw new Error("Select at least one training location.");
  }

  const locationIdBySlug = new Map(ctx.locations.map((l) => [normalizeSlug(l.slug), l.id]));
  const slugSet = new Set(selectedLocations.map((l) => normalizeSlug(l.slug)));

  const publishedExercises = ctx.exercises.filter((e) => e.status === "published");
  const locationExercises = catalogForLocations(publishedExercises, slugSet, locationIdBySlug);
  const difficultySlug = input.difficultyLevelId
    ? ctx.difficulties.find((d) => d.id === input.difficultyLevelId)?.slug ?? null
    : null;
  const levelCap =
    resolveExerciseLevelCap({
      trainingLevel: isOnboardingLevel(input.trainingLevel) ? input.trainingLevel : null,
      difficultySlug,
    }) ?? "beginner";
  const relevantExercises = filterCatalogByTrainingLevel(locationExercises, levelCap);
  if (relevantExercises.length === 0) {
    throw new Error(
      `No exercises in the library for the selected locations at ${levelCap} level. Add or retag exercises first.`
    );
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: resolveGeminiModel(),
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.45,
    },
  });

  const scheduleParts: string[] = [];
  if (input.durationWeeks != null) scheduleParts.push(`Duration: ${input.durationWeeks} weeks`);
  else scheduleParts.push("Duration: 8 weeks (required default)");
  if (input.sessionsPerWeek != null) scheduleParts.push(`Frequency: ${input.sessionsPerWeek} sessions per week`);
  if (input.minutesPerSession != null) scheduleParts.push(`Target session length: ~${input.minutesPerSession} minutes`);
  const weeks = input.durationWeeks ?? 8;
  const spw = input.sessionsPerWeek;
  if (spw != null) {
    scheduleParts.push(
      `REQUIRED: Each track MUST contain exactly ${spw} week-1 session templates only (one training week). The app expands to ${weeks} weeks × ${spw} sessions and writes progressed prescriptions. Do NOT return all ${weeks * spw} sessions.`
    );
  }

  const schedule_targets =
    scheduleParts.length > 0 ? `\n## Schedule targets\n${scheduleParts.join("\n")}\n` : "";

  const difficultyName = input.difficultyLevelId
    ? ctx.difficulties.find((d) => d.id === input.difficultyLevelId)?.name
    : null;

  const difficulty_hint = [
    difficultyName ? `## Target difficulty\n${difficultyName}` : "",
    `## Exercise level cap\nOnly use exercises from the catalog below. Catalog is already filtered for **${levelCap}** — do not invent harder progressions outside this list.`,
  ]
    .filter(Boolean)
    .join("\n\n");
  const difficulty_hint_block = difficulty_hint ? `\n${difficulty_hint}\n` : "";

  const metaBlock = formatProgramMetaForPrompt(ctx);
  const catalogBlock = formatExerciseCatalogForPrompt(relevantExercises);
  const locationList = selectedLocations.map((l) => `${l.name} (${l.slug})`).join(", ");

  const prompt = appendHardAiConstraints(
    fillPromptTemplate(options.promptTemplate, {
      user_context_block: options.userContextBlock ?? "",
      coach_brief: brief,
      location_list: locationList,
      schedule_targets,
      difficulty_hint: difficulty_hint_block,
      program_metadata: metaBlock,
      exercise_catalog: catalogBlock,
      exercise_count: String(relevantExercises.length),
      response_schema: AI_PROGRAM_RESPONSE_SCHEMA,
    })
  );

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  if (!text) throw new Error("Empty response from Gemini.");
  return parseDraftJson(text);
}
