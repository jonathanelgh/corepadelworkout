import OpenAI from "openai";
import { fillPromptTemplate, loadAiPrompt } from "@/lib/programs/ai-prompts";
import { requireOpenAiApiKey, resolveOpenAiImageModel } from "@/lib/openai-config";
import { createServiceClient } from "@/utils/supabase/service";
import { STORAGE_BUCKETS, publicObjectUrl } from "@/utils/supabase/storage";

/** Landscape covers for program cards (16:10-ish). Override via OPENAI_IMAGE_SIZE. */
const IMAGE_SIZE =
  (process.env.OPENAI_IMAGE_SIZE?.trim() as "1024x1024" | "1536x1024" | "1024x1536" | undefined) ||
  "1536x1024";

const IMAGE_QUALITY =
  (process.env.OPENAI_IMAGE_QUALITY?.trim() as "low" | "medium" | "high" | undefined) || "medium";

/**
 * Generate a program cover with OpenAI GPT Image (`gpt-image-2` by default),
 * upload to Supabase storage, and set `programs.cover_image_url`.
 * Runs on the server (after AI program/workout save).
 */
export async function generateProgramCoverImage(params: {
  programId: string;
  title: string;
}): Promise<{ imageUrl: string } | { error: string }> {
  let apiKey: string;
  try {
    apiKey = requireOpenAiApiKey();
  } catch {
    return { error: "OPENAI_API_KEY not configured" };
  }

  try {
    const openai = new OpenAI({ apiKey });
    const model = resolveOpenAiImageModel();

    const service = createServiceClient();
    const template = await loadAiPrompt(service, "ai_program_cover");
    const prompt = fillPromptTemplate(template, { program_title: params.title });

    const result = await openai.images.generate({
      model,
      prompt,
      n: 1,
      size: IMAGE_SIZE,
      quality: IMAGE_QUALITY,
      output_format: "png",
    });

    const b64 = result.data?.[0]?.b64_json;
    if (!b64) {
      return { error: "No image returned from OpenAI" };
    }

    const buffer = Buffer.from(b64, "base64");
    const path = `covers/${params.programId}-${Date.now()}.png`;

    const { error: uploadErr } = await service.storage
      .from(STORAGE_BUCKETS.programs)
      .upload(path, buffer, {
        contentType: "image/png",
        upsert: true,
      });

    if (uploadErr) return { error: uploadErr.message };

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
    const imageUrl = publicObjectUrl(supabaseUrl, STORAGE_BUCKETS.programs, path);

    const { error: updateErr } = await service
      .from("programs")
      .update({ cover_image_url: imageUrl })
      .eq("id", params.programId);

    if (updateErr) return { error: updateErr.message };

    return { imageUrl };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Cover generation failed";
    console.warn("[generate-program-cover]", msg);
    return { error: msg };
  }
}
