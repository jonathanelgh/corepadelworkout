"use client";

import { Sparkles } from "lucide-react";

export function MemberCustomTab() {
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
          AI-powered custom sessions tailored to your level, pains, and training environment are on the way.
        </p>
      </div>
    </div>
  );
}
