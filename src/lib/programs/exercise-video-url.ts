import { resolveVideoPlayer } from "@/lib/media/resolve-video-player";

/** Resolves exercise video URLs (direct, YouTube, Drive, etc.) for the workout player. */
export function resolveExerciseVideoSource(url: string, autoplay = false) {
  return resolveVideoPlayer(url.trim(), { embedAutoplay: autoplay });
}
