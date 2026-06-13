"use server";

import { createClient } from "@/utils/supabase/server";

function safeNextPath(next: string | null | undefined): string {
  const trimmed = next?.trim() ?? "";
  if (trimmed.startsWith("/") && !trimmed.startsWith("//")) return trimmed;
  return "/member";
}

export async function sendLoginMagicLink(input: {
  email: string;
  next?: string | null;
  origin: string;
}): Promise<{ error: string } | { ok: true }> {
  const email = input.email.trim();
  if (!email) {
    return { error: "Enter your email address." };
  }

  const next = safeNextPath(input.next);
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${input.origin}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });

  if (error) {
    return { error: error.message };
  }

  return { ok: true };
}
