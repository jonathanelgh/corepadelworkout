"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Play, Video, X } from "lucide-react";
import { resolveExerciseThumbnailUrl } from "@/lib/media/exercise-thumbnail-url";
import { resolveVideoPlayer } from "@/lib/media/resolve-video-player";
import { ExerciseVideoFrame } from "@/components/programs/exercise-video-frame";

const MODAL_Z = 10050;

type Props = {
  title: string;
  imageUrl?: string | null;
  videoUrl?: string | null;
  className?: string;
};

export function ExerciseVideoThumbnail({ title, imageUrl, videoUrl, className = "" }: Props) {
  const trimmedVideo = videoUrl?.trim() ?? "";
  const thumbnail = useMemo(
    () => resolveExerciseThumbnailUrl(imageUrl, trimmedVideo || null),
    [imageUrl, trimmedVideo]
  );
  const player = useMemo(
    () => (trimmedVideo ? resolveVideoPlayer(trimmedVideo, { embedAutoplay: true }) : null),
    [trimmedVideo]
  );
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

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

  if (!thumbnail && !player) return null;

  const canPlay = Boolean(player);

  const preview = (
    <div className="relative h-full w-full bg-gray-100">
      {thumbnail ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={thumbnail} alt="" className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-gray-200 text-gray-500">
          <Video className="h-6 w-6" aria-hidden />
        </div>
      )}
      {canPlay ? (
        <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/25 transition group-hover:bg-black/35">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-black/70 text-white shadow-lg">
            <Play className="h-4 w-4 fill-current" aria-hidden />
          </span>
        </span>
      ) : null}
    </div>
  );

  return (
    <>
      {canPlay ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={`group relative aspect-square w-28 shrink-0 overflow-hidden rounded-lg border border-gray-200 shadow-sm transition hover:border-gray-300 hover:shadow ${className}`}
          aria-label={`Play video: ${title}`}
        >
          {preview}
        </button>
      ) : (
        <div
          className={`relative aspect-square w-28 shrink-0 overflow-hidden rounded-lg border border-gray-200 bg-gray-50 ${className}`}
          aria-hidden
        >
          {preview}
        </div>
      )}

      {canPlay &&
        open &&
        mounted &&
        createPortal(
          <div
            className="fixed inset-0 flex items-center justify-center bg-black/80 p-4"
            style={{ zIndex: MODAL_Z }}
            role="dialog"
            aria-modal="true"
            aria-label={`Video: ${title}`}
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
                {player!.mode === "iframe" ? (
                  <iframe
                    src={player!.src}
                    title={player!.title}
                    className="absolute top-1/2 left-1/2 h-full w-[177.78%] max-w-none -translate-x-1/2 -translate-y-1/2"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                ) : (
                  <video
                    src={player!.src}
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
