"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Loader2, UploadCloud, Video, X } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { STORAGE_BUCKETS } from "@/utils/supabase/storage";
import {
  getBulkImportBatchStatus,
  startBulkExerciseImport,
  type BulkImportUploadedFile,
} from "@/app/admin/exercises/bulk-import-actions";

type LocationOption = { id: string; name: string };

function isVideoFile(file: File): boolean {
  return file.type.startsWith("video/") || /\.(mp4|webm|mov|m4v)$/i.test(file.name);
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]+/g, "_").slice(0, 120) || "video.mp4";
}

type Phase = "form" | "uploading" | "processing" | "done" | "error";

export function BulkExerciseVideoImportModal({
  open,
  onClose,
  locations,
}: {
  open: boolean;
  onClose: () => void;
  locations: LocationOption[];
}) {
  const titleId = useId();
  const inputId = useId();
  const [mounted, setMounted] = useState(false);
  const [phase, setPhase] = useState<Phase>("form");
  const [locationId, setLocationId] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [statusLine, setStatusLine] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [batchId, setBatchId] = useState<string | null>(null);
  const [summary, setSummary] = useState<{ total: number; completed: number; failed: number } | null>(
    null
  );
  const [failedItems, setFailedItems] = useState<
    { originalFilename: string; errorMessage: string | null }[]
  >([]);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    setPhase("form");
    setFiles([]);
    setUploadProgress(0);
    setStatusLine("");
    setError(null);
    setBatchId(null);
    setSummary(null);
    setFailedItems([]);
    setLocationId(locations[0]?.id ?? "");
  }, [open, locations]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && phase !== "uploading" && phase !== "processing") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, phase]);

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const pollBatch = useCallback((id: string) => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      const res = await getBulkImportBatchStatus(id);
      if ("error" in res) return;
      setSummary({ total: res.total, completed: res.completed, failed: res.failed });
      setStatusLine(
        `Analyzing videos… ${res.completed + res.failed} / ${res.total} (${res.completed} created${res.failed ? `, ${res.failed} failed` : ""})`
      );
      if (["completed", "partial", "failed"].includes(res.status)) {
        if (pollRef.current) clearInterval(pollRef.current);
        pollRef.current = null;
        setFailedItems(
          res.items
            .filter((i) => i.status === "failed")
            .map((i) => ({ originalFilename: i.originalFilename, errorMessage: i.errorMessage }))
        );
        setPhase("done");
      }
    }, 4000);
  }, []);

  async function handleSubmit() {
    setError(null);
    if (!locationId) {
      setError("Choose a default location for these exercises.");
      return;
    }
    if (files.length === 0) {
      setError("Add at least one video file.");
      return;
    }

    setPhase("uploading");
    const supabase = createClient();
    const groupId = crypto.randomUUID();
    const uploaded: BulkImportUploadedFile[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setStatusLine(`Uploading ${i + 1} of ${files.length}: ${file.name}`);
        setUploadProgress(Math.round((i / files.length) * 100));
        const path = `bulk-imports/${groupId}/${i}-${sanitizeFilename(file.name)}`;
        const { error: upErr } = await supabase.storage.from(STORAGE_BUCKETS.exercises).upload(path, file, {
          upsert: false,
        });
        if (upErr) throw new Error(upErr.message);
        const { data } = supabase.storage.from(STORAGE_BUCKETS.exercises).getPublicUrl(path);
        uploaded.push({
          storagePath: path,
          videoUrl: data.publicUrl,
          originalFilename: file.name,
        });
      }
      setUploadProgress(100);

      setPhase("processing");
      setStatusLine("Starting AI analysis…");

      const result = await startBulkExerciseImport(locationId, uploaded);
      if ("error" in result) {
        throw new Error(result.error);
      }

      setBatchId(result.batchId);
      setStatusLine(
        `Processing ${result.total} video${result.total === 1 ? "" : "s"} in the background. You can close this window; we will email you when finished.`
      );
      pollBatch(result.batchId);
    } catch (e) {
      setPhase("error");
      setError(e instanceof Error ? e.message : "Upload failed.");
    }
  }

  function addFiles(list: FileList | File[]) {
    const next: File[] = [];
    for (const f of Array.from(list)) {
      if (isVideoFile(f)) next.push(f);
    }
    if (next.length === 0) return;
    setFiles((prev) => {
      const merged = [...prev, ...next];
      return merged.slice(0, 20);
    });
  }

  if (!open || !mounted) return null;

  const busy = phase === "uploading" || phase === "processing";

  return createPortal(
    <div className="fixed inset-0 z-100 flex items-end justify-center p-4 sm:items-center" role="presentation">
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        aria-label="Close"
        onClick={() => !busy && onClose()}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 flex max-h-[min(90vh,720px)] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-gray-100 px-5 py-4">
          <h2 id={titleId} className="text-base font-semibold text-gray-900">
            Bulk upload exercise videos
          </h2>
          <button
            type="button"
            disabled={busy}
            onClick={onClose}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 disabled:opacity-40"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-auto p-5 space-y-5">
          {phase === "done" ? (
            <div className="space-y-3">
              <p className="text-sm text-gray-800">
                {summary
                  ? `Finished: ${summary.completed} exercise${summary.completed === 1 ? "" : "s"} created${
                      summary.failed > 0 ? `, ${summary.failed} failed` : ""
                    }.`
                  : "Processing finished."}
              </p>
              <p className="text-sm text-gray-600">
                A confirmation email was sent to your account. Review and edit exercises in the library.
              </p>
              {failedItems.length > 0 && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                  <p className="text-sm font-medium text-red-900">What went wrong</p>
                  <ul className="mt-2 space-y-2 text-sm text-red-800">
                    {failedItems.map((item) => (
                      <li key={item.originalFilename}>
                        <span className="font-medium">{item.originalFilename}</span>
                        {item.errorMessage ? (
                          <span className="mt-0.5 block text-red-700">{item.errorMessage}</span>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <>
              <p className="text-sm text-gray-600">
                Upload one or more demo videos. Each video is stored, analyzed with Gemini, and turned into a full
                exercise (title, description, steps, gear, and taxonomy tags). Processing runs in the background; we
                email you when the batch is done.
              </p>

              <div>
                <label htmlFor="bulk-import-location" className="mb-1.5 block text-sm font-medium text-gray-700">
                  Default location
                </label>
                <select
                  id="bulk-import-location"
                  value={locationId}
                  disabled={busy}
                  onChange={(e) => setLocationId(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black disabled:opacity-60"
                >
                  <option value="">Select location…</option>
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name}
                    </option>
                  ))}
                </select>
              </div>

              <input
                id={inputId}
                type="file"
                accept="video/*,.mp4,.webm,.mov"
                multiple
                className="sr-only"
                disabled={busy}
                onChange={(e) => {
                  if (e.target.files?.length) addFiles(e.target.files);
                  e.target.value = "";
                }}
              />
              <label
                htmlFor={inputId}
                className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center transition-colors ${
                  busy ? "pointer-events-none opacity-60" : "border-gray-300 hover:bg-gray-50"
                }`}
              >
                <UploadCloud className="mb-2 h-8 w-8 text-gray-400" />
                <span className="text-sm font-medium text-gray-900">Click or drop videos</span>
                <span className="mt-1 text-xs text-gray-500">MP4, WebM, MOV — up to 20 files</span>
              </label>

              {files.length > 0 && (
                <ul className="max-h-40 space-y-2 overflow-auto rounded-lg border border-gray-200 p-2">
                  {files.map((f, i) => (
                    <li
                      key={`${f.name}-${i}`}
                      className="flex items-center gap-2 text-sm text-gray-800"
                    >
                      <Video className="h-4 w-4 shrink-0 text-gray-400" />
                      <span className="min-w-0 flex-1 truncate">{f.name}</span>
                      {!busy && (
                        <button
                          type="button"
                          className="text-xs text-red-600 hover:underline"
                          onClick={() => setFiles((prev) => prev.filter((_, j) => j !== i))}
                        >
                          Remove
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              )}

              {(phase === "uploading" || phase === "processing") && (
                <div className="flex items-center gap-3 rounded-lg bg-gray-50 px-4 py-3 text-sm text-gray-700">
                  <Loader2 className="h-5 w-5 shrink-0 animate-spin" />
                  <div className="min-w-0 flex-1">
                    <p>{statusLine}</p>
                    {phase === "uploading" && (
                      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
                        <div
                          className="h-full bg-black transition-all"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {error && (
                <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>
              )}
            </>
          )}
        </div>

        <div className="shrink-0 border-t border-gray-100 px-5 py-4 flex justify-end gap-2">
          {phase === "done" ? (
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
            >
              Done
            </button>
          ) : (
            <>
              <button
                type="button"
                disabled={busy}
                onClick={onClose}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50 disabled:opacity-40"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={busy || files.length === 0}
                onClick={() => void handleSubmit()}
                className="inline-flex items-center gap-2 rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {busy ? "Working…" : `Upload & analyze (${files.length})`}
              </button>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
