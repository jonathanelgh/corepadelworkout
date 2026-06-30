"use server";

import { createClient } from "@/utils/supabase/server";
import { resolvePostAuthRedirect } from "@/lib/member/resolve-post-auth-redirect";

export type SignUpResult =
  | { ok: true; needsVerification: true }
  | { ok: true; needsVerification: false; redirectTo: string }
  | { error: string };

export async function signUpWithPassword(input: {
  fullName: string;
  email: string;
  password: string;
  origin: string;
}): Promise<SignUpResult> {
  const fullName = input.fullName.trim();
  const email = input.email.trim();
  const password = input.password;

  if (fullName.length < 1 || fullName.length > 80) {
    return { error: "Please enter your name (1–80 characters)." };
  }

  if (!email) {
    return { error: "Enter your email address." };
  }

  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }

  const supabase = await createClient();
  const emailRedirectTo = `${input.origin.replace(/\/$/, "")}/auth/callback?next=${encodeURIComponent("/onboarding")}`;

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
      emailRedirectTo,
    },
  });

  if (error) {
    const msg = error.message.toLowerCase();
    if (msg.includes("already registered") || msg.includes("already exists")) {
      return { error: "An account with this email already exists. Sign in instead." };
    }
    return { error: error.message };
  }

  if (data.session?.user) {
    const redirectTo = await resolvePostAuthRedirect(supabase, data.session.user.id);
    return { ok: true, needsVerification: false, redirectTo };
  }

  return { ok: true, needsVerification: true };
}
