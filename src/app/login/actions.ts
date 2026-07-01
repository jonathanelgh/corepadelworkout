"use server";

import { createClient } from "@/utils/supabase/server";
import { resolvePostAuthRedirect } from "@/lib/member/resolve-post-auth-redirect";

export type SignInResult = { ok: true; redirectTo: string } | { error: string };

export async function signInWithPassword(input: {
  email: string;
  password: string;
  next?: string | null;
}): Promise<SignInResult> {
  const email = input.email.trim();
  const password = input.password;

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    const msg = error.message.toLowerCase();
    const friendly =
      msg.includes("invalid login credentials") || msg.includes("invalid credentials")
        ? "Email or password is incorrect. If you signed up with a magic link, use “Email me a sign-in link” on the login page."
        : error.message;
    return { error: friendly };
  }

  const userId = data.user?.id;
  if (!userId) {
    return { error: "Sign in failed. Try again." };
  }

  const redirectTo = await resolvePostAuthRedirect(supabase, userId, input.next);
  return { ok: true, redirectTo };
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
