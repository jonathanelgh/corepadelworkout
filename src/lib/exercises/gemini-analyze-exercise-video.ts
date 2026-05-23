import { GoogleGenerativeAI } from "@google/generative-ai";
import { FileState, GoogleAIFileManager } from "@google/generative-ai/server";
import {
  formatTaxonomyForPrompt,
  type ExerciseTaxonomyContext,
} from "@/lib/exercises/taxonomy-context";

export type GeminiExerciseDraft = {
  title: string;
  description: string;
  how_to: string;
  exercise_level_slug: string | null;
  location_slug: string | null;
  category_type_names: string[];
  movement_pattern_names: string[];
  body_region_names: string[];
  body_part_names: string[];
  equipment_titles: string[];
};

const RESPONSE_SCHEMA = `{
  "title": "string (concise exercise name)",
  "description": "string (1-2 sentences, padel/fitness focused)",
  "how_to": "string (numbered steps, newline separated)",
  "exercise_level_slug": "string | null (slug from exercise levels list, or null)",
  "location_slug": "string | null (slug from locations list, or null)",
  "category_type_names": ["string"],
  "movement_pattern_names": ["string"],
  "body_region_names": ["string"],
  "body_part_names": ["string"],
  "equipment_titles": ["string"]
}`;

function mimeFromUrl(url: string): string {
  const lower = url.split("?")[0].toLowerCase();
  if (lower.endsWith(".webm")) return "video/webm";
  if (lower.endsWith(".mov")) return "video/quicktime";
  if (lower.endsWith(".m4v")) return "video/x-m4v";
  return "video/mp4";
}

function parseDraftJson(text: string): GeminiExerciseDraft {
  const trimmed = text.trim();
  const jsonMatch = trimmed.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Gemini did not return valid JSON.");
  }
  const parsed = JSON.parse(jsonMatch[0]) as Record<string, unknown>;

  const arr = (v: unknown): string[] =>
    Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];

  const title = typeof parsed.title === "string" ? parsed.title.trim() : "";
  if (!title) throw new Error("Gemini response missing title.");

  return {
    title,
    description: typeof parsed.description === "string" ? parsed.description.trim() : "",
    how_to: typeof parsed.how_to === "string" ? parsed.how_to.trim() : "",
    exercise_level_slug:
      typeof parsed.exercise_level_slug === "string" ? parsed.exercise_level_slug.trim() || null : null,
    location_slug: typeof parsed.location_slug === "string" ? parsed.location_slug.trim() || null : null,
    category_type_names: arr(parsed.category_type_names),
    movement_pattern_names: arr(parsed.movement_pattern_names),
    body_region_names: arr(parsed.body_region_names),
    body_part_names: arr(parsed.body_part_names),
    equipment_titles: arr(parsed.equipment_titles),
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Download from Supabase (or any URL) and upload to Gemini Files API; returns Gemini file URI. */
async function uploadVideoToGeminiFiles(
  apiKey: string,
  videoPublicUrl: string,
  originalFilename: string
): Promise<{ fileUri: string; mimeType: string; geminiFileName: string }> {
  const mimeType = mimeFromUrl(videoPublicUrl);
  const download = await fetch(videoPublicUrl);
  if (!download.ok) {
    throw new Error(`Could not download video for analysis (${download.status}).`);
  }
  const buffer = Buffer.from(await download.arrayBuffer());
  if (buffer.length === 0) {
    throw new Error("Downloaded video file is empty.");
  }

  const fileManager = new GoogleAIFileManager(apiKey);
  const uploadResult = await fileManager.uploadFile(buffer, {
    mimeType,
    displayName: originalFilename.slice(0, 120) || "exercise-video",
  });

  let file = uploadResult.file;
  const maxWaitMs = 10 * 60 * 1000;
  const started = Date.now();

  while (file.state === FileState.PROCESSING) {
    if (Date.now() - started > maxWaitMs) {
      throw new Error("Gemini video processing timed out (over 10 minutes).");
    }
    await sleep(4000);
    file = await fileManager.getFile(file.name);
  }

  if (file.state === FileState.FAILED) {
    const detail = file.error?.message ? `: ${file.error.message}` : "";
    throw new Error(`Gemini could not process this video${detail}`);
  }

  if (!file.uri) {
    throw new Error("Gemini upload succeeded but no file URI was returned.");
  }

  return { fileUri: file.uri, mimeType: file.mimeType || mimeType, geminiFileName: file.name };
}

export async function analyzeExerciseVideoWithGemini(
  videoPublicUrl: string,
  taxonomy: ExerciseTaxonomyContext,
  originalFilename: string
): Promise<GeminiExerciseDraft> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }

  const { fileUri, mimeType, geminiFileName } = await uploadVideoToGeminiFiles(
    apiKey,
    videoPublicUrl,
    originalFilename
  );

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: process.env.GEMINI_MODEL?.trim() || "gemini-2.0-flash",
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.3,
    },
  });

  const taxonomyBlock = formatTaxonomyForPrompt(taxonomy);

  const prompt = `You are building content for Core Padel Workout, a padel strength and conditioning platform.

Watch the exercise demonstration video and produce structured metadata for our exercise library.

Original filename (hint only): ${originalFilename}

Use ONLY values from these allowed lists when tagging (use exact names as written):
${taxonomyBlock}

Return JSON matching this schema (no markdown):
${RESPONSE_SCHEMA}

Rules:
- Title should be clear and professional (not the raw filename).
- how_to: 3-8 short steps, one per line, plain text (no HTML).
- Pick the best matching tags from the lists; omit tags that do not apply (empty arrays).
- location_slug and exercise_level_slug must be slugs from the lists above, or null.
- Focus on padel-relevant coaching cues when visible.`;

  try {
    const result = await model.generateContent([
      {
        fileData: {
          mimeType,
          fileUri,
        },
      },
      { text: prompt },
    ]);

    const text = result.response.text();
    if (!text) {
      throw new Error("Empty response from Gemini.");
    }
    return parseDraftJson(text);
  } finally {
    try {
      const fileManager = new GoogleAIFileManager(apiKey);
      await fileManager.deleteFile(geminiFileName);
    } catch {
      // Best-effort cleanup of temporary Gemini file
    }
  }
}
