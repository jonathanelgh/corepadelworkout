"use client";

import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { Loader2, SlidersHorizontal, Sparkles, X } from "lucide-react";
import { generateAiProgram } from "@/app/admin/programs/ai-program-actions";
import type { AiProgramFormDraft } from "@/lib/programs/map-ai-program-draft";
import type { MemberPickerOption } from "@/lib/programs/profile-ai-context";

type LocationOption = { id: string; name: string; slug: string };

const EXAMPLE_BRIEFS = [
  "4-week off-season strength block for intermediate players, 3 gym sessions per week, focus on legs, rotation, and shoulder durability.",
  "2-week pre-tournament taper: shorter sessions, power and mobility, avoid heavy fatigue.",
  "6-week home program with minimal equipment, 4 sessions per week, 35 minutes each, for recreational padel players.",
];

export function AiProgramGeneratorModal({
  open,
  onClose,
  locations,
  members = [],
  onApply,
}: {
  open: boolean;
  onClose: () => void;
  locations: LocationOption[];
  members?: MemberPickerOption[];
  onApply: (draft: AiProgramFormDraft, warnings: string[]) => void;
}) {
  const titleId = useId();
  const [mounted, setMounted] = useState(false);
  const [brief, setBrief] = useState("");
  const [locationIds, setLocationIds] = useState<string[]>([]);
  const [durationWeeks, setDurationWeeks] = useState("");
  const [sessionsPerWeek, setSessionsPerWeek] = useState("");
  const [minutesPerSession, setMinutesPerSession] = useState("");
  const [targetUserId, setTargetUserId] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    setBrief("");
    setError(null);
    setPending(false);
    setDurationWeeks("");
    setSessionsPerWeek("");
    setMinutesPerSession("");
    setLocationIds(locations.length > 0 ? [locations[0]!.id] : []);
    setTargetUserId("");
  }, [open, locations]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !pending) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, pending]);

  function toggleLocation(id: string) {
    setLocationIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function handleGenerate() {
    setError(null);
    if (brief.trim().length < 20) {
      setError("Describe the program in at least 20 characters.");
      return;
    }
    if (locationIds.length === 0) {
      setError("Select at least one training location.");
      return;
    }

    setPending(true);
    const res = await generateAiProgram({
      brief: brief.trim(),
      locationIds,
      durationWeeks: durationWeeks.trim() ? Number.parseInt(durationWeeks, 10) : null,
      sessionsPerWeek: sessionsPerWeek.trim() ? Number.parseInt(sessionsPerWeek, 10) : null,
      minutesPerSession: minutesPerSession.trim() ? Number.parseInt(minutesPerSession, 10) : null,
      targetUserId: targetUserId || null,
    });
    setPending(false);

    if ("error" in res) {
      setError(res.error);
      return;
    }

    onApply(res.draft, res.warnings);
    onClose();
  }

  if (!open || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        aria-label="Close"
        onClick={() => !pending && onClose()}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative flex max-h-[min(92vh,720px)] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl border border-gray-200 bg-white shadow-xl sm:rounded-2xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-gray-200 px-5 py-4">
          <div className="min-w-0">
            <h2 id={titleId} className="flex items-center gap-2 text-lg font-semibold text-gray-900">
              <Sparkles className="h-5 w-5 shrink-0" />
              AI program builder
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Builds a full program using only exercises from your library.{" "}
              <Link
                href="/admin/programs/ai/prompts"
                className="inline-flex items-center gap-1 font-medium text-gray-700 underline underline-offset-2 hover:text-black"
                onClick={(e) => e.stopPropagation()}
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
                Edit AI prompts
              </Link>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={pending}
            className="shrink-0 rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {members.length > 0 && (
            <div>
              <label htmlFor="ai-target-member" className="block text-sm font-medium text-gray-700 mb-1.5">
                Personalize for member
              </label>
              <select
                id="ai-target-member"
                value={targetUserId}
                onChange={(e) => setTargetUserId(e.target.value)}
                disabled={pending}
                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-black disabled:opacity-60"
              >
                <option value="">Generic (no member profile)</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                    {m.email ? ` — ${m.email}` : ""}
                  </option>
                ))}
              </select>
              <p className="mt-1.5 text-xs text-gray-500">
                Injects age, gender, padel level, pains, goals, and training environment from their profile.
              </p>
            </div>
          )}

          <div>
            <label htmlFor="ai-program-brief" className="block text-sm font-medium text-gray-700 mb-1.5">
              What should this program achieve?
            </label>
            <textarea
              id="ai-program-brief"
              value={brief}
              onChange={(e) => setBrief(e.target.value)}
              rows={5}
              disabled={pending}
              placeholder="Audience, duration, sessions per week, focus areas (power, mobility, injury prevention), equipment constraints…"
              className="w-full resize-y rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-black disabled:opacity-60"
            />
            <div className="mt-2 flex flex-wrap gap-2">
              {EXAMPLE_BRIEFS.map((ex) => (
                <button
                  key={ex}
                  type="button"
                  disabled={pending}
                  onClick={() => setBrief(ex)}
                  className="rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs text-gray-600 hover:border-gray-300 hover:bg-white disabled:opacity-50"
                >
                  Example
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="block text-sm font-medium text-gray-700 mb-2">Training locations</p>
            <p className="text-xs text-gray-500 mb-2">
              One curriculum track per location (e.g. Gym + Home). Exercises must match each location.
            </p>
            <div className="flex flex-wrap gap-2">
              {locations.map((loc) => {
                const on = locationIds.includes(loc.id);
                return (
                  <button
                    key={loc.id}
                    type="button"
                    disabled={pending}
                    onClick={() => toggleLocation(loc.id)}
                    className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-50 ${
                      on
                        ? "border-black bg-black text-white"
                        : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    {loc.name}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label htmlFor="ai-weeks" className="block text-xs font-medium text-gray-600 mb-1">
                Weeks
              </label>
              <input
                id="ai-weeks"
                type="number"
                min={0}
                value={durationWeeks}
                onChange={(e) => setDurationWeeks(e.target.value)}
                disabled={pending}
                placeholder="4"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black disabled:opacity-60"
              />
            </div>
            <div>
              <label htmlFor="ai-freq" className="block text-xs font-medium text-gray-600 mb-1">
                / week
              </label>
              <input
                id="ai-freq"
                type="number"
                min={0}
                value={sessionsPerWeek}
                onChange={(e) => setSessionsPerWeek(e.target.value)}
                disabled={pending}
                placeholder="3"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black disabled:opacity-60"
              />
            </div>
            <div>
              <label htmlFor="ai-mins" className="block text-xs font-medium text-gray-600 mb-1">
                Mins / session
              </label>
              <input
                id="ai-mins"
                type="number"
                min={0}
                value={minutesPerSession}
                onChange={(e) => setMinutesPerSession(e.target.value)}
                disabled={pending}
                placeholder="45"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black disabled:opacity-60"
              />
            </div>
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-800">
              {error}
            </div>
          )}
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-gray-200 px-5 py-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={pending}
            className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleGenerate}
            disabled={pending || locations.length === 0}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-black px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-60"
          >
            {pending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating…
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Generate program
              </>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
