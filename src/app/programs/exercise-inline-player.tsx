"use client";

import { useMemo } from "react";
import { resolveVideoPlayer } from "@/lib/media/resolve-video-player";

export function ExerciseInlinePlayer({ videoUrl, title }: { videoUrl: string; title: string }) {
  const player = useMemo(
    () => resolveVideoPlayer(videoUrl.trim(), { embedAutoplay: false }),
    [videoUrl]
  );

  if (!player) {
    return (
      <div className="flex aspect-video w-full items-center justify-center rounded-2xl bg-gray-100 text-sm text-gray-500">
        No video for this exercise
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl bg-black shadow-lg ring-1 ring-black/5">
      <div className="aspect-video w-full">
        {player.mode === "iframe" ? (
          <iframe
            src={player.src}
            title={title}
            className="h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        ) : (
          <video src={player.src} className="h-full w-full" controls playsInline />
        )}
      </div>
    </div>
  );
}
