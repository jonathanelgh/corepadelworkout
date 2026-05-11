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
    const pathParts = parsed.pathname.split("/").filter(Boolean);
    if (pathParts[0] === "shorts" && pathParts[1] && /^[\w-]{11}$/.test(pathParts[1])) {
      return {
        mode: "iframe",
        src: `https://www.youtube.com/embed/${encodeURIComponent(pathParts[1])}?autoplay=${ap}&rel=0`,
        title: "YouTube video",
      };
    }
    const v = parsed.searchParams.get("v");
    if (v && /^[\w-]{11}$/.test(v)) {
      return {
        mode: "iframe",
        src: `https://www.youtube.com/embed/${encodeURIComponent(v)}?autoplay=${ap}&rel=0`,
        title: "YouTube video",
      };
    }
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

  /** Google Drive file links (video must be shared viewable). */
  if (host === "drive.google.com" || host === "docs.google.com") {
    const fileMatch = parsed.pathname.match(/\/file\/d\/([^/]+)/);
    const idFromPath = fileMatch?.[1];
    const idFromQuery = parsed.searchParams.get("id");
    const id = idFromPath ?? idFromQuery;
    if (id && /^[\w-]+$/.test(id)) {
      return {
        mode: "iframe",
        src: `https://drive.google.com/file/d/${encodeURIComponent(id)}/preview`,
        title: "Google Drive video",
      };
    }
  }

  if (host === "loom.com") {
    const parts = parsed.pathname.split("/").filter(Boolean);
    const i = parts.indexOf("share");
    if (i >= 0 && parts[i + 1]) {
      return {
        mode: "iframe",
        src: `https://www.loom.com/embed/${encodeURIComponent(parts[i + 1])}?hide_owner=true&hide_share=true`,
        title: "Loom video",
      };
    }
  }

  if (host === "dailymotion.com") {
    const parts = parsed.pathname.split("/").filter(Boolean);
    const vi = parts.indexOf("video");
    if (vi >= 0 && parts[vi + 1]) {
      const vid = parts[vi + 1];
      return {
        mode: "iframe",
        src: `https://www.dailymotion.com/embed/video/${encodeURIComponent(vid)}?autoplay=${ap}`,
        title: "Dailymotion video",
      };
    }
  }

  return { mode: "video", src: raw };
}
