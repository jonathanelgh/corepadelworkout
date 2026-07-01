"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Play, X } from "lucide-react";
import { resolveVideoPlayer } from "@/lib/media/resolve-video-player";
import { ExerciseVideoFrame } from "@/components/programs/exercise-video-frame";

const MODAL_Z = 10050;

export function ExerciseVideoButton({ videoUrl, label }: { videoUrl: string; label: string }) {
  const trimmed = videoUrl?.trim();
  const player = useMemo(
    () => (trimmed ? resolveVideoPlayer(trimmed, { embedAutoplay: true }) : null),
    [trimmed]
  );
  const [open, setOpen] = useState(false);

  const onKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") setOpen(false);
  }, []);

  useEffect(() => {
    if (!open) return;
    document.addEventListener("keydown", onKeyDown);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prev;
    };
  }, [open, onKeyDown]);

  if (!player) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-3 inline-flex items-center gap-2 rounded-full bg-black px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-gray-800"
      >
        <Play className="h-4 w-4 fill-current" />
        Watch demo
      </button>
      {open &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed inset-0 flex items-center justify-center bg-black/80 p-4"
            style={{ zIndex: MODAL_Z }}
            role="dialog"
            aria-modal="true"
            aria-label={`Video: ${label}`}
            onClick={() => setOpen(false)}
          >
            <div
              className="relative w-full max-w-4xl overflow-hidden rounded-xl bg-black shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="absolute top-3 right-3 z-10 rounded-full bg-white/10 p-2 text-white backdrop-blur hover:bg-white/20"
                aria-label="Close video"
              >
                <X className="h-5 w-5" />
              </button>
              <ExerciseVideoFrame rounded={false}>
                {player.mode === "iframe" ? (
                  <iframe
                    src={player.src}
                    title={player.title}
                    className="absolute top-1/2 left-1/2 h-full w-[177.78%] max-w-none -translate-x-1/2 -translate-y-1/2"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                ) : (
                  <video
                    src={player.src}
                    className="absolute inset-0 h-full w-full object-cover"
                    controls
                    playsInline
                    autoPlay
                  />
                )}
              </ExerciseVideoFrame>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
