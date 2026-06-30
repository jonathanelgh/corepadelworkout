import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { getMemberShellContext } from "@/lib/member/member-shell-context";
import { getHasActivePro } from "@/lib/member/has-active-pro";
import { MemberAppShell } from "@/components/member/member-app-shell";
import { SubscribeButton } from "@/components/billing/subscribe-button";
import { Crown } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Exercise library",
};

type ExerciseRow = {
  id: string;
  title: string;
  description: string | null;
  cover_image_url: string | null;
};

export default async function MemberExercisesPage() {
  const { userEmail, profile } = await getMemberShellContext();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/member/exercises");

  const hasActivePro = await getHasActivePro(supabase, user.id);

  if (!hasActivePro) {
    return (
      <MemberAppShell userEmail={userEmail} profile={profile}>
        <div className="mx-auto max-w-lg space-y-6">
          <div>
            <Link href="/member" className="text-sm font-medium text-emerald-700 hover:text-emerald-800">
              ← Back to dashboard
            </Link>
            <h1 className="mt-4 text-2xl font-bold text-zinc-900">Exercise library</h1>
            <p className="mt-2 text-sm text-zinc-600">Browse every published exercise with Pro membership.</p>
          </div>
          <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-8 text-center">
            <Crown className="mx-auto h-10 w-10 text-amber-600" />
            <h2 className="mt-4 text-lg font-semibold text-zinc-900">Pro required</h2>
            <p className="mt-2 text-sm text-zinc-600">
              The full exercise library is included with Pro. Free programs remain available without subscribing.
            </p>
            <div className="mt-6">
              <SubscribeButton className="rounded-xl bg-zinc-900 px-6 py-3 text-sm font-semibold text-white hover:bg-zinc-800">
                Subscribe to Pro
              </SubscribeButton>
            </div>
          </div>
        </div>
      </MemberAppShell>
    );
  }

  const { data: exercises, error } = await supabase
    .from("exercises")
    .select("id, title, description, cover_image_url")
    .eq("status", "published")
    .order("title", { ascending: true });

  return (
    <MemberAppShell userEmail={userEmail} profile={profile}>
      <div className="mx-auto max-w-4xl space-y-8">
        <div>
          <Link href="/member" className="text-sm font-medium text-emerald-700 hover:text-emerald-800">
            ← Back to dashboard
          </Link>
          <h1 className="mt-4 text-2xl font-bold text-zinc-900">Exercise library</h1>
          <p className="mt-2 text-sm text-zinc-600">
            {exercises?.length ?? 0} published exercises in your Pro library.
          </p>
        </div>

        {error && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Could not load exercises: {error.message}
          </div>
        )}

        <ul className="grid gap-4 sm:grid-cols-2">
          {(exercises as ExerciseRow[] | null)?.map((ex) => (
            <li
              key={ex.id}
              className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm"
            >
              <h2 className="font-semibold text-zinc-900">{ex.title}</h2>
              {ex.description?.trim() && (
                <p className="mt-2 line-clamp-3 text-sm text-zinc-600">{ex.description.trim()}</p>
              )}
            </li>
          ))}
        </ul>
      </div>
    </MemberAppShell>
  );
}
