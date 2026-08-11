"use server";

import { createClient } from "@/utils/supabase/server";
import { createServiceClient } from "@/utils/supabase/service";
import { notifyAdminsMemberFeedback } from "@/lib/emails/notify-admins-member-feedback";

export const FEEDBACK_CATEGORIES = [
  "general",
  "bug",
  "idea",
  "program",
  "other",
] as const;

export type FeedbackCategory = (typeof FEEDBACK_CATEGORIES)[number];

function isFeedbackCategory(value: string): value is FeedbackCategory {
  return (FEEDBACK_CATEGORIES as readonly string[]).includes(value);
}

export async function submitMemberFeedback(input: {
  message: string;
  category?: string | null;
}): Promise<{ ok: true } | { ok: false; message: string }> {
  const message = input.message.trim();
  if (message.length < 3) {
    return { ok: false, message: "Please write a bit more (at least a few characters)." };
  }
  if (message.length > 4000) {
    return { ok: false, message: "Feedback is too long (max 4000 characters)." };
  }

  const rawCategory = input.category?.trim() || "general";
  if (!isFeedbackCategory(rawCategory)) {
    return { ok: false, message: "Invalid category." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, message: "You need to be signed in." };
  }

  const { data, error } = await supabase
    .from("member_feedback")
    .insert({
      user_id: user.id,
      message,
      category: rawCategory,
    })
    .select("id, created_at")
    .single();

  if (error || !data) {
    console.error("[member-feedback] insert failed:", error?.message);
    return { ok: false, message: "Could not save your feedback. Please try again." };
  }

  try {
    const service = createServiceClient();
    await notifyAdminsMemberFeedback({
      supabase: service,
      userId: user.id,
      message,
      category: rawCategory,
      createdAt: (data.created_at as string) || new Date().toISOString(),
    });
  } catch (err) {
    console.warn(
      "[member-feedback] Saved but admin notify failed:",
      err instanceof Error ? err.message : err
    );
  }

  return { ok: true };
}
