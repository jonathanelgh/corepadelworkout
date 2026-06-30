"use client";

import { CalendarCheck, Clock } from "lucide-react";
import {
  buildProgramTrainingLog,
  formatTrainingDuration,
  formatTrainingTimestamp,
  type ProgramProgressView,
} from "@/lib/programs/program-progress";

export function ProgramTrainingLogPanel({
  progress,
}: {
  progress: ProgramProgressView;
}) {
  const entries = buildProgramTrainingLog(progress);

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4 sm:p-6">
      {progress.startedAt && (
        <div className="mb-6 rounded-xl border border-zinc-100 bg-zinc-50 px-4 py-3">
          <p className="text-xs font-semibold tracking-wide text-zinc-500 uppercase">
            Program started
          </p>
          <p className="mt-1 text-sm font-medium text-zinc-900">
            {formatTrainingTimestamp(progress.startedAt)}
          </p>
        </div>
      )}

      {entries.length === 0 ? (
        <div className="py-10 text-center">
          <CalendarCheck className="mx-auto h-8 w-8 text-zinc-300" />
          <p className="mt-3 text-sm font-medium text-zinc-700">No training logged yet</p>
          <p className="mt-1 text-sm text-zinc-500">
            Start your next session to see started and completed times here.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {entries.map((entry) => {
            const duration =
              entry.startedAt && entry.completedAt
                ? formatTrainingDuration(entry.startedAt, entry.completedAt)
                : null;
            const inProgress = Boolean(entry.startedAt && !entry.completedAt);

            return (
              <li
                key={entry.sessionId}
                className="rounded-xl border border-zinc-200 bg-zinc-50/50 px-4 py-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    {entry.weekName && (
                      <p className="text-[11px] font-semibold tracking-wide text-zinc-500 uppercase">
                        {entry.weekName}
                      </p>
                    )}
                    <p className="font-medium text-zinc-900">{entry.label}</p>
                  </div>
                  {inProgress && (
                    <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-semibold text-amber-800">
                      In progress
                    </span>
                  )}
                  {entry.completedAt && (
                    <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-800">
                      Completed
                    </span>
                  )}
                </div>

                <dl className="mt-3 space-y-2 text-sm">
                  {entry.startedAt && (
                    <div className="flex items-start gap-2">
                      <dt className="w-20 shrink-0 text-zinc-500">Started</dt>
                      <dd className="font-medium text-zinc-800">
                        {formatTrainingTimestamp(entry.startedAt)}
                      </dd>
                    </div>
                  )}
                  {entry.completedAt && (
                    <div className="flex items-start gap-2">
                      <dt className="w-20 shrink-0 text-zinc-500">Completed</dt>
                      <dd className="font-medium text-zinc-800">
                        {formatTrainingTimestamp(entry.completedAt)}
                      </dd>
                    </div>
                  )}
                  {duration && (
                    <div className="flex items-center gap-2 text-zinc-600">
                      <Clock className="h-3.5 w-3.5 shrink-0" />
                      <span>{duration}</span>
                    </div>
                  )}
                </dl>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
