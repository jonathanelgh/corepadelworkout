"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Loader2, X } from "lucide-react";
import { STORAGE_BUCKETS, type StorageBucketId } from "@/utils/supabase/storage";

const UPLOAD_BUCKETS: { id: StorageBucketId; label: string }[] = [
  { id: STORAGE_BUCKETS.exercises, label: "Exercises" },
  { id: STORAGE_BUCKETS.equipment, label: "Equipment" },
  { id: STORAGE_BUCKETS.programs, label: "Programs" },
];

type Props = {
  open: boolean;
  onClose: () => void;
  sourceFile: File | null;
  initialTargetBucket: StorageBucketId;
  onCompressedUpload: (file: File, bucket: StorageBucketId) => Promise<void>;
};

/** Same-origin core via `/api/ffmpeg-core` — avoids CDN/CORP issues in dev and locked-down browsers. */
function ffmpegCoreBaseUrl(): string {
  if (typeof window === "undefined") return "";
  return `${window.location.origin}/api/ffmpeg-core`;
}

const EXEC_TIMEOUT_MS = 600_000;

function isVideoFile(f: File): boolean {
  if (f.type.startsWith("video/")) return true;
  return /\.(mp4|webm|mov|m4v|mkv|avi)$/i.test(f.name);
}

function formatUnknownError(e: unknown): string {
  if (e instanceof Error) return e.message;
  if (typeof e === "string") return e;
  if (e && typeof e === "object") {
    try {
      return JSON.stringify(e);
    } catch {
      return String(e);
    }
  }
  return String(e);
}

export function VideoCompressDialog({
  open,
  onClose,
  sourceFile,
  initialTargetBucket,
  onCompressedUpload,
}: Props) {
  const titleId = useId();
  const [targetBucket, setTargetBucket] = useState<StorageBucketId>(initialTargetBucket);
  const [crf, setCrf] = useState(26);
  const [maxWidth, setMaxWidth] = useState(1280);
  const [phase, setPhase] = useState<"idle" | "loading" | "running" | "done" | "error">("idle");
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [logLine, setLogLine] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [errorLogs, setErrorLogs] = useState<string>("");
  const [outBlob, setOutBlob] = useState<Blob | null>(null);
  const [outName, setOutName] = useState("compressed.mp4");
  const ffmpegRef = useRef<InstanceType<Awaited<typeof import("@ffmpeg/ffmpeg")>["FFmpeg"]> | null>(null);
  const loadedRef = useRef(false);
  const ffmpegLogLinesRef = useRef<string[]>([]);

  const reset = useCallback(() => {
    setPhase("idle");
    setIsUploading(false);
    setProgress(0);
    setLogLine(null);
    setError(null);
    setErrorLogs("");
    setOutBlob(null);
    setOutName(sourceFile ? sourceFile.name.replace(/\.[^.]+$/, "") + "-compressed.mp4" : "compressed.mp4");
  }, [sourceFile]);

  useEffect(() => {
    if (!open) return;
    reset();
    setTargetBucket(initialTargetBucket);
  }, [open, sourceFile, reset, initialTargetBucket]);

  useEffect(() => {
    if (!open) {
      const f = ffmpegRef.current;
      if (f) {
        try {
          f.terminate();
        } catch {
          /* ignore */
        }
      }
      ffmpegRef.current = null;
      loadedRef.current = false;
    }
  }, [open]);

  async function runCompress() {
    if (!sourceFile || !isVideoFile(sourceFile)) {
      setError("Choose a video file.");
      setPhase("error");
      return;
    }

    setError(null);
    setOutBlob(null);
    setPhase("loading");
    setProgress(0);
    ffmpegLogLinesRef.current = [];
    setErrorLogs("");

    try {
      const [{ FFmpeg }, { fetchFile }] = await Promise.all([
        import("@ffmpeg/ffmpeg"),
        import("@ffmpeg/util"),
      ]);

      if (!ffmpegRef.current) {
        ffmpegRef.current = new FFmpeg();
        const ff = ffmpegRef.current;
        ff.on("log", ({ message }) => {
          ffmpegLogLinesRef.current.push(message);
          if (ffmpegLogLinesRef.current.length > 40) {
            ffmpegLogLinesRef.current = ffmpegLogLinesRef.current.slice(-40);
          }
          setLogLine(message.length > 120 ? message.slice(0, 120) + "…" : message);
        });
        ff.on("progress", ({ progress: p }) => {
          setProgress(Math.min(1, Math.max(0, p)));
        });
      }
      const ffmpeg = ffmpegRef.current;

      if (!loadedRef.current) {
        const base = ffmpegCoreBaseUrl();
        try {
          await ffmpeg.load({
            coreURL: `${base}/ffmpeg-core.js`,
            wasmURL: `${base}/ffmpeg-core.wasm`,
          });
        } catch {
          const { toBlobURL } = await import("@ffmpeg/util");
          const cdnBase = "https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/esm";
          await ffmpeg.load({
            coreURL: await toBlobURL(`${cdnBase}/ffmpeg-core.js`, "text/javascript"),
            wasmURL: await toBlobURL(`${cdnBase}/ffmpeg-core.wasm`, "application/wasm"),
          });
        }
        loadedRef.current = true;
      }

      const inputName = "input" + (sourceFile.name.match(/\.[^.]+$/)?.[0] || ".mp4");
      await ffmpeg.writeFile(inputName, await fetchFile(sourceFile));

      setPhase("running");

      const vfScaleFilter =
        maxWidth > 0 ? `scale=w=min(${maxWidth}\\,iw):h=-2` : "";

      function h264Args(audio: "aac" | "none", withScale: boolean): string[] {
        const map =
          audio === "aac"
            ? (["-map", "0:v:0", "-map", "0:a:0?"] as const)
            : (["-map", "0:v:0"] as const);
        const a =
          audio === "aac"
            ? (["-c:a", "aac", "-b:a", "128k"] as const)
            : (["-an"] as const);
        const vf =
          withScale && vfScaleFilter ? (["-vf", vfScaleFilter] as const) : [];
        return [
          "-i",
          inputName,
          ...map,
          "-threads",
          "1",
          "-c:v",
          "libx264",
          "-pix_fmt",
          "yuv420p",
          "-crf",
          String(crf),
          "-preset",
          "ultrafast",
          ...vf,
          ...a,
          "-movflags",
          "+faststart",
          "out.mp4",
        ];
      }

      function mpeg4Args(withScale: boolean): string[] {
        const vf =
          withScale && vfScaleFilter ? (["-vf", vfScaleFilter] as const) : [];
        return [
          "-i",
          inputName,
          "-map",
          "0:v:0",
          "-threads",
          "1",
          "-c:v",
          "mpeg4",
          "-q:v",
          "6",
          ...vf,
          "-an",
          "-movflags",
          "+faststart",
          "out.mp4",
        ];
      }

      /* Simplest first: no resize (filters can fail on some inputs), video-only before AAC. */
      const attempts: string[][] = [
        h264Args("none", false),
        h264Args("aac", false),
        ...(maxWidth > 0 ? [h264Args("none", true), h264Args("aac", true)] : []),
        mpeg4Args(false),
        ...(maxWidth > 0 ? [mpeg4Args(true)] : []),
      ];

      let lastCode = 1;
      for (const args of attempts) {
        await ffmpeg.deleteFile("out.mp4").catch(() => {});
        const code = await ffmpeg.exec(args, EXEC_TIMEOUT_MS);
        lastCode = code;
        if (code === 0) {
          break;
        }
      }

      if (lastCode !== 0) {
        const tail = ffmpegLogLinesRef.current.slice(-8).join(" · ");
        throw new Error(
          tail
            ? `FFmpeg exited with code ${lastCode}. Last output: ${tail}`
            : `FFmpeg exited with code ${lastCode}.`
        );
      }

      const raw = await ffmpeg.readFile("out.mp4");
      const src =
        raw instanceof Uint8Array
          ? raw
          : new Uint8Array(raw as unknown as ArrayBuffer);
      const copy = new Uint8Array(src.byteLength);
      copy.set(src);
      if (copy.byteLength < 1024) {
        throw new Error("Compressed file is too small; FFmpeg likely failed to produce output.");
      }
      const blob = new Blob([copy], { type: "video/mp4" });
      setOutBlob(blob);
      setPhase("done");
      await ffmpeg.deleteFile(inputName).catch(() => {});
      await ffmpeg.deleteFile("out.mp4").catch(() => {});
    } catch (e) {
      setError(formatUnknownError(e) || "Compression failed.");
      setErrorLogs(ffmpegLogLinesRef.current.join("\n"));
      setPhase("error");
    }
  }

  async function uploadResult() {
    if (!outBlob) return;
    setIsUploading(true);
    setError(null);
    try {
      const file = new File([outBlob], outName.replace(/[^a-zA-Z0-9._-]/g, "_") || "compressed.mp4", {
        type: "video/mp4",
      });
      await onCompressedUpload(file, targetBucket);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setIsUploading(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center p-4 sm:items-center" role="presentation">
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        aria-label="Close"
        onClick={() =>
          phase !== "loading" && phase !== "running" && !isUploading ? onClose() : undefined
        }
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-gray-200 bg-white shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <h2 id={titleId} className="text-base font-semibold text-gray-900">
            Compress video
          </h2>
          <button
            type="button"
            disabled={phase === "loading" || phase === "running" || isUploading}
            onClick={onClose}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-black disabled:opacity-40"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 px-5 py-4">
          {!sourceFile && <p className="text-sm text-gray-500">No file selected.</p>}
          {sourceFile && (
            <p className="text-sm text-gray-600">
              <span className="font-medium text-gray-900">{sourceFile.name}</span>
              <span className="text-gray-400"> · {(sourceFile.size / (1024 * 1024)).toFixed(2)} MB</span>
            </p>
          )}

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Upload to bucket</label>
            <select
              value={targetBucket}
              onChange={(e) => setTargetBucket(e.target.value as StorageBucketId)}
              disabled={phase === "loading" || phase === "running" || isUploading}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
            >
              {UPLOAD_BUCKETS.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Quality (CRF)</label>
              <input
                type="range"
                min={18}
                max={35}
                value={crf}
                onChange={(e) => setCrf(Number(e.target.value))}
                disabled={phase === "loading" || phase === "running" || isUploading}
                className="w-full"
              />
              <p className="mt-0.5 text-xs text-gray-500">
                {crf} — lower is sharper but larger files
              </p>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Max width (px)</label>
              <select
                value={maxWidth}
                onChange={(e) => setMaxWidth(Number(e.target.value))}
                disabled={phase === "loading" || phase === "running" || isUploading}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
              >
                <option value={1920}>1920 (1080p)</option>
                <option value={1280}>1280 (720p)</option>
                <option value={854}>854 (480p)</option>
                <option value={0}>Original width</option>
              </select>
            </div>
          </div>

          {error && (
            <div className="space-y-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
              <div>{error}</div>
              {errorLogs.trim() && (
                <details className="rounded-md border border-red-200 bg-white/40 px-2 py-1.5">
                  <summary className="cursor-pointer select-none text-xs font-medium text-red-800">
                    Show FFmpeg logs
                  </summary>
                  <pre className="mt-2 max-h-44 overflow-auto whitespace-pre-wrap break-words text-xs text-red-900">
{errorLogs}
                  </pre>
                </details>
              )}
            </div>
          )}

          {(phase === "loading" || phase === "running") && (
            <div className="space-y-2">
              <div className="h-2 overflow-hidden rounded-full bg-gray-200">
                <div
                  className="h-full bg-black transition-[width] duration-300"
                  style={{ width: `${Math.round(progress * 100)}%` }}
                />
              </div>
              <p className="flex items-center gap-2 text-xs text-gray-500">
                <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
                {phase === "loading" ? "Loading encoder (~30 MB)…" : "Compressing…"}
                {logLine && phase === "running" ? ` · ${logLine}` : ""}
              </p>
            </div>
          )}

          {phase === "done" && outBlob && (
            <p className="text-sm text-gray-600">
              Output: {(outBlob.size / (1024 * 1024)).toFixed(2)} MB
              {sourceFile ? (
                <span className="text-gray-400">
                  {" "}
                  (was {(sourceFile.size / (1024 * 1024)).toFixed(2)} MB)
                </span>
              ) : null}
            </p>
          )}

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Upload filename</label>
            <input
              type="text"
              value={outName}
              onChange={(e) => setOutName(e.target.value)}
              disabled={phase === "loading" || phase === "running" || isUploading}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            />
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            <button
              type="button"
              onClick={() => void runCompress()}
              disabled={
                !sourceFile ||
                phase === "loading" ||
                phase === "running" ||
                isUploading
              }
              className="rounded-lg bg-black px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
            >
              {phase === "running" || phase === "loading" ? "Working…" : "Compress"}
            </button>
            {phase === "done" && outBlob && (
              <button
                type="button"
                onClick={() => void uploadResult()}
                disabled={isUploading}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-900 hover:bg-gray-50 disabled:opacity-50"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Uploading…
                  </>
                ) : (
                  "Upload compressed file"
                )}
              </button>
            )}
          </div>

          <p className="text-xs leading-relaxed text-gray-500">
            Compression runs in your browser (ffmpeg.wasm). Core loads from this site (~32 MB once). Large files
            can take several minutes.
          </p>
        </div>
      </div>
    </div>
  );
}

export function videoFileOk(f: File | null): boolean {
  return f != null && isVideoFile(f);
}
