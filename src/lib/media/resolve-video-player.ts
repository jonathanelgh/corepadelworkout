export type VideoPlayerKind =
  | { mode: "video"; src: string }
  | { mode: "iframe"; src: string; title: string };

export type ResolveVideoOptions = { embedAutoplay?: boolean };

export function resolveVideoPlayer(
  url: string,
  options: ResolveVideoOptions = {}
): VideoPlayerKind | null {
  const ap = options.embedAutoplay ? "1" : "0";
  const raw = url.trim();
  if (!raw) return null;

  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return { mode: "video", src: raw };
  }

  const host = parsed.hostname.replace(/^www\./, "");

  if (host === "youtube.com" || host === "m.youtube.com") {
    const v = parsed.searchParams.get("v");
    if (v && /^[\w-]{11}$/.test(v)) {
      return {
        mode: "iframe",
        src: `https://www.youtube.com/embed/${encodeURIComponent(v)}?autoplay=${ap}&rel=0`,
        title: "YouTube video",
      };
    }
    const pathParts = parsed.pathname.split("/").filter(Boolean);
    if (pathParts[0] === "embed" && pathParts[1] && /^[\w-]{11}$/.test(pathParts[1])) {
      return {
        mode: "iframe",
        src: `https://www.youtube.com/embed/${encodeURIComponent(pathParts[1])}?autoplay=${ap}&rel=0`,
        title: "YouTube video",
      };
    }
  }

  if (host === "youtu.be") {
    const id = parsed.pathname.replace(/^\//, "").split("/")[0];
    if (id && /^[\w-]{11}$/.test(id)) {
      return {
        mode: "iframe",
        src: `https://www.youtube.com/embed/${encodeURIComponent(id)}?autoplay=${ap}&rel=0`,
        title: "YouTube video",
      };
    }
  }

  if (host === "vimeo.com" || host === "player.vimeo.com") {
    const parts = parsed.pathname.split("/").filter(Boolean);
    const id = parts[parts.length - 1];
    if (id && /^\d+$/.test(id)) {
      return {
        mode: "iframe",
        src: `https://player.vimeo.com/video/${encodeURIComponent(id)}?autoplay=${ap}`,
        title: "Vimeo video",
      };
    }
  }

  return { mode: "video", src: raw };
}
