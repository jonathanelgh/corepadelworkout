"use client";

import { useMemo } from "react";
import { resolveVideoPlayer } from "@/lib/media/resolve-video-player";
import { Video } from "lucide-react";

const IFRAME_ALLOW =
  "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen";

type VideoFit = "contain" | "cover";

type Props = {
  url: string;
  /** Used for iframe `title` (a11y). */
  label?: string;
  /** Shown when `url` is empty. */
  emptyClassName?: string;
  className?: string;
  /** How the video fills its frame. `cover` center-crops to fill (used for 1:1 exercise demos). */
  fit?: VideoFit;
};

/**
 * Renders a direct file URL with `<video>` or known third-party links (YouTube, Vimeo, Drive, Loom) with `<iframe>`.
 */
export function VideoUrlPreview({
  url,
  label = "Video preview",
  emptyClassName,
  className,
  fit = "contain",
}: Props) {
  const player = useMemo(
    () => resolveVideoPlayer(url.trim(), { embedAutoplay: false }),
    [url]
  );

  if (!player) {
    return (
      <div
        className={
          emptyClassName ?? "flex h-full w-full items-center justify-center bg-gray-50"
        }
      >
        <Video className="h-12 w-12 text-gray-300" aria-hidden />
      </div>
    );
  }

  return (
    <div className={`h-full w-full min-h-0 overflow-hidden bg-black ${className ?? ""}`}>
      {player.mode === "iframe" ? (
        fit === "cover" ? (
          <div className="relative h-full w-full overflow-hidden">
            <iframe
              src={player.src}
              title={label}
              className="absolute top-1/2 left-1/2 h-full w-[177.78%] max-w-none -translate-x-1/2 -translate-y-1/2 border-0"
              allow={IFRAME_ALLOW}
              allowFullScreen
            />
          </div>
        ) : (
          <iframe
            src={player.src}
            title={label}
            className="h-full min-h-40 w-full border-0"
            allow={IFRAME_ALLOW}
            allowFullScreen
          />
        )
      ) : (
        <video
          src={player.src}
          className={`h-full w-full ${fit === "cover" ? "object-cover" : "object-contain"}`}
          controls
          playsInline
          preload="metadata"
        />
      )}
    </div>
  );
}
