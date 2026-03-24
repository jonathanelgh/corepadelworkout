"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Play, X } from "lucide-react";

type Props = {
  coverImageUrl: string;
  title: string;
  promoVideoUrl: string | null | undefined;
  className?: string;
};

/** z-index above sticky headers (z-50) and any page columns */
const MODAL_Z = 10050;

type PlayerKind =
  | { mode: "video"; src: string }
  | { mode: "iframe"; src: string; title: string };

function resolvePlayer(url: string): PlayerKind | null {
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
        src: `https://www.youtube.com/embed/${encodeURIComponent(v)}?autoplay=1&rel=0`,
        title: "YouTube video",
      };
    }
    const pathParts = parsed.pathname.split("/").filter(Boolean);
    if (pathParts[0] === "embed" && pathParts[1] && /^[\w-]{11}$/.test(pathParts[1])) {
      return {
        mode: "iframe",
        src: `https://www.youtube.com/embed/${encodeURIComponent(pathParts[1])}?autoplay=1&rel=0`,
        title: "YouTube video",
      };
    }
  }

  if (host === "youtu.be") {
    const id = parsed.pathname.replace(/^\//, "").split("/")[0];
    if (id && /^[\w-]{11}$/.test(id)) {
      return {
        mode: "iframe",
        src: `https://www.youtube.com/embed/${encodeURIComponent(id)}?autoplay=1&rel=0`,
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
        src: `https://player.vimeo.com/video/${encodeURIComponent(id)}?autoplay=1`,
        title: "Vimeo video",
      };
    }
  }

  return { mode: "video", src: raw };
}

export function ProgramHeroPlayer({ coverImageUrl, title, promoVideoUrl, className = "" }: Props) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const player = useMemo(
    () => resolvePlayer(promoVideoUrl?.trim() ?? ""),
    [promoVideoUrl]
  );

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, close]);

  const modal =
    open &&
    player &&
    mounted &&
    createPortal(
      <div
        className="fixed inset-0 flex items-center justify-center bg-black/90 p-4"
        style={{ zIndex: MODAL_Z }}
        role="dialog"
        aria-modal="true"
        aria-label="Program video"
      >
        <button
          type="button"
          onClick={close}
          className="absolute right-4 top-4 z-10 rounded-full bg-white/10 p-2 text-white backdrop-blur-sm transition-colors hover:bg-white/20"
          aria-label="Close video"
        >
          <X className="h-6 w-6" />
        </button>

        {player.mode === "iframe" ? (
          <iframe
            src={player.src}
            title={player.title}
            className="aspect-video h-auto max-h-[min(85vh,100%)] w-full max-w-5xl rounded-lg shadow-2xl"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        ) : (
          <video
            src={player.src}
            controls
            autoPlay
            playsInline
            preload="auto"
            className="max-h-[min(85vh,100%)] w-full max-w-5xl rounded-lg bg-black shadow-2xl"
          />
        )}
      </div>,
      document.body
    );

  return (
    <>
      <div className={`relative h-full w-full min-h-0 ${className}`}>
        <img src={coverImageUrl} alt={title} className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/20 md:bg-black/40" />

        {player && (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="absolute inset-0 z-[15] flex cursor-pointer items-center justify-center border-0 bg-transparent p-0 outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black/30"
            aria-label="Play program video"
          >
            <span className="flex h-20 w-20 items-center justify-center rounded-full bg-black/45 text-white shadow-lg backdrop-blur-md transition-transform hover:scale-105 md:h-24 md:w-24">
              <Play className="ml-1 h-10 w-10 fill-white text-white md:h-12 md:w-12" aria-hidden />
            </span>
          </button>
        )}
      </div>

      {modal}
    </>
  );
}
