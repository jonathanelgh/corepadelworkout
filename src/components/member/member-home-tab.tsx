"use client";

import Link from "next/link";
import { ArrowRight, Crown, Newspaper, Play } from "lucide-react";
import type { MemberSubscriptionStatus } from "@/lib/member/load-subscription-status";
import type {
  ActiveProgramSummary,
  MemberHubBlogPost,
  MemberHubHomeProgram,
  QuickWorkoutSummary,
} from "@/lib/member/load-member-hub-data";

const COVER_FALLBACK = "/Padel_coach_standing.webp";

function formatRenewalDate(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return null;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function MemberHomeTab({
  hasActivePro,
  subscription,
  activePrograms,
  quickWorkouts,
  programs,
  programsError,
  posts,
  postsError,
  onBrowseWorkouts,
}: {
  hasActivePro: boolean;
  subscription: MemberSubscriptionStatus;
  activePrograms: ActiveProgramSummary[];
  quickWorkouts: QuickWorkoutSummary[];
  programs: MemberHubHomeProgram[];
  programsError: string | null;
  posts: MemberHubBlogPost[];
  postsError: string | null;
  onBrowseWorkouts: () => void;
}) {
  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">Dashboard</h1>
        <p className="mt-1 text-sm text-zinc-600">Your training hub — programs, updates, and membership.</p>
      </div>

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
              is active — plus priority updates as we ship new programs.
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
            {subscription.currentPeriodEnd && (
              <>
                {" "}
                · renews {formatRenewalDate(subscription.currentPeriodEnd)}
                {subscription.cancelAtPeriodEnd ? " (cancels at period end)" : ""}
              </>
            )}
            {!subscription.currentPeriodEnd && " — you have access to all published programs."}
          </p>
        </div>
      )}

      {activePrograms.length > 0 && (
        <section>
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-zinc-900">Your training</h2>
            <p className="text-sm text-zinc-500">Programs you&apos;ve started — pick up where you left off</p>
          </div>
          <ul className="space-y-3">
            {activePrograms.map((p) => {
              const pct =
                p.totalSessions > 0 ? Math.round((p.completedCount / p.totalSessions) * 100) : 0;
              const img = p.coverImageUrl?.trim() || COVER_FALLBACK;
              return (
                <li key={p.programId}>
                  <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
                    <div className="flex flex-col sm:flex-row">
                      <div className="relative aspect-16/10 w-full shrink-0 overflow-hidden bg-zinc-100 sm:aspect-auto sm:h-auto sm:w-36">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={img} alt="" className="h-full w-full object-cover" />
                      </div>
                      <div className="flex min-w-0 flex-1 flex-col p-4">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div>
                            <Link
                              href={p.trainingHref}
                              className="font-semibold text-zinc-900 hover:text-emerald-800"
                            >
                              {p.title}
                            </Link>
                            <p className="mt-0.5 text-sm text-zinc-600">
                              {p.isComplete
                                ? "Program complete"
                                : p.nextSessionName
                                  ? `Next up · ${p.nextSessionName}`
                                  : "Continue your plan"}
                            </p>
                          </div>
                          <span className="text-xs font-medium text-zinc-500">
                            {p.completedCount}/{p.totalSessions} days
                          </span>
                        </div>
                        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-zinc-100">
                          <div
                            className="h-full rounded-full bg-[#ccff00]"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        {!p.isComplete && (
                          <Link
                            href={p.trainingHref}
                            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800 sm:w-auto"
                          >
                            <Play className="h-4 w-4" />
                            {p.nextSessionHref ? "Continue training" : "Open program"}
                          </Link>
                        )}
                        {p.isComplete && (
                          <Link
                            href={p.trainingHref}
                            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-zinc-200 px-4 py-2.5 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-50 sm:w-auto"
                          >
                            View training log
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {quickWorkouts.length > 0 && (
        <section>
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-zinc-900">Quick workouts</h2>
            <p className="text-sm text-zinc-500">One-off routines — warm up before a match anytime</p>
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

      <section>
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-zinc-900">Latest programs</h2>
            <p className="text-sm text-zinc-500">Recently updated on the platform</p>
          </div>
          <button
            type="button"
            onClick={onBrowseWorkouts}
            className="text-sm font-medium text-emerald-700 hover:text-emerald-800"
          >
            Browse all
          </button>
        </div>
        {programsError && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            Could not load programs.
          </p>
        )}
        {!programsError && programs.length === 0 && (
          <p className="text-sm text-zinc-500">No published programs yet.</p>
        )}
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {programs.map((p) => (
              <li key={p.slug}>
                <Link
                  href={`/programs/${p.slug}`}
                  className="group flex h-full flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm transition hover:border-zinc-300 hover:shadow-md"
                >
                  <div className="relative aspect-16/10 w-full overflow-hidden bg-zinc-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={p.image || COVER_FALLBACK}
                      alt=""
                      className="h-full w-full object-cover transition group-hover:scale-[1.02]"
                    />
                  </div>
                  <div className="flex flex-1 flex-col p-4">
                    <h3 className="font-semibold text-zinc-900 group-hover:text-emerald-800">{p.title}</h3>
                    {p.description && (
                      <p className="mt-1 line-clamp-2 text-sm text-zinc-600">{p.description}</p>
                    )}
                    <div className="mt-auto flex flex-wrap items-center gap-2 pt-3 text-xs text-zinc-500">
                      {p.categoryName && (
                        <span className="rounded-full bg-zinc-100 px-2 py-0.5">{p.categoryName}</span>
                      )}
                      {p.difficultyName && <span>{p.difficultyName}</span>}
                      {p.durationLabel !== "—" && <span>{p.durationLabel}</span>}
                      {p.isFree && (
                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 font-medium text-emerald-800">
                          Free
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              </li>
          ))}
        </ul>
      </section>

      <section>
        <div className="mb-4 flex items-end justify-between gap-4">
          <div className="flex items-center gap-2">
            <Newspaper className="h-5 w-5 text-zinc-400" />
            <div>
              <h2 className="text-lg font-semibold text-zinc-900">From the blog</h2>
              <p className="text-sm text-zinc-500">Latest articles</p>
            </div>
          </div>
          <Link href="/blog" className="text-sm font-medium text-emerald-700 hover:text-emerald-800">
            All posts
          </Link>
        </div>
        {postsError && (
          <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Blog could not be loaded. Run the latest database migration if{" "}
            <code className="font-mono">blog_posts</code> is missing.
          </p>
        )}
        {!postsError && posts.length === 0 && (
          <p className="text-sm text-zinc-500">No posts published yet.</p>
        )}
        <ul className="space-y-3">
          {posts.map((post) => (
            <li key={post.slug}>
              <Link
                href={`/blog/${post.slug}`}
                className="block rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition hover:border-zinc-300 hover:shadow-md"
              >
                <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">
                  {post.published_at ? post.published_at.slice(0, 10) : ""}
                </p>
                <h3 className="mt-1 font-semibold text-zinc-900">{post.title}</h3>
                {post.excerpt && <p className="mt-1 line-clamp-2 text-sm text-zinc-600">{post.excerpt}</p>}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
