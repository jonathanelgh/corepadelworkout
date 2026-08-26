"use client";

import Link from "next/link";
import { ArrowRight, Crown, Sparkles } from "lucide-react";
import { SubscribeButton } from "@/components/billing/subscribe-button";
import { MemberCoachClient } from "@/components/member/member-coach-client";
import { MEMBER_AI_COACH_ENABLED } from "@/lib/member/member-ai-coach";

function MemberCoachComingSoon() {
  return (
    <div className="mx-auto max-w-lg">
      <div className="relative overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(204,255,0,0.18),transparent_55%),linear-gradient(180deg,#fafafa_0%,#ffffff_45%)]"
        />
        <div className="relative px-6 py-10 text-center sm:px-10 sm:py-12">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-900 text-[#ccff00] shadow-sm">
            <Sparkles className="h-7 w-7" aria-hidden />
          </span>
          <p className="mt-5 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
            AI Coach
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
            Coming soon
          </h1>
          <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-zinc-600 sm:text-base">
            Soon our AI coach can make customized programs for your needs — built around your
            level, schedule, and how you play padel.
          </p>
          <div className="mx-auto mt-8 h-px w-16 bg-zinc-200" />
          <p className="mt-6 text-sm text-zinc-500">
            In the meantime, train with our ready-made programs.
          </p>
          <Link
            href="/member?tab=workouts"
            className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl bg-zinc-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800"
          >
            Browse programs
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </div>
    </div>
  );
}

export function MemberCustomTab({
  hasActivePro,
  mobileFullscreen = false,
}: {
  hasActivePro: boolean;
  mobileFullscreen?: boolean;
}) {
  if (!MEMBER_AI_COACH_ENABLED) {
    return <MemberCoachComingSoon />;
  }

  if (!hasActivePro) {
    return (
      <div className="mx-auto max-w-lg space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">Coach</h1>
          <p className="mt-1 text-sm text-zinc-600">
            Your AI coach for padel fitness, program guidance, and custom workouts.
          </p>
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
    <div
      className={`mx-auto max-w-2xl space-y-4 ${
        mobileFullscreen ? "max-md:flex max-md:h-full max-md:max-w-none max-md:flex-col max-md:space-y-0" : ""
      }`}
    >
      <div className={mobileFullscreen ? "max-md:hidden" : ""}>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">Coach</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Chat about padel fitness, your training log, or get a custom workout built for you.
        </p>
      </div>
      <MemberCoachClient hasActivePro={hasActivePro} mobileFullscreen={mobileFullscreen} />
    </div>
  );
}
