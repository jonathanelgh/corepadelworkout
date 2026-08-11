import type { SupabaseClient } from "@supabase/supabase-js";
import { sendMemberFeedbackEmail } from "./send-member-feedback";

const CATEGORY_LABELS: Record<string, string> = {
  general: "General",
  bug: "Bug / issue",
  idea: "Idea / feature",
  program: "Programs / workouts",
  other: "Other",
};

export async function notifyAdminsMemberFeedback(params: {
  supabase: SupabaseClient;
  userId: string;
  message: string;
  category: string | null;
  createdAt: string;
}): Promise<void> {
  const [adminRes, memberRes] = await Promise.all([
    params.supabase.from("admin_users").select("user_id"),
    params.supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", params.userId)
      .maybeSingle(),
  ]);

  const adminIds = (adminRes.data ?? []).map((r) => r.user_id as string);
  if (adminIds.length === 0) return;

  const { data: profiles } = await params.supabase
    .from("profiles")
    .select("id, email")
    .in("id", adminIds);

  const memberName =
    (memberRes.data?.full_name as string | null)?.trim() ||
    (memberRes.data?.email as string | null)?.trim() ||
    "A member";
  const memberEmail = (memberRes.data?.email as string | null)?.trim() || "unknown";
  const categoryKey = params.category?.trim() || "general";
  const categoryLabel = CATEGORY_LABELS[categoryKey] ?? "General";
  const submittedAt = new Date(params.createdAt).toLocaleString("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  for (const row of profiles ?? []) {
    const email = (row.email as string | null)?.trim();
    if (!email) continue;

    const result = await sendMemberFeedbackEmail({
      to: email,
      memberName,
      memberEmail,
      categoryLabel,
      message: params.message,
      submittedAt,
    });

    if (!result.ok) {
      console.warn(`[member-feedback] Failed to email ${email}:`, result.error);
    }
  }
}
