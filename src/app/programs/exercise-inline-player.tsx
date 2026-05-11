"use client";

import { VideoUrlPreview } from "@/components/media/video-url-preview";

export function ExerciseInlinePlayer({ videoUrl, title }: { videoUrl: string; title: string }) {
  const trimmed = videoUrl.trim();
  if (!trimmed) {
    return (
      <div className="flex aspect-video w-full items-center justify-center rounded-2xl bg-gray-100 text-sm text-gray-500">
        No video for this exercise
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl bg-black shadow-lg ring-1 ring-black/5">
      <div className="aspect-video w-full">
        <VideoUrlPreview url={trimmed} label={title} />
      </div>
    </div>
  );
}
