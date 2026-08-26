"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, ClipboardCopy, Check } from "lucide-react";
import type { AiGenerationDebugLog } from "@/lib/programs/ai-generation-debug";

export function AiGenerationDebugPanel({ log }: { log: AiGenerationDebugLog }) {
  const [open, setOpen] = useState(log.summary.failCount > 0 || log.summary.fixedCount > 0);
  const [copied, setCopied] = useState(false);

  async function copyJson() {
    try {
      await navigator.clipboard.writeText(JSON.stringify(log, null, 2));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  }

  return (
    <div className="mt-4 overflow-hidden rounded-xl border border-dashed border-violet-300 bg-violet-50/40">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm font-medium text-violet-950"
      >
        {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        <span>Generation log</span>
        <span className="ml-auto flex flex-wrap items-center gap-1.5 text-[11px] font-normal text-violet-800">
          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-emerald-800">
            {log.summary.passCount} pass
          </span>
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-amber-900">
            {log.summary.fixedCount} fixed
          </span>
          <span className="rounded-full bg-red-100 px-2 py-0.5 text-red-800">
            {log.summary.failCount} fail
          </span>
        </span>
      </button>

      {open && (
        <div className="space-y-4 border-t border-violet-200/80 px-3 py-3">
          <div className="flex flex-wrap items-center gap-2 text-xs text-violet-900">
            <span className="rounded-md bg-white px-2 py-1 ring-1 ring-violet-200">
              Mode: {log.mode}
            </span>
            <span className="rounded-md bg-white px-2 py-1 ring-1 ring-violet-200">
              Level: {log.trainingLevel ?? "default beginner"}
            </span>
            {log.locationSlug && (
              <span className="rounded-md bg-white px-2 py-1 ring-1 ring-violet-200">
                Location: {log.locationSlug}
              </span>
            )}
            <span className="rounded-md bg-white px-2 py-1 ring-1 ring-violet-200">
              Exercises: {log.summary.rawExerciseCount} → {log.summary.finalExerciseCount}
            </span>
            <button
              type="button"
              onClick={() => void copyJson()}
              className="ml-auto inline-flex items-center gap-1 rounded-md bg-white px-2 py-1 text-xs font-medium text-violet-900 ring-1 ring-violet-200 hover:bg-violet-50"
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <ClipboardCopy className="h-3.5 w-3.5" />}
              {copied ? "Copied" : "Copy JSON"}
            </button>
          </div>

          {log.aiRationale && (
            <div className="rounded-lg border border-violet-200 bg-white px-3 py-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-violet-700">
                AI rationale
              </p>
              <p className="mt-1 text-sm leading-relaxed text-gray-800">{log.aiRationale}</p>
            </div>
          )}

          {log.enforcementChanges.length > 0 && (
            <div>
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-violet-700">
                App auto-fixes ({log.enforcementChanges.length})
              </p>
              <ul className="space-y-1 rounded-lg border border-amber-200 bg-amber-50/80 px-3 py-2 text-xs text-amber-950">
                {log.enforcementChanges.map((w, i) => (
                  <li key={`${i}-${w.slice(0, 24)}`}>• {w}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                AI raw (before fixes)
              </p>
              <ul className="mt-2 space-y-2 text-xs text-slate-700">
                {log.rawSessions.map((s) => (
                  <li key={`raw-${s.name}`}>
                    <span className="font-medium">{s.name}</span>
                    <br />
                    W{s.warmupCount} / M{s.mainCount} / C{s.cooldownCount} · core {s.coreCount} ·
                    footwork {s.footworkCount} · rot {s.hasRotation ? "yes" : "no"}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                After enforcement
              </p>
              <ul className="mt-2 space-y-2 text-xs text-slate-700">
                {log.finalSessions.map((s) => (
                  <li key={`final-${s.name}`}>
                    <span className="font-medium">{s.name}</span>
                    <br />
                    W{s.warmupCount} / M{s.mainCount} / C{s.cooldownCount} · core {s.coreCount} ·
                    footwork {s.footworkCount} · rot {s.hasRotation ? "yes" : "no"}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
