"use client";

import Link from "next/link";
import { Crown, Sparkles } from "lucide-react";
import { SubscribeButton } from "@/components/billing/subscribe-button";

export function MemberCustomTab({ hasActivePro }: { hasActivePro: boolean }) {
  if (!hasActivePro) {
    return (
      <div className="mx-auto max-w-lg space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">Custom</h1>
          <p className="mt-1 text-sm text-zinc-600">AI Coach builds workouts around your goals and profile.</p>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-8 text-center shadow-sm">
          <Crown className="mx-auto h-10 w-10 text-amber-600" />
          <h2 className="mt-4 text-lg font-semibold text-zinc-900">Pro required</h2>
          <p className="mt-2 text-sm text-zinc-600">
            AI Coach is included with Pro. Free programs are still available without a subscription.
          </p>
          <div className="mt-6 flex flex-col items-center gap-3">
            <SubscribeButton className="rounded-xl bg-zinc-900 px-6 py-3 text-sm font-semibold text-white hover:bg-zinc-800">
              Subscribe to Pro
            </SubscribeButton>
            <Link href="/member?tab=profile" className="text-sm font-medium text-zinc-600 underline hover:text-zinc-900">
              Manage subscription in settings
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">Custom</h1>
        <p className="mt-1 text-sm text-zinc-600">Personalized workouts built around your goals and profile.</p>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-sm">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
          <Sparkles className="h-6 w-6" />
        </span>
        <h2 className="mt-4 text-lg font-semibold text-zinc-900">Coming soon</h2>
        <p className="mt-2 text-sm text-zinc-600">
          Your Pro membership includes AI Coach access when we launch member-facing custom sessions.
        </p>
      </div>
    </div>
  );
}
