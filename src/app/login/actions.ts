"use server";

import { createClient } from "@/utils/supabase/server";

export async function sendLoginMagicLink(input: {
  email: string;
  next?: string | null;
  origin: string;
}): Promise<{ error: string } | { ok: true }> {
  const email = input.email.trim();
  if (!email) {
    return { error: "Enter your email address." };
  }

  const nextParam = input.next?.trim();
  const next =
    nextParam && nextParam.startsWith("/") && !nextParam.startsWith("//") ? nextParam : "/member";

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
