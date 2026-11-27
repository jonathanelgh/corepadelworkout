"use client";

import { useState } from "react";

export function CopyLink({ link }: { link: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <div className="text-xs uppercase tracking-wide text-zinc-500">Your link</div>
        <div className="mt-1 truncate text-sm font-medium">{link}</div>
      </div>
      <button
        type="button"
        onClick={copy}
        className="shrink-0 rounded-full bg-zinc-950 px-4 py-2 text-sm font-medium text-white"
      >
        {copied ? "Copied" : "Copy link"}
      </button>
    </div>
  );
}
