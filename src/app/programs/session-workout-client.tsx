"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ChevronRight, List, X } from "lucide-react";
import { ExerciseInlinePlayer } from "./exercise-inline-player";

export type WorkoutExercise = {
  id: string;
  title: string;
  description: string | null;
  how_to: string | null;
  video_url: string | null;
};

function howToBlocks(text: string | null): string[] {
  if (!text?.trim()) return [];
  const byPara = text.split(/\n\n+/).map((p) => p.trim()).filter(Boolean);
  if (byPara.length > 1) return byPara;
  return text.split(/\n/).map((p) => p.trim()).filter(Boolean);
}

type Props = {
  programSlug: string;
  sessionName: string;
  sessionDescription: string | null;
  exercises: WorkoutExercise[];
};

export function SessionWorkoutClient({
  programSlug,
  sessionName,
  sessionDescription,
  exercises,
}: Props) {
  const [index, setIndex] = useState(0);
  const [listOpen, setListOpen] = useState(false);

  const safeLen = exercises.length;
  const current = safeLen > 0 ? exercises[Math.min(index, safeLen - 1)] : null;
  const isLast = safeLen > 0 && index >= safeLen - 1;

  const steps = useMemo(() => howToBlocks(current?.how_to ?? null), [current?.how_to]);

  const goNext = useCallback(() => {
    if (safeLen === 0) return;
    setIndex((i) => Math.min(i + 1, safeLen - 1));
    setListOpen(false);
  }, [safeLen]);

  const goPrev = useCallback(() => {
    setIndex((i) => Math.max(0, i - 1));
    setListOpen(false);
  }, []);

  useEffect(() => {
    if (listOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [listOpen]);

  const takeHref = `/programs/${programSlug}/take`;

  return (
    <div className="min-h-dvh bg-white pb-36 font-sans text-black selection:bg-[#ccff00] selection:text-black">
      <header className="sticky top-0 z-40 border-b border-gray-100 bg-white/90 px-4 py-3 backdrop-blur-md">
        <div className="mx-auto flex max-w-2xl items-center gap-3">
          <Link
            href={takeHref}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-700 transition-colors hover:bg-gray-200"
            aria-label="Back to program"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold tracking-wider text-gray-400 uppercase">Session</p>
            <h1 className="truncate text-base font-semibold text-gray-900">{sessionName}</h1>
          </div>
          {safeLen > 0 && (
            <span className="shrink-0 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium tabular-nums text-gray-600">
              {index + 1} / {safeLen}
            </span>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 pt-6">
        {sessionDescription?.trim() && (
          <p className="mb-6 text-sm leading-relaxed text-gray-600">{sessionDescription.trim()}</p>
        )}

        {safeLen === 0 ? (
          <p className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 py-12 text-center text-sm text-gray-500">
            No exercises in this session yet.
          </p>
        ) : current ? (
          <article className="space-y-5">
            {current.video_url?.trim() ? (
              <ExerciseInlinePlayer videoUrl={current.video_url.trim()} title={current.title} />
            ) : (
              <div className="flex aspect-video w-full items-center justify-center rounded-2xl bg-gray-100 text-sm text-gray-500">
                No video for this exercise
              </div>
            )}

            <div>
              <p className="text-xs font-bold tracking-wider text-gray-400 uppercase">Exercise {index + 1}</p>
              <h2 className="mt-1 text-2xl font-medium tracking-tight text-gray-900">{current.title}</h2>
              {current.description?.trim() && (
                <p className="mt-3 text-base leading-relaxed text-gray-600">{current.description.trim()}</p>
              )}
              {steps.length > 0 && (
                <ol className="mt-5 list-decimal space-y-2 pl-5 text-sm text-gray-700">
                  {steps.map((step, i) => (
                    <li key={i} className="pl-1">
                      {step}
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </article>
        ) : null}
      </main>

      {listOpen && (
        <div
          className="fixed inset-0 z-[100] flex flex-col justify-end bg-black/50 p-4 sm:justify-center"
          role="dialog"
          aria-modal="true"
          aria-label="Exercise list"
          onClick={() => setListOpen(false)}
        >
          <div
            className="max-h-[70vh] overflow-hidden rounded-2xl bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
              <span className="text-sm font-semibold text-gray-900">Exercises</span>
              <button
                type="button"
                onClick={() => setListOpen(false)}
                className="rounded-full p-2 text-gray-500 hover:bg-gray-100"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <ul className="max-h-[55vh] overflow-y-auto py-2">
              {exercises.map((ex, i) => (
                <li key={ex.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setIndex(i);
                      setListOpen(false);
                    }}
                    className={`flex w-full items-start gap-3 px-4 py-3 text-left text-sm transition-colors ${
                      i === index ? "bg-[#ccff00]/25 font-medium" : "hover:bg-gray-50"
                    }`}
                  >
                    <span className="mt-0.5 w-6 shrink-0 tabular-nums text-gray-400">{i + 1}.</span>
                    <span className="text-gray-900">{ex.title}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <nav
        className="fixed right-0 bottom-0 left-0 z-50 border-t border-gray-200 bg-white/95 px-3 pt-3 backdrop-blur-md"
        style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}
        aria-label="Workout navigation"
      >
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-2">
          <button
            type="button"
            onClick={goPrev}
            disabled={index <= 0 || safeLen === 0}
            className="flex min-w-0 flex-1 items-center justify-center gap-1 rounded-xl border border-gray-200 py-3.5 text-sm font-semibold text-gray-800 transition-colors hover:bg-gray-50 disabled:pointer-events-none disabled:opacity-35"
          >
            <ArrowLeft className="h-4 w-4 shrink-0" />
            <span className="truncate">Back</span>
          </button>

          <button
            type="button"
            onClick={() => setListOpen(true)}
            disabled={safeLen === 0}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gray-900 text-white transition-colors hover:bg-gray-800 disabled:opacity-35"
            aria-label="Exercise list"
          >
            <List className="h-5 w-5" />
          </button>

          {isLast ? (
            <Link
              href={takeHref}
              className="flex min-w-0 flex-1 items-center justify-center gap-1 rounded-xl bg-[#ccff00] py-3.5 text-center text-sm font-semibold text-black transition-colors hover:bg-[#b3e600]"
            >
              <span className="truncate">Done</span>
            </Link>
          ) : (
            <button
              type="button"
              onClick={goNext}
              disabled={safeLen === 0}
              className="flex min-w-0 flex-1 items-center justify-center gap-1 rounded-xl bg-[#ccff00] py-3.5 text-sm font-semibold text-black transition-colors hover:bg-[#b3e600] disabled:opacity-35"
            >
              <span className="truncate">Next exercise</span>
              <ChevronRight className="h-4 w-4 shrink-0" />
            </button>
          )}
        </div>
      </nav>
    </div>
  );
}
