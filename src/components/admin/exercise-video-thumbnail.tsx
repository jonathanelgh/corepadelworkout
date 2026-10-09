"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Play, Video, X } from "lucide-react";
import { resolveExerciseThumbnailUrl } from "@/lib/media/exercise-thumbnail-url";
import { resolveVideoPlayer } from "@/lib/media/resolve-video-player";

const MODAL_Z = 10050;

type Props = {
  title: string;
  imageUrl?: string | null;
  videoUrl?: string | null;
  /** Smaller preview for dense tables (default is card/list layout). */
  compact?: boolean;
  className?: string;
};

export function ExerciseVideoThumbnail({
  title,
  imageUrl,
  videoUrl,
  compact = false,
  className = "",
}: Props) {
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
  const sizeClass = compact ? "w-14" : "w-28";
  const playButtonClass = compact ? "h-6 w-6" : "h-9 w-9";
  const playIconClass = compact ? "h-3 w-3" : "h-4 w-4";

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
          <span
            className={`flex items-center justify-center rounded-full bg-black/70 text-white shadow-lg ${playButtonClass}`}
          >
            <Play className={`fill-current ${playIconClass}`} aria-hidden />
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
          className={`group relative aspect-square shrink-0 overflow-hidden rounded-lg border border-gray-200 shadow-sm transition hover:border-gray-300 hover:shadow ${sizeClass} ${className}`}
          aria-label={`Play video: ${title}`}
        >
          {preview}
        </button>
      ) : (
        <div
          className={`relative aspect-square shrink-0 overflow-hidden rounded-lg border border-gray-200 bg-gray-50 ${sizeClass} ${className}`}
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
              className="relative flex max-h-[min(90vh,920px)] max-w-[min(100%,56rem)] items-center justify-center overflow-hidden rounded-xl bg-black shadow-2xl"
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
              {player!.mode === "iframe" ? (
                <div className="relative aspect-video w-[min(100vw-2rem,56rem)] max-h-[min(90vh,920px)]">
                  <iframe
                    src={player!.src}
                    title={player!.title}
                    className="absolute inset-0 h-full w-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                </div>
              ) : (
                <video
                  src={player!.src}
                  className="max-h-[min(90vh,920px)] w-auto max-w-full object-contain"
                  controls
                  playsInline
                  autoPlay
                />
              )}
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
