"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ChevronRight, Play, Trophy } from "lucide-react";
import { BackButton } from "@/components/navigation/back-button";
import { CancelProgramButton } from "@/components/programs/cancel-program-button";
import { ProgramSchedulePanel } from "@/components/programs/program-schedule-panel";
import { ProgramTrainingLogPanel } from "@/components/programs/program-training-log-panel";
import {
  formatActiveWeekProgressLabel,
  playHrefForSession,
  type ProgramProgressView,
} from "@/lib/programs/program-progress";
import { programInfoHref } from "@/lib/programs/program-routes";
import { sessionDisplayLabel } from "@/lib/programs/program-sessions";

const COVER_FALLBACK = "/Padel_coach_standing.webp";

type HubTab = "schedule" | "log";

export function ActiveProgramHub({
  programSlug,
  programTitle,
  coverImageUrl,
  minutesPerSession,
  difficultyLabel,
  progress,
}: {
  programSlug: string;
  programTitle: string;
  coverImageUrl: string | null;
  minutesPerSession: number | null;
  difficultyLabel: string | null;
  progress: ProgramProgressView;
}) {
  const [tab, setTab] = useState<HubTab>("schedule");

  const cover = coverImageUrl?.trim() || COVER_FALLBACK;
  const pct =
    progress.totalSessions > 0
      ? Math.round((progress.completedCount / progress.totalSessions) * 100)
      : 0;
  const weekLabel = formatActiveWeekProgressLabel(progress);
  const next = progress.nextSession;
  const nextIndex = next ? progress.sessions.findIndex((s) => s.id === next.id) : -1;
  const nextLabel = next && nextIndex >= 0 ? sessionDisplayLabel(next, nextIndex) : null;
  const nextHref = next ? playHrefForSession(programSlug, next.id) : null;
  const firstSession = progress.sessions[0];
  const repeatHref = firstSession ? playHrefForSession(programSlug, firstSession.id) : null;
  const mins =
    minutesPerSession != null && Number.isFinite(minutesPerSession) && minutesPerSession > 0
      ? `${minutesPerSession} min`
      : next?.durationMinutes != null && next.durationMinutes > 0
        ? `~${next.durationMinutes} min`
        : null;

  const logCount = progress.sessions.filter((s) => s.startedAt || s.completedAt).length;

  return (
    <div className="min-h-screen bg-zinc-50 pb-10 font-sans text-zinc-900 selection:bg-[#ccff00] selection:text-black">
      <header className="sticky top-0 z-40 border-b border-zinc-200/80 bg-zinc-50/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-2xl items-center justify-between px-4 sm:px-6">
          <BackButton
            fallbackHref="/member"
            ariaLabel="Back to dashboard"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-600 transition hover:text-zinc-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </BackButton>
          <Link
            href={programInfoHref(programSlug)}
            className="text-sm font-medium text-emerald-700 hover:text-emerald-800"
          >
            Program info
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
          <div className="relative aspect-[21/9] w-full overflow-hidden bg-zinc-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={cover} alt="" className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-5">
              {difficultyLabel && (
                <span className="mb-2 inline-block rounded-full bg-[#ccff00] px-2.5 py-0.5 text-[10px] font-bold tracking-wide text-black uppercase">
                  {difficultyLabel}
                </span>
              )}
              <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">{programTitle}</h1>
              {progress.isComplete ? (
                <p className="mt-1 flex items-center gap-1.5 text-sm text-emerald-200">
                  <Trophy className="h-4 w-4" />
                  Program complete
                </p>
              ) : weekLabel ? (
                <p className="mt-1 text-sm text-zinc-200">{weekLabel}</p>
              ) : null}
            </div>
          </div>

          <div className="grid grid-cols-3 divide-x divide-zinc-100 border-b border-zinc-100">
            <div className="px-4 py-4 text-center">
              <p className="text-lg font-semibold tabular-nums">
                {progress.completedCount}/{progress.totalSessions}
              </p>
              <p className="text-xs text-zinc-500">Days done</p>
            </div>
            <div className="px-4 py-4 text-center">
              <p className="text-lg font-semibold tabular-nums">{pct}%</p>
              <p className="text-xs text-zinc-500">Complete</p>
            </div>
            <div className="px-4 py-4 text-center">
              <p className="text-lg font-semibold tabular-nums">{mins ?? "—"}</p>
              <p className="text-xs text-zinc-500">Per session</p>
            </div>
          </div>

          <div className="px-5 py-4">
            <div className="h-2 overflow-hidden rounded-full bg-zinc-100">
              <div
                className="h-full rounded-full bg-[#ccff00] transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        </div>

        {!progress.isComplete && next && nextHref && (
          <section className="mt-6">
            <h2 className="mb-3 text-sm font-semibold tracking-wide text-zinc-500 uppercase">Next up</h2>
            <Link
              href={nextHref}
              className="group flex items-center gap-4 rounded-2xl border-2 border-[#ccff00] bg-white p-5 shadow-sm transition hover:border-[#b3e600] hover:shadow-md"
            >
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#ccff00] text-black transition group-hover:bg-[#b3e600]">
                <Play className="h-6 w-6 fill-current" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-lg font-semibold text-zinc-900">{nextLabel ?? next.name}</p>
                <p className="mt-0.5 text-sm text-zinc-500">
                  {next.exerciseCount} exercise{next.exerciseCount === 1 ? "" : "s"}
                  {mins ? ` · ${mins}` : ""}
                </p>
              </div>
              <ChevronRight className="h-5 w-5 shrink-0 text-zinc-400 transition group-hover:text-zinc-700" />
            </Link>
          </section>
        )}

        {progress.isComplete && (
          <section className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-center">
            <Trophy className="mx-auto h-8 w-8 text-emerald-600" />
            <p className="mt-2 font-semibold text-emerald-900">You finished this program</p>
            <p className="mt-1 text-sm text-emerald-800">
              {progress.completedCount} training day{progress.completedCount === 1 ? "" : "s"} logged.
            </p>
            {repeatHref && (
              <Link
                href={repeatHref}
                className="mt-4 inline-flex rounded-xl bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800"
              >
                Train again
              </Link>
            )}
          </section>
        )}

        <section className="mt-8">
          <div className="mb-4 flex gap-1 rounded-xl border border-zinc-200 bg-white p-1">
            <button
              type="button"
              onClick={() => setTab("schedule")}
              className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
                tab === "schedule"
                  ? "bg-zinc-900 text-white"
                  : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
              }`}
            >
              Schedule
            </button>
            <button
              type="button"
              onClick={() => setTab("log")}
              className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
                tab === "log"
                  ? "bg-zinc-900 text-white"
                  : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
              }`}
            >
              Training log{logCount > 0 ? ` (${logCount})` : ""}
            </button>
          </div>

          {tab === "schedule" ? (
            <ProgramSchedulePanel programSlug={programSlug} progress={progress} embedded />
          ) : (
            <ProgramTrainingLogPanel progress={progress} />
          )}
        </section>

        <section className="mt-10 border-t border-zinc-200 pt-8">
          <CancelProgramButton
            programSlug={programSlug}
            className="w-full rounded-xl border border-red-200 bg-white px-4 py-3 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:opacity-60"
          />
          <p className="mt-2 text-center text-xs text-zinc-500">
            Removes this program from your dashboard and clears your progress.
          </p>
        </section>
      </main>
    </div>
  );
}
