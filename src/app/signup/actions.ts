"use server";

import { createClient } from "@/utils/supabase/server";
import { resolvePostAuthRedirect } from "@/lib/member/resolve-post-auth-redirect";
import {
  redeemEarlyAccessPro,
  validateEarlyAccessForEmail,
} from "@/lib/pre-launch/early-access";
import {
  normalizeSignupOfferCode,
  redeemSignupOfferPro,
  validateSignupOfferCode,
} from "@/lib/billing/signup-offer";

export type SignUpResult =
  | { ok: true; needsVerification: true }
  | { ok: true; needsVerification: false; redirectTo: string }
  | { error: string };

export async function signUpWithPassword(input: {
  fullName: string;
  email: string;
  password: string;
  origin: string;
  earlyAccessToken?: string | null;
  signupOfferCode?: string | null;
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

  const earlyAccessToken = input.earlyAccessToken?.trim() || null;
  if (earlyAccessToken) {
    const valid = await validateEarlyAccessForEmail(earlyAccessToken, email);
    if (!valid.ok) return { error: valid.error };
  }

  const signupOfferCode = normalizeSignupOfferCode(input.signupOfferCode);
  if (signupOfferCode) {
    const valid = await validateSignupOfferCode(signupOfferCode);
    if (!valid.ok) return { error: valid.error };
  }

  const supabase = await createClient();
  const emailRedirectTo = `${input.origin.replace(/\/$/, "")}/auth/callback?next=${encodeURIComponent("/onboarding")}`;

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        ...(earlyAccessToken ? { early_access_token: earlyAccessToken } : {}),
        ...(signupOfferCode ? { signup_offer_code: signupOfferCode } : {}),
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
    if (earlyAccessToken && data.session.user.email) {
      const redeem = await redeemEarlyAccessPro({
        userId: data.session.user.id,
        email: data.session.user.email,
        token: earlyAccessToken,
      });
      if (!redeem.ok) {
        return { error: redeem.error };
      }
    }
    if (signupOfferCode) {
      const redeem = await redeemSignupOfferPro({
        userId: data.session.user.id,
        code: signupOfferCode,
      });
      if (!redeem.ok) {
        return { error: redeem.error };
      }
    }
    const redirectTo = await resolvePostAuthRedirect(supabase, data.session.user.id);
    return { ok: true, needsVerification: false, redirectTo };
  }

  return { ok: true, needsVerification: true };
}

export async function previewSignupOffer(
  codeRaw: string | null | undefined
): Promise<{ ok: true; months: number; name: string } | { ok: false }> {
  const code = normalizeSignupOfferCode(codeRaw);
  if (!code) return { ok: false };
  const valid = await validateSignupOfferCode(code);
  if (!valid.ok) return { ok: false };
  return { ok: true, months: valid.months, name: valid.name };
}
