"use client";

import { VideoUrlPreview } from "@/components/media/video-url-preview";
import { ExerciseVideoFrame } from "@/components/programs/exercise-video-frame";

export function ExerciseInlinePlayer({ videoUrl, title }: { videoUrl: string; title: string }) {
  const trimmed = videoUrl.trim();
  if (!trimmed) {
    return (
      <ExerciseVideoFrame bleed className="flex items-center justify-center bg-gray-100 text-sm text-gray-500">
        No video for this exercise
      </ExerciseVideoFrame>
    );
  }

  return (
    <ExerciseVideoFrame bleed className="shadow-lg ring-1 ring-black/5">
      <VideoUrlPreview url={trimmed} label={title} fit="cover" />
    </ExerciseVideoFrame>
  );
}
