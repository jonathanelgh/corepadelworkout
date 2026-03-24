import Link from "next/link";
import { createClient } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";

export default async function MemberProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email, birth_date, gender, profile_image_url, padel_level_id")
    .eq("id", user.id)
    .maybeSingle();

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
