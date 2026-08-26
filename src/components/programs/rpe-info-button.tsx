"use client";

import { useEffect, useId, useState } from "react";
import { Info, X } from "lucide-react";
import {
  noteWithoutLeadingRpeCue,
  resolveExerciseRpe,
  textMentionsRpe,
} from "@/lib/programs/rpe";

type RpeInfoButtonProps = {
  className?: string;
};

export function RpeInfoButton({ className = "" }: RpeInfoButtonProps) {
  const [open, setOpen] = useState(false);
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen(true);
        }}
        className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-white/30 bg-white/10 text-white/80 transition hover:bg-white/20 hover:text-white ${className}`}
        aria-label="What is RPE?"
      >
        <Info className="h-3.5 w-3.5" strokeWidth={2.25} />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 p-4 sm:items-center"
          role="presentation"
          onClick={() => setOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="w-full max-w-sm rounded-2xl border border-white/15 bg-zinc-900 p-5 text-left shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <h3 id={titleId} className="text-base font-semibold text-white">
                What is RPE?
              </h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white/80 hover:bg-white/20"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-white/75">
              RPE means <span className="text-white">Rate of Perceived Exertion</span> — how hard
              the set feels on a 1–10 scale. Use it to pick a weight (not an exact kg/lb number).
            </p>
            <ul className="mt-3 space-y-2 text-sm leading-relaxed text-white/75">
              <li>
                <span className="font-medium text-[#ccff00]">RPE 6–7</span> — Challenging but
                controlled; several reps left.
              </li>
              <li>
                <span className="font-medium text-[#ccff00]">RPE 8–9</span> — Last 1–2 reps are
                tough; form stays clean.
              </li>
              <li>
                <span className="font-medium text-[#ccff00]">RPE 10</span> — Max effort; no more
                clean reps.
              </li>
            </ul>
            <p className="mt-3 text-sm leading-relaxed text-white/75">
              Match the RPE shown for the exercise — lower reps usually mean a higher RPE (heavier
              feel).
            </p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="mt-5 w-full rounded-xl bg-[#ccff00] px-4 py-2.5 text-sm font-semibold text-black"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
}

type ExerciseCoachGuidanceProps = {
  note?: string | null;
  rpe?: string | null;
  intensity?: string | null;
  /** Card styles for the combined coach note + RPE block */
  noteClassName?: string;
  /** @deprecated Ignored — RPE is shown inside the same card as the note. */
  rpeClassName?: string;
  className?: string;
};

/**
 * Athlete-facing coach note with RPE target in the same card.
 * Info button appears whenever an RPE target applies.
 */
export function ExerciseCoachGuidance({
  note,
  rpe,
  intensity,
  noteClassName = "",
  className = "",
}: ExerciseCoachGuidanceProps) {
  const rpeLabel = resolveExerciseRpe({ rpe, intensity, note });
  const body = noteWithoutLeadingRpeCue(note, rpeLabel);
  const showInfo = Boolean(rpeLabel) || textMentionsRpe(note);
  const fallbackNote = !rpeLabel && !body ? note?.trim() || null : null;
  const technique = body || fallbackNote;

  if (!rpeLabel && !technique) return null;

  return (
    <div
      className={`pointer-events-auto flex items-start gap-2 text-left ${noteClassName} ${className}`}
    >
      <div className="min-w-0 flex-1 space-y-1.5">
        {rpeLabel ? (
          <p className="text-sm font-semibold tracking-wide text-[#ccff00]">
            Target RPE {rpeLabel}
          </p>
        ) : null}
        {technique ? (
          <p className="text-sm leading-relaxed text-inherit">{technique}</p>
        ) : null}
      </div>
      {showInfo ? <RpeInfoButton className="mt-0.5" /> : null}
    </div>
  );
}

type CoachNoteWithRpeInfoProps = {
  note: string;
  rpe?: string | null;
  intensity?: string | null;
  className?: string;
};

/** @deprecated Prefer ExerciseCoachGuidance — kept for call sites that only pass a note. */
export function CoachNoteWithRpeInfo({
  note,
  rpe,
  intensity,
  className = "",
}: CoachNoteWithRpeInfoProps) {
  return (
    <ExerciseCoachGuidance
      note={note}
      rpe={rpe}
      intensity={intensity}
      noteClassName={className}
    />
  );
}
