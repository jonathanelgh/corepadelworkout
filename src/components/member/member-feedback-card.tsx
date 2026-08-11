"use client";

import { useEffect, useState, useTransition } from "react";
import { Loader2, MessageSquarePlus, X } from "lucide-react";
import {
  FEEDBACK_CATEGORIES,
  submitMemberFeedback,
  type FeedbackCategory,
} from "@/app/member/feedback-actions";

const CATEGORY_OPTIONS: { id: FeedbackCategory; label: string }[] = [
  { id: "general", label: "General" },
  { id: "bug", label: "Bug / issue" },
  { id: "idea", label: "Idea / feature" },
  { id: "program", label: "Programs / workouts" },
  { id: "other", label: "Other" },
];

function FeedbackModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [message, setMessage] = useState("");
  const [category, setCategory] = useState<FeedbackCategory>("general");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) return;
    setMessage("");
    setCategory("general");
    setError(null);
    setDone(false);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !pending) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, pending, onClose]);

  if (!open) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await submitMemberFeedback({ message, category });
      if (!result.ok) {
        setError(result.message);
        return;
      }
      setDone(true);
    });
  }

  return (
    <div className="fixed inset-0 z-[120]" role="presentation">
      <button
        type="button"
        className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
        aria-label="Close feedback"
        disabled={pending}
        onClick={() => {
          if (!pending) onClose();
        }}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="member-feedback-title"
        className="absolute inset-x-0 bottom-0 flex max-h-[92dvh] flex-col rounded-t-3xl border border-zinc-200 bg-white shadow-2xl sm:inset-auto sm:left-1/2 sm:top-1/2 sm:max-h-[min(85vh,560px)] sm:w-full sm:max-w-lg sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-zinc-100 px-5 py-4">
          <h2 id="member-feedback-title" className="text-lg font-semibold text-zinc-900">
            {done ? "Thanks!" : "Send feedback"}
          </h2>
          <button
            type="button"
            onClick={() => {
              if (!pending) onClose();
            }}
            disabled={pending}
            className="rounded-full p-2 text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-800 disabled:opacity-50"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {done ? (
          <div className="px-5 py-8 text-center">
            <p className="text-sm text-zinc-600">
              Your feedback was sent. We read every message and use it to improve Core Padel
              Workout.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-6 inline-flex rounded-xl bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4">
              <div>
                <label htmlFor="feedback-category" className="text-sm font-medium text-zinc-800">
                  Category
                </label>
                <select
                  id="feedback-category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as FeedbackCategory)}
                  disabled={pending}
                  className="mt-1.5 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none focus:border-zinc-400"
                >
                  {CATEGORY_OPTIONS.filter((c) =>
                    (FEEDBACK_CATEGORIES as readonly string[]).includes(c.id)
                  ).map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="feedback-message" className="text-sm font-medium text-zinc-800">
                  Your message
                </label>
                <textarea
                  id="feedback-message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  disabled={pending}
                  rows={6}
                  maxLength={4000}
                  placeholder="What should we know? Bugs, ideas, or anything about programs and training…"
                  className="mt-1.5 w-full resize-none rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-zinc-400"
                  required
                />
                <p className="mt-1 text-right text-xs text-zinc-400">{message.length}/4000</p>
              </div>
              {error && (
                <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                  {error}
                </p>
              )}
            </div>
            <div className="shrink-0 border-t border-zinc-100 px-5 py-4">
              <button
                type="submit"
                disabled={pending || message.trim().length < 3}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:opacity-50"
              >
                {pending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Sending…
                  </>
                ) : (
                  "Send feedback"
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export function MemberFeedbackCard() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="mb-2 inline-flex items-center gap-2 text-zinc-500">
              <MessageSquarePlus className="h-5 w-5" />
              <span className="text-xs font-semibold uppercase tracking-wide">Feedback</span>
            </div>
            <h2 className="text-lg font-semibold text-zinc-900">How is it going?</h2>
            <p className="mt-1 max-w-xl text-sm text-zinc-600">
              Spot a bug, missing feature, or something that would make training better? Tell us —
              we read every message.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex shrink-0 items-center justify-center rounded-xl bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800"
          >
            Leave feedback
          </button>
        </div>
      </section>
      <FeedbackModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
