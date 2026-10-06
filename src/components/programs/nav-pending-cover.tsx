"use client";

import { useLinkStatus } from "next/link";
import { Loader2 } from "lucide-react";

/** Shows a spinner overlay while a parent Next.js Link is navigating. */
export function NavPendingCover({ label = "Loading…" }: { label?: string }) {
  const { pending } = useLinkStatus();
  if (!pending) return null;
  return (
    <span
      className="absolute inset-0 z-10 flex items-center justify-center gap-2 rounded-[inherit] bg-white/80 text-sm font-semibold text-zinc-800 backdrop-blur-[2px]"
      aria-live="polite"
    >
      <Loader2 className="h-5 w-5 animate-spin" />
      {label}
    </span>
  );
}
