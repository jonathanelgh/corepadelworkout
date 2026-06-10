"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { getIsAdmin } from "@/utils/supabase/is-admin";
import {
  AI_PROMPT_KEYS,
  DEFAULT_AI_PROMPT_BODIES,
  loadAllAiPrompts,
  type AiPromptKey,
  type AiPromptRecord,
} from "@/lib/programs/ai-prompts";

const PROMPTS_PATH = "/admin/programs/ai/prompts";

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "You must be signed in.", supabase: null as null, user: null as null };
  }
  if (!(await getIsAdmin(supabase))) {
    return { error: "Not authorized.", supabase: null as null, user: null as null };
  }
  return { error: null, supabase, user };
}

export async function getAiPrompts(): Promise<
  { ok: true; prompts: AiPromptRecord[] } | { error: string }
> {
  const auth = await requireAdmin();
  if (auth.error || !auth.supabase) return { error: auth.error ?? "Unauthorized" };

  try {
    const prompts = await loadAllAiPrompts(auth.supabase);
    return { ok: true, prompts };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Could not load prompts." };
  }
}

export async function saveAiPrompt(input: {
  key: AiPromptKey;
  body: string;
}): Promise<{ ok: true } | { error: string }> {
  const auth = await requireAdmin();
  if (auth.error || !auth.supabase || !auth.user) {
    return { error: auth.error ?? "Unauthorized" };
  }

  if (!AI_PROMPT_KEYS.includes(input.key)) {
    return { error: "Unknown prompt key." };
  }

  const body = input.body.trim();
  if (!body) return { error: "Prompt cannot be empty." };
  if (body.length > 100_000) return { error: "Prompt is too long (max 100,000 characters)." };

  const { error } = await auth.supabase
    .from("ai_prompts")
    .update({ body, updated_by: auth.user.id })
    .eq("key", input.key);

  if (error) return { error: error.message };

  revalidatePath(PROMPTS_PATH);
  revalidatePath("/admin/programs/ai");
  return { ok: true };
}

export async function resetAiPrompt(key: AiPromptKey): Promise<{ ok: true; body: string } | { error: string }> {
  const auth = await requireAdmin();
  if (auth.error || !auth.supabase || !auth.user) {
    return { error: auth.error ?? "Unauthorized" };
  }

  if (!AI_PROMPT_KEYS.includes(key)) {
    return { error: "Unknown prompt key." };
  }

  const body = DEFAULT_AI_PROMPT_BODIES[key].body;
  const { error } = await auth.supabase
    .from("ai_prompts")
    .update({ body, updated_by: auth.user.id })
    .eq("key", key);

  if (error) return { error: error.message };

  revalidatePath(PROMPTS_PATH);
  return { ok: true, body };
}
