"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight, PlayCircle } from "lucide-react";
import { ExerciseVideoButton } from "./exercise-video-button";

export type TakeExercise = {
  id: string;
  title: string;
  description: string | null;
  how_to: string | null;
  video_url: string | null;
  image_url: string | null;
};

export type TakeSession = {
  id: string;
  sessionLabel: string;
  name: string;
  description: string | null;
  durationMeta: string;
  exercises: TakeExercise[];
};

export type TakeTrackBlock = {
  key: string;
  locationName: string | null;
  sessions: TakeSession[];
};

function howToBlocks(text: string | null): string[] {
  if (!text?.trim()) return [];
  const byPara = text.split(/\n\n+/).map((p) => p.trim()).filter(Boolean);
  if (byPara.length > 1) return byPara;
  return text.split(/\n/).map((p) => p.trim()).filter(Boolean);
}

type Props = {
  programSlug: string;
  tracks: TakeTrackBlock[];
};

export function TakeSessionsList({ programSlug, tracks }: Props) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const toggle = useCallback((sessionId: string) => {
    setExpanded((prev) => ({ ...prev, [sessionId]: !prev[sessionId] }));
  }, []);

  if (tracks.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/50 px-5 py-8 text-center text-sm text-gray-500">
        This program doesn&apos;t have sessions yet. Check back later.
      </p>
    );
  }

  return (
    <div className="space-y-10">
      {tracks.map((track) => (
        <div key={track.key} className="space-y-5">
          {tracks.length > 1 && track.locationName && (
            <p className="text-xs font-bold tracking-wider text-gray-400 uppercase">{track.locationName}</p>
          )}
          {track.sessions.map((session) => {
            const isOpen = Boolean(expanded[session.id]);
            const n = session.exercises.length;
            return (
              <div
                key={session.id}
                className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm"
              >
                <div className="flex flex-col gap-4 border-b border-gray-100 p-5 sm:flex-row sm:items-start sm:justify-between">
                  <button
                    type="button"
                    onClick={() => toggle(session.id)}
                    aria-expanded={isOpen}
                    className="flex min-w-0 flex-1 items-start gap-3 rounded-xl text-left transition-colors hover:bg-gray-50/80 sm:-m-2 sm:p-2"
                  >
                    <span className="mt-2 shrink-0 text-gray-500" aria-hidden>
                      {isOpen ? (
                        <ChevronDown className="h-5 w-5" />
                      ) : (
                        <ChevronRight className="h-5 w-5" />
                      )}
                    </span>
                    <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#ccff00]/30 text-gray-900">
                      <PlayCircle className="h-5 w-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="mb-1 block text-xs font-bold tracking-wider text-gray-400 uppercase">
                        {session.sessionLabel}
                      </span>
                      <span className="block text-lg font-medium text-gray-900">{session.name}</span>
                      {session.description && (
                        <span className="mt-2 block text-sm leading-relaxed text-gray-600">
                          {session.description}
                        </span>
                      )}
                      {!isOpen && n > 0 && (
                        <span className="mt-2 inline-block text-xs font-medium text-gray-500">
                          {n} exercise{n === 1 ? "" : "s"} · tap to expand
                        </span>
                      )}
                    </span>
                  </button>
                  <div className="flex shrink-0 flex-col items-stretch gap-2 sm:items-end sm:pt-1">
                    <span className="text-sm tabular-nums text-gray-500 sm:text-right">
                      {session.durationMeta}
                    </span>
                    <Link
                      href={`/programs/${programSlug}/take/session/${session.id}`}
                      className="inline-flex items-center justify-center rounded-full bg-[#ccff00] px-5 py-2.5 text-center text-sm font-semibold text-black transition-colors hover:bg-[#b3e600]"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Start workout
                    </Link>
                  </div>
                </div>

                {isOpen && (
                  <ul className="divide-y divide-gray-100">
                    {session.exercises.length === 0 ? (
                      <li className="px-5 py-6 text-sm text-gray-500">
                        No exercises linked to this session yet.
                      </li>
                    ) : (
                      session.exercises.map((ex, ei) => {
                        const img = ex.image_url?.trim();
                        const steps = howToBlocks(ex.how_to);
                        return (
                          <li key={ex.id} className="p-5 md:p-6">
                            <div className="flex flex-col gap-4 md:flex-row md:gap-6">
                              {img && (
                                <div className="relative h-40 w-full shrink-0 overflow-hidden rounded-xl bg-gray-100 md:h-32 md:w-44">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img src={img} alt="" className="h-full w-full object-cover" />
                                </div>
                              )}
                              <div className="min-w-0 flex-1">
                                <div className="text-xs font-bold tracking-wider text-gray-400 uppercase">
                                  Exercise {ei + 1}
                                </div>
                                <h3 className="mt-1 text-xl font-medium text-gray-900">{ex.title}</h3>
                                {ex.description?.trim() && (
                                  <p className="mt-2 text-sm leading-relaxed text-gray-600">
                                    {ex.description.trim()}
                                  </p>
                                )}
                                {steps.length > 0 && (
                                  <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-gray-700">
                                    {steps.map((step, i) => (
                                      <li key={i} className="pl-1">
                                        {step}
                                      </li>
                                    ))}
                                  </ol>
                                )}
                                {ex.video_url?.trim() && (
                                  <ExerciseVideoButton
                                    videoUrl={ex.video_url.trim()}
                                    label={ex.title}
                                  />
                                )}
                              </div>
                            </div>
                          </li>
                        );
                      })
                    )}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
