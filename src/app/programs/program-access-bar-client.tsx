"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useState, useTransition } from "react";
import { SubscribeButton } from "@/components/billing/subscribe-button";
import { CancelProgramButton } from "@/components/programs/cancel-program-button";
import { startProgramTraining } from "./program-progress-actions";
import { usesProgramProgress, type ProgramFormat } from "@/lib/programs/program-format";
import type { ProgramProgressView } from "@/lib/programs/program-progress";
import { formatActiveWeekProgressLabel, playHrefForSession } from "@/lib/programs/program-progress";

type Props = {
  programSlug: string;
  programFormat: ProgramFormat;
  isFree: boolean;
  hasAccess: boolean;
  isSignedIn: boolean;
  minsLabel: string | null;
  kcalLabel: string | null;
  progress: ProgramProgressView | null;
};

export function ProgramAccessBarClient({
  programSlug,
  programFormat,
  isFree,
  hasAccess,
  isSignedIn,
  minsLabel,
  kcalLabel,
  progress,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  const isSingleWorkout = !usesProgramProgress(programFormat);
  const nextSession = progress?.nextSession;
  const firstSession = progress?.sessions[0];
  const playHref =
    nextSession != null
      ? playHrefForSession(programSlug, nextSession.id)
      : firstSession
        ? playHrefForSession(programSlug, firstSession.id)
        : `/programs/${programSlug}/play`;

  const ctaLabel = isSingleWorkout
    ? "Start workout"
    : !progress?.runId
      ? "Start program"
      : progress.isComplete
        ? "Repeat program"
        : nextSession
          ? `Continue · ${nextSession.name}`
          : "Continue";

  function onStart() {
    setMessage(null);
    startTransition(async () => {
      const result = await startProgramTraining(programSlug);
      if ("error" in result) {
        if (result.code === "SIGN_IN_REQUIRED") {
          const next = pathname?.startsWith("/") ? pathname : `/programs/${programSlug}`;
          router.push(`/login?next=${encodeURIComponent(next)}`);
          return;
        }
        setMessage(result.error);
        return;
      }
      router.push(result.playHref);
      router.refresh();
    });
  }

  const weekProgressLabel =
    !isSingleWorkout && progress && progress.totalSessions > 0
      ? formatActiveWeekProgressLabel(progress)
      : null;

  return (
    <div className="fixed right-0 bottom-0 left-0 z-50 md:left-1/2">
      {message && (
        <div className="border-t border-amber-200 bg-amber-50 px-4 py-2.5 text-center text-sm font-medium text-amber-900">
          {message}
        </div>
      )}
      <div className="flex items-center justify-between border-t border-gray-100 bg-white p-4 md:p-6">
        <div className="hidden text-sm text-gray-500 md:block">
          {isFree && <div className="mb-1 font-medium text-emerald-700">Free</div>}
          {!isSingleWorkout && weekProgressLabel && (
            <div className="mb-1 font-medium text-gray-800">{weekProgressLabel}</div>
          )}
          {isSingleWorkout && <div className="mb-1 font-medium text-gray-800">One-off routine</div>}
          {minsLabel && <div>{minsLabel}</div>}
          {kcalLabel && <div className="text-xs text-gray-400">{kcalLabel}</div>}
        </div>

        {hasAccess ? (
          <div className="flex w-full flex-col items-stretch gap-3 md:w-auto md:items-end">
            <button
              type="button"
              disabled={pending}
              onClick={() => onStart()}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-[#ccff00] px-8 py-4 text-lg font-semibold text-black transition-colors hover:bg-[#b3e600] disabled:opacity-60 md:w-auto"
            >
              {pending ? "Starting…" : ctaLabel}
            </button>
            {!isSingleWorkout && progress?.runId && (
              <CancelProgramButton programSlug={programSlug} />
            )}
          </div>
        ) : isFree && !isSignedIn ? (
          <Link
            href={`/login?next=${encodeURIComponent(`/programs/${programSlug}`)}`}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-[#ccff00] px-8 py-4 text-lg font-semibold text-black transition-colors hover:bg-[#b3e600] md:w-auto"
          >
            Sign in to start
          </Link>
        ) : isFree ? (
          <button
            type="button"
            disabled={pending}
            onClick={() => onStart()}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-[#ccff00] px-8 py-4 text-lg font-semibold text-black transition-colors hover:bg-[#b3e600] disabled:opacity-60 md:w-auto"
          >
            {pending ? "Starting…" : isSingleWorkout ? "Start workout" : "Start free program"}
          </button>
        ) : (
          <div className="flex w-full flex-col items-stretch gap-2 md:w-auto md:items-end">
            <SubscribeButton className="flex w-full items-center justify-center gap-2 rounded-full bg-[#ccff00] px-8 py-4 text-lg font-semibold text-black transition-colors hover:bg-[#b3e600] disabled:opacity-60 md:w-auto">
              Unlock with Pro
            </SubscribeButton>
            <p className="text-center text-xs text-gray-500 md:text-right">
              Or{" "}
              <Link href="/member/upgrade" className="font-medium text-gray-700 underline">
                view membership
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
