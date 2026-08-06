"use server";

import { createClient } from "@/utils/supabase/server";
import { enrollInPublishedProgram } from "@/app/programs/enroll-actions";
import {
  COURT_WARMUP_DEST_PATH,
  COURT_WARMUP_PROGRAM_SLUG,
} from "@/lib/programs/court-warmup-funnel";

export type CourtWarmupSignUpResult =
  | { ok: true; needsVerification: true }
  | { ok: true; needsVerification: false; redirectTo: string }
  | { error: string };

function displayNameFromEmail(email: string): string {
  const local = email.split("@")[0]?.trim() || "Athlete";
  return local.slice(0, 80);
}

/** Email + password signup for the free court warm-up landing page. */
export async function signUpForCourtWarmup(input: {
  email: string;
  password: string;
  origin: string;
}): Promise<CourtWarmupSignUpResult> {
  const email = input.email.trim();
  const password = input.password;

  if (!email) {
    return { error: "Enter your email address." };
  }

  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }

  const supabase = await createClient();
  const emailRedirectTo = `${input.origin.replace(/\/$/, "")}/auth/callback?next=${encodeURIComponent(COURT_WARMUP_DEST_PATH)}`;

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: displayNameFromEmail(email),
        signup_source: "court_warmup_landing",
      },
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
    await enrollInPublishedProgram(COURT_WARMUP_PROGRAM_SLUG);
    return { ok: true, needsVerification: false, redirectTo: COURT_WARMUP_DEST_PATH };
  }

  return { ok: true, needsVerification: true };
}
