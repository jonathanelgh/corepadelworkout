import { NextResponse } from "next/server";
import { createClientFromRequest } from "@/utils/supabase/request-client";
import { getIsAdmin } from "@/utils/supabase/is-admin";
import { getHasActivePro } from "@/lib/member/has-active-pro";
import {
  runAiCoachOpenAiGenerate,
  type AiCoachGenerateRequest,
} from "@/lib/programs/ai-coach-openai-raw";

/**
 * OpenAI coach generation on Vercel (replaces Supabase Edge for long program builds).
 *
 * Auth (web or native):
 * - Cookie session (web), or
 * - `Authorization: Bearer <supabase_user_access_token>` (native / mobile)
 *
 * Authorization:
 * - `generate_program` → admin only
 * - other tools / chat → admin or active Pro member
 *
 * POST /api/ai-coach/generate
 * Body: { history, systemPrompt, toolsEnabled?, forcedTool?, tools?, model? }
 * Response: { type: "text"|"functionCall"|"error", ... }
 */
export const maxDuration = 300;
export const dynamic = "force-dynamic";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type, apikey, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: CORS_HEADERS });
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(request: Request) {
  try {
    const supabase = await createClientFromRequest(request);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return json({ type: "error", error: "You must be signed in." }, 401);
    }

    const isAdmin = await getIsAdmin(supabase);
    const hasPro = isAdmin || (await getHasActivePro(supabase, user.id));
    if (!hasPro) {
      return json(
        { type: "error", error: "Pro membership required for AI Coach generation." },
        403
      );
    }

    let body: AiCoachGenerateRequest;
    try {
      body = (await request.json()) as AiCoachGenerateRequest;
    } catch {
      return json({ type: "error", error: "Invalid JSON body." }, 400);
    }

    if (typeof body?.systemPrompt !== "string" || !Array.isArray(body?.history)) {
      return json({ type: "error", error: "Missing systemPrompt or history." }, 400);
    }

    const forced = body.forcedTool?.trim() || null;
    if (forced === "generate_program" && !isAdmin) {
      return json(
        {
          type: "error",
          error: "Only admins can generate multi-week catalog programs. Members can generate a single workout.",
        },
        403
      );
    }

    const result = await runAiCoachOpenAiGenerate({
      history: body.history,
      systemPrompt: body.systemPrompt,
      toolsEnabled: body.toolsEnabled,
      forcedTool: forced,
      tools: body.tools,
      model: body.model,
    });

    const status = result.type === "error" ? 400 : 200;
    return json(result, status);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return json({ type: "error", error: msg || "Generation failed." }, 500);
  }
}
