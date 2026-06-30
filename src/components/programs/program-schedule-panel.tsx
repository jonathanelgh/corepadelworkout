"use client";

import Link from "next/link";
import { CheckCircle2, Circle, Play } from "lucide-react";
import type { ProgramProgressView } from "@/lib/programs/program-progress";
import { playHrefForSession } from "@/lib/programs/program-progress";
import { sessionDisplayLabel } from "@/lib/programs/program-sessions";

function SessionRow({
  programSlug,
  session,
  flatIndex,
  done,
  isNext,
}: {
  programSlug: string;
  session: ProgramProgressView["sessions"][number];
  flatIndex: number;
  done: boolean;
  isNext: boolean;
}) {
  const href = playHrefForSession(programSlug, session.id);
  const label = sessionDisplayLabel(session, flatIndex);
  return (
    <li
      className={`flex items-center gap-4 rounded-2xl border bg-white p-4 ${
        isNext ? "border-[#ccff00] shadow-sm" : "border-gray-100"
      }`}
    >
      {done ? (
        <CheckCircle2 className="h-6 w-6 shrink-0 text-emerald-600" />
      ) : (
        <Circle className={`h-6 w-6 shrink-0 ${isNext ? "text-[#ccff00]" : "text-gray-300"}`} />
      )}
      <div className="min-w-0 flex-1">
        <p className="font-medium text-gray-900">{label}</p>
        <p className="mt-0.5 text-xs text-gray-500">
          {session.exerciseCount} exercise{session.exerciseCount === 1 ? "" : "s"}
          {session.durationMinutes != null && session.durationMinutes > 0
            ? ` · ~${session.durationMinutes} min`
            : ""}
          {done && session.completedAt
            ? ` · Completed ${new Date(session.completedAt).toLocaleDateString()}`
            : ""}
        </p>
      </div>
      {!done && (
        <Link
          href={href}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[#ccff00] px-4 py-2 text-sm font-semibold text-black transition hover:bg-[#b3e600]"
        >
          <Play className="h-3.5 w-3.5" />
          {isNext ? "Continue" : "Start"}
        </Link>
      )}
    </li>
  );
}

export function ProgramSchedulePanel({
  programSlug,
  progress,
  embedded = false,
}: {
  programSlug: string;
  progress: ProgramProgressView;
  /** Hide summary header when nested inside the training hub */
  embedded?: boolean;
}) {
  const pct =
    progress.totalSessions > 0
      ? Math.round((progress.completedCount / progress.totalSessions) * 100)
      : 0;

  const scheduleBody =
    progress.weeks.length > 0 ? (
        <div className="space-y-8">
          {progress.weeks.map((week) => (
            <div key={week.id}>
              <h3 className="mb-3 text-sm font-semibold tracking-wide text-gray-500 uppercase">
                {week.name}
              </h3>
              {week.sessions.length > 0 ? (
                <ul className="space-y-3">
                  {week.sessions.map((session) => {
                    const flatIndex = progress.sessions.findIndex((s) => s.id === session.id);
                    const done = Boolean(session.completedAt);
                    const isNext = progress.nextSession?.id === session.id;
                    return (
                      <SessionRow
                        key={session.id}
                        programSlug={programSlug}
                        session={session}
                        flatIndex={flatIndex >= 0 ? flatIndex : 0}
                        done={done}
                        isNext={isNext}
                      />
                    );
                  })}
                </ul>
              ) : (
                <p className="text-sm text-gray-500">No training days in this week yet.</p>
              )}
            </div>
          ))}
        </div>
      ) : (
        <ul className="space-y-3">
          {progress.sessions.map((session, index) => {
            const done = Boolean(session.completedAt);
            const isNext = progress.nextSession?.id === session.id;
            return (
              <SessionRow
                key={session.id}
                programSlug={programSlug}
                session={session}
                flatIndex={index}
                done={done}
                isNext={isNext}
              />
            );
          })}
        </ul>
      );

  if (embedded) {
    return (
      <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 sm:p-6">
        {scheduleBody}
      </div>
    );
  }

  return (
    <section className="mb-12 rounded-3xl border border-gray-100 bg-gray-50 p-6 sm:p-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Training plan</h2>
          <p className="mt-1 text-sm text-gray-600">
            {progress.completedCount} of {progress.totalSessions} days completed
          </p>
        </div>
        <div className="min-w-[140px] flex-1 sm:max-w-xs">
          <div className="h-2 overflow-hidden rounded-full bg-gray-200">
            <div
              className="h-full rounded-full bg-[#ccff00] transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="mt-1 text-right text-xs font-medium text-gray-500">{pct}%</p>
        </div>
      </div>
      {scheduleBody}
    </section>
  );
}
