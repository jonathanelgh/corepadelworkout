"use client";

import { useEffect, useState, useTransition } from "react";
import { Lightbulb, Loader2, MessageSquareHeart, ThumbsDown, ThumbsUp, X } from "lucide-react";
import { submitMemberFeedback } from "@/app/member/feedback-actions";
import type { FeedbackCategory } from "@/lib/member/feedback-categories";

const QUICK_TYPES: {
  id: FeedbackCategory;
  label: string;
  hint: string;
  icon: typeof ThumbsUp;
}[] = [
  {
    id: "good",
    label: "Good",
    hint: "What’s working well",
    icon: ThumbsUp,
  },
  {
    id: "bad",
    label: "Needs work",
    hint: "Bugs or frustrations",
    icon: ThumbsDown,
  },
  {
    id: "idea",
    label: "Ideas",
    hint: "Improvements you’d love",
    icon: Lightbulb,
  },
];

const TYPE_LABELS: Record<FeedbackCategory, string> = {
  good: "Good",
  bad: "Needs work",
  idea: "Ideas",
  general: "General",
  bug: "Bug / issue",
  program: "Programs / workouts",
  other: "Other",
};

function FeedbackModal({
  open,
  category,
  onClose,
}: {
  open: boolean;
  category: FeedbackCategory;
  onClose: () => void;
}) {
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) return;
    setMessage("");
    setError(null);
    setDone(false);
  }, [open, category]);

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

  const typeMeta = QUICK_TYPES.find((t) => t.id === category);
  const TypeIcon = typeMeta?.icon ?? MessageSquareHeart;

  return (
    <div className="fixed inset-0 z-120" role="presentation">
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
          <div className="min-w-0">
            <h2 id="member-feedback-title" className="text-lg font-semibold text-zinc-900">
              {done ? "Thanks!" : "Share your feedback"}
            </h2>
            {!done && (
              <p className="mt-0.5 flex items-center gap-1.5 text-sm text-zinc-500">
                <TypeIcon className="h-3.5 w-3.5 shrink-0" aria-hidden />
                {TYPE_LABELS[category]}
              </p>
            )}
          </div>
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
                  placeholder={
                    category === "good"
                      ? "What do you like? What should we keep doing?"
                      : category === "bad"
                        ? "What went wrong or felt frustrating?"
                        : "What would make training better for you?"
                  }
                  className="mt-1.5 w-full resize-none rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-zinc-400"
                  required
                  autoFocus
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
  const [category, setCategory] = useState<FeedbackCategory>("idea");

  function openWith(next: FeedbackCategory) {
    setCategory(next);
    setOpen(true);
  }

  return (
    <>
      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-7">
        <div className="mb-5">
          <div className="mb-2 inline-flex items-center gap-2 text-zinc-500">
            <MessageSquareHeart className="h-5 w-5" />
            <span className="text-xs font-semibold uppercase tracking-wide">Feedback</span>
          </div>
          <h2 className="text-lg font-semibold text-zinc-900">How is Core Padel working for you?</h2>
          <p className="mt-1 max-w-xl text-sm text-zinc-600">
            Good, bad, or ideas for improvement — tap one and tell us. We read every message.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {QUICK_TYPES.map((type) => {
            const Icon = type.icon;
            return (
              <button
                key={type.id}
                type="button"
                onClick={() => openWith(type.id)}
                className="flex flex-col items-start rounded-xl border border-zinc-200 bg-zinc-50/80 px-4 py-4 text-left transition hover:border-zinc-300 hover:bg-white hover:shadow-sm"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-900 text-[#ccff00]">
                  <Icon className="h-4 w-4" aria-hidden />
                </span>
                <span className="mt-3 text-sm font-semibold text-zinc-900">{type.label}</span>
                <span className="mt-0.5 text-xs text-zinc-500">{type.hint}</span>
              </button>
            );
          })}
        </div>
      </section>
      <FeedbackModal open={open} category={category} onClose={() => setOpen(false)} />
    </>
  );
}
