"use client";

import { useState } from "react";
import type { ProgramExerciseItem } from "@/lib/programs/program-exercises";
import { formatSetsRepsLabel } from "@/lib/programs/program-exercises";

const COVER_FALLBACK = "/Padel_coach_standing.webp";

export function ProgramDetailTabs({
  description,
  exercises,
}: {
  description: string | null;
  exercises: ProgramExerciseItem[];
}) {
  const [tab, setTab] = useState<"exercises" | "details">("exercises");

  return (
    <div>
      <div className="mb-6 flex gap-2 border-b border-gray-200">
        {(
          [
            ["exercises", "Exercises"],
            ["details", "Details"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`border-b-2 px-4 py-2.5 text-sm font-semibold transition ${
              tab === id
                ? "border-black text-gray-900"
                : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "exercises" && (
        <ul className="space-y-3">
          {exercises.length === 0 ? (
            <li className="rounded-2xl border border-dashed border-gray-200 py-10 text-center text-sm text-gray-500">
              No exercises in this program yet.
            </li>
          ) : (
            exercises.map((ex) => {
              const img = ex.image_url?.trim() || COVER_FALLBACK;
              const meta = formatSetsRepsLabel(ex);
              return (
                <li
                  key={ex.id}
                  className="flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-3 shadow-sm"
                >
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-gray-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img} alt="" className="h-full w-full object-cover" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-900">{ex.title}</p>
                    {meta && <p className="mt-0.5 text-xs text-gray-500">{meta}</p>}
                  </div>
                </li>
              );
            })
          )}
        </ul>
      )}

      {tab === "details" && (
        <div className="prose prose-gray max-w-none text-gray-600">
          {description?.trim() ? (
            <p className="whitespace-pre-wrap leading-relaxed">{description.trim()}</p>
          ) : (
            <p className="text-sm text-gray-500">No description yet.</p>
          )}
        </div>
      )}
    </div>
  );
}
