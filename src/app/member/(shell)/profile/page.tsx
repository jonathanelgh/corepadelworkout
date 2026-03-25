import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { PRIMARY_GOAL_LABELS, isOnboardingGoal } from "@/lib/member/onboarding";

export const dynamic = "force-dynamic";

export default async function MemberProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "full_name, email, birth_date, gender, profile_image_url, primary_goal, training_environment, training_environments, padel_pains, padel_levels ( name )",
    )
    .eq("id", user.id)
    .maybeSingle();

  const levelName =
    profile && typeof profile.padel_levels === "object" && profile.padel_levels && "name" in profile.padel_levels
      ? String((profile.padel_levels as { name: string }).name)
      : "—";

  const goalLabel =
    profile?.primary_goal && isOnboardingGoal(profile.primary_goal)
      ? PRIMARY_GOAL_LABELS[profile.primary_goal]
      : "—";

  const envName: Record<string, string> = { gym: "Gym", home: "Home", club: "Club" };
  const envLabel =
    profile?.training_environments && profile.training_environments.length > 0
      ? profile.training_environments.map((v: string) => envName[v] ?? v).join(", ")
      : profile?.training_environment
        ? envName[profile.training_environment] ?? profile.training_environment
        : "—";

  const painLabels: Record<string, string> = {
    padel_elbow: "Padel elbow",
    jumpers_knee: "Jumper's knee",
    lower_back: "Lower back",
    plantar_fasciitis: "Heel / plantar",
    none: "None — general strength",
  };
  const painsStr =
    profile?.padel_pains && profile.padel_pains.length > 0
      ? profile.padel_pains.map((p: string) => painLabels[p] ?? p).join(", ")
      : "—";

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <Link href="/member" className="text-sm font-medium text-emerald-700 hover:text-emerald-800">
          ← Dashboard
        </Link>
        <h1 className="mt-4 text-2xl font-bold text-zinc-900">Profile</h1>
        <p className="mt-1 text-sm text-zinc-600">Details from your account (edit form coming next).</p>
      </div>

      <dl className="divide-y divide-zinc-200 rounded-2xl border border-zinc-200 bg-white shadow-sm">
        {[
          ["Email", user.email ?? profile?.email ?? "—"],
          ["Name", profile?.full_name?.trim() || "—"],
          ["Padel level", levelName],
          ["Top priority", goalLabel],
          ["Train usually", envLabel],
          ["Padel pains / focus", painsStr],
          ["Birth date", profile?.birth_date ?? "—"],
          ["Gender", profile?.gender ?? "—"],
        ].map(([k, v]) => (
          <div key={k} className="grid grid-cols-3 gap-2 px-4 py-3 sm:px-5">
            <dt className="text-sm font-medium text-zinc-500">{k}</dt>
            <dd className="col-span-2 text-sm text-zinc-900">{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
