"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { sendPreLaunchWelcomeEmail } from "@/lib/emails/send-pre-launch-welcome";

export type PreLaunchSignupState = { error: string } | null;

function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function submitPreLaunchSignup(
  _prev: PreLaunchSignupState,
  formData: FormData
): Promise<PreLaunchSignupState> {
  const email = normalizeEmail((formData.get("email") as string) ?? "");
  if (!email) {
    return { error: "Please enter your email address." };
  }
  if (!isValidEmail(email)) {
    return { error: "Please enter a valid email address." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("pre_launch_signups").insert({ email });

  if (error) {
    if (error.code === "23505") {
      redirect("/join/welcome?existing=1");
    }
    return { error: error.message || "Something went wrong. Please try again." };
  }

  const mail = await sendPreLaunchWelcomeEmail(email);
  if (!mail.ok) {
    console.error("[pre-launch] Welcome email failed:", mail.error);
  }

  redirect("/join/welcome");
}
