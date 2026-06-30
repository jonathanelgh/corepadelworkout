function extractYoutubeVideoId(url: string): string | null {
  const raw = url.trim();
  if (!raw) return null;

  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return null;
  }

  const host = parsed.hostname.replace(/^www\./, "");

  if (host === "youtube.com" || host === "m.youtube.com") {
    const pathParts = parsed.pathname.split("/").filter(Boolean);
    if (pathParts[0] === "shorts" && pathParts[1] && /^[\w-]{11}$/.test(pathParts[1])) {
      return pathParts[1];
    }
    const v = parsed.searchParams.get("v");
    if (v && /^[\w-]{11}$/.test(v)) return v;
    if (pathParts[0] === "embed" && pathParts[1] && /^[\w-]{11}$/.test(pathParts[1])) {
      return pathParts[1];
    }
  }

  if (host === "youtu.be") {
    const id = parsed.pathname.replace(/^\//, "").split("/")[0];
    if (id && /^[\w-]{11}$/.test(id)) return id;
  }

  return null;
}

/** Best thumbnail for an exercise: cover image, then YouTube poster, else null. */
export function resolveExerciseThumbnailUrl(
  imageUrl: string | null | undefined,
  videoUrl: string | null | undefined
): string | null {
  const image = imageUrl?.trim();
  if (image) return image;

  const video = videoUrl?.trim();
  if (!video) return null;

  const youtubeId = extractYoutubeVideoId(video);
  if (youtubeId) {
    return `https://img.youtube.com/vi/${encodeURIComponent(youtubeId)}/hqdefault.jpg`;
  }

  return null;
}
