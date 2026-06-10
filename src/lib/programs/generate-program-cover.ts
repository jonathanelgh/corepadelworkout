import { GoogleGenerativeAI } from "@google/generative-ai";
import { fillPromptTemplate, loadAiPrompt } from "@/lib/programs/ai-prompts";
import { createServiceClient } from "@/utils/supabase/service";
import { STORAGE_BUCKETS, publicObjectUrl } from "@/utils/supabase/storage";

const IMAGE_MODEL = process.env.GEMINI_IMAGE_MODEL?.trim() || "gemini-2.0-flash-preview-image-generation";

export async function generateProgramCoverImage(params: {
  programId: string;
  title: string;
}): Promise<{ imageUrl: string } | { error: string }> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    return { error: "GEMINI_API_KEY not configured" };
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: IMAGE_MODEL });

    const service = createServiceClient();
    const template = await loadAiPrompt(service, "ai_program_cover");
    const prompt = fillPromptTemplate(template, { program_title: params.title });

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { responseModalities: ["IMAGE"] },
    } as Parameters<typeof model.generateContent>[0]);

    const parts = result.response.candidates?.[0]?.content?.parts ?? [];
    const imagePart = parts.find(
      (p) => "inlineData" in p && p.inlineData?.mimeType?.startsWith("image/")
    );
    const inlineData = imagePart && "inlineData" in imagePart ? imagePart.inlineData : null;
    if (!inlineData?.data) {
      return { error: "No image returned from model" };
    }

    const buffer = Buffer.from(inlineData.data, "base64");
    const ext = inlineData.mimeType?.includes("png") ? "png" : "jpeg";
    const path = `covers/${params.programId}-${Date.now()}.${ext}`;

    const { error: uploadErr } = await service.storage
      .from(STORAGE_BUCKETS.programs)
      .upload(path, buffer, {
        contentType: inlineData.mimeType ?? "image/jpeg",
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
