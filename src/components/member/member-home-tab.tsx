"use client";

import Link from "next/link";
import { ArrowRight, Crown, Play } from "lucide-react";
import type { MemberSubscriptionStatus } from "@/lib/member/load-subscription-status";
import type { ActiveProgramSummary, QuickWorkoutSummary } from "@/lib/member/load-member-hub-data";
import { MemberFeedbackCard } from "@/components/member/member-feedback-card";
import { NavPendingCover } from "@/components/programs/nav-pending-cover";

const COVER_FALLBACK = "/Padel_coach_standing.webp";

function formatRenewalDate(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return null;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function MemberHomeTab({
  firstName,
  hasActivePro,
  subscription,
  activePrograms,
  quickWorkouts,
}: {
  firstName: string | null;
  hasActivePro: boolean;
  subscription: MemberSubscriptionStatus;
  activePrograms: ActiveProgramSummary[];
  quickWorkouts: QuickWorkoutSummary[];
}) {
  const greeting = firstName ? `Hi, ${firstName}` : "Hi";

  return (
    <div className="space-y-10">
      <h1 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">{greeting}</h1>

      {activePrograms.length > 0 && (
        <section className="min-w-0">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-zinc-900">My programs</h2>
            <p className="text-sm text-zinc-500">
              Programs you&apos;ve started, and ones your coach made for you.
            </p>
          </div>
          <ul className="-mx-6 flex snap-x snap-mandatory scroll-px-6 gap-3 overflow-x-auto px-6 pb-1 [scrollbar-width:none] md:mx-0 md:flex-col md:scroll-px-0 md:overflow-visible md:px-0 md:pb-0 md:snap-none [&::-webkit-scrollbar]:hidden">
            {activePrograms.map((p) => {
              const pct =
                p.totalSessions > 0 ? Math.round((p.completedCount / p.totalSessions) * 100) : 0;
              const img = p.coverImageUrl?.trim() || COVER_FALLBACK;
              const startLabel =
                p.programFormat === "single_workout" ? "Start workout" : "Start program";
              return (
                <li key={p.programId} className="flex w-[min(78vw,20rem)] shrink-0 snap-start md:w-auto">
                  <div className="flex w-full flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm md:flex-row">
                      <div className="relative aspect-16/10 w-full shrink-0 overflow-hidden bg-zinc-100 md:aspect-auto md:h-auto md:w-36">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={img} alt="" className="h-full w-full object-cover" />
                      </div>
                      <div className="flex min-w-0 flex-1 flex-col p-4">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <Link
                                href={p.trainingHref}
                                className="font-semibold text-zinc-900 hover:text-emerald-800"
                              >
                                {p.title}
                              </Link>
                              {p.generated && (
                                <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-semibold text-zinc-600">
                                  Coach
                                </span>
                              )}
                            </div>
                            <p className="mt-0.5 text-sm text-zinc-600">
                              {!p.started
                                ? "Not started yet"
                                : p.isComplete
                                  ? "Program complete"
                                  : p.nextSessionInProgress && p.nextSessionName
                                    ? `In progress · ${p.nextSessionName}`
                                    : p.nextSessionName
                                      ? `Next up · ${p.nextSessionName}`
                                      : "Continue your plan"}
                            </p>
                          </div>
                          {p.started && (
                            <span className="text-xs font-medium text-zinc-500">
                              {p.completedCount}/{p.totalSessions} days
                            </span>
                          )}
                        </div>
                        {p.started && (
                          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-zinc-100">
                            <div
                              className="h-full rounded-full bg-[#ccff00]"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        )}
                        {!p.started && (
                          <Link
                            href={p.trainingHref}
                            className="relative mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800 md:w-auto"
                          >
                            <NavPendingCover label="Opening program…" />
                            <Play className="h-4 w-4" />
                            {startLabel}
                          </Link>
                        )}
                        {p.started && !p.isComplete && (
                          <div className="mt-4 flex flex-col gap-2 md:flex-row md:items-center">
                            <Link
                              href={p.nextSessionHref ?? p.trainingHref}
                              className="relative inline-flex w-full items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800 md:w-auto"
                            >
                              <NavPendingCover
                                label={
                                  p.nextSessionInProgress ? "Opening workout…" : "Loading day…"
                                }
                              />
                              <Play className="h-4 w-4" />
                              {p.nextSessionInProgress
                                ? "Continue day"
                                : p.nextSessionHref
                                  ? "Start next day"
                                  : "Open program"}
                            </Link>
                            {p.nextSessionHref && (
                              <Link
                                href={p.trainingHref}
                                className="inline-flex w-full items-center justify-center rounded-lg px-3 py-2 text-sm font-medium text-zinc-600 transition hover:bg-zinc-50 hover:text-zinc-900 md:w-auto"
                              >
                                View plan
                              </Link>
                            )}
                          </div>
                        )}
                        {p.started && p.isComplete && (
                          <Link
                            href={p.trainingHref}
                            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800 md:w-auto"
                          >
                            <Play className="h-4 w-4" />
                            Train again
                          </Link>
                        )}
                      </div>
                    </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {!hasActivePro && (
        <section className="relative overflow-hidden rounded-2xl border border-amber-200/80 bg-linear-to-br from-amber-50 via-white to-lime-50 p-6 shadow-sm sm:p-8">
          <div className="relative z-1 max-w-xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-amber-900">
              <Crown className="h-3.5 w-3.5" />
              Pro membership
            </div>
            <h2 className="text-xl font-bold text-zinc-900 sm:text-2xl">Unlock every program</h2>
            <p className="mt-2 text-sm text-zinc-700 sm:text-base">
              Upgrade to <strong>Pro</strong> for full access to all courses on the platform while your subscription
              is active, plus priority updates as we ship new programs.
            </p>
            <Link
              href="/member/upgrade"
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-800"
            >
              View Pro plans
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div
            className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-[#ccff00]/30 blur-2xl"
            aria-hidden
          />
        </section>
      )}

      {hasActivePro && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50/80 px-4 py-3 text-sm text-emerald-900">
          <Crown className="h-5 w-5 shrink-0 text-emerald-700" />
          <p>
            <span className="font-semibold">
              {subscription.planName ? `${subscription.planName} is active` : "Pro is active"}
            </span>
            {subscription.status === "trialing" && subscription.currentPeriodEnd && (
              <>
                {" "}
                · trial ends {formatRenewalDate(subscription.currentPeriodEnd)}. You&apos;ll be charged then unless you
                cancel.
              </>
            )}
            {subscription.status !== "trialing" && subscription.currentPeriodEnd && (
              <>
                {" "}
                · renews {formatRenewalDate(subscription.currentPeriodEnd)}
                {subscription.cancelAtPeriodEnd ? " (cancels at period end)" : ""}
              </>
            )}
            {!subscription.currentPeriodEnd && ". You have access to all published programs."}
          </p>
        </div>
      )}

      {quickWorkouts.length > 0 && (
        <section>
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-zinc-900">Quick workouts</h2>
            <p className="text-sm text-zinc-500">One-off routines. Warm up before a match anytime</p>
          </div>
          <ul className="grid gap-3 sm:grid-cols-2">
            {quickWorkouts.map((w) => {
              const img = w.coverImageUrl?.trim() || COVER_FALLBACK;
              return (
                <li key={w.programId}>
                  <Link
                    href={w.playHref}
                    className="flex overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm transition hover:border-zinc-300 hover:shadow-md"
                  >
                    <div className="relative h-24 w-24 shrink-0 overflow-hidden bg-zinc-100">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img} alt="" className="h-full w-full object-cover" />
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col justify-center p-4">
                      <h3 className="font-semibold text-zinc-900">{w.title}</h3>
                      {w.minutesPerSession != null && (
                        <p className="mt-0.5 text-sm text-zinc-500">{w.minutesPerSession} min</p>
                      )}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <MemberFeedbackCard />
    </div>
  );
}
