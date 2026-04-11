"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowDownAZ,
  Copy,
  Film,
  FolderOpen,
  HardDrive,
  Loader2,
  RefreshCw,
  Search,
  Trash2,
  Upload,
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { STORAGE_BUCKETS, type StorageBucketId } from "@/utils/supabase/storage";
import {
  deleteAdminMediaAction,
  listAdminMediaAction,
  type AdminMediaRow,
} from "./actions";
import { VideoCompressDialog, videoFileOk } from "./video-compress-dialog";

const BUCKET_OPTIONS: { id: StorageBucketId | "all"; label: string }[] = [
  { id: "all", label: "All buckets" },
  { id: STORAGE_BUCKETS.exercises, label: "Exercises" },
  { id: STORAGE_BUCKETS.equipment, label: "Equipment" },
  { id: STORAGE_BUCKETS.programs, label: "Programs" },
];

const UPLOAD_BUCKETS: { id: StorageBucketId; label: string }[] = [
  { id: STORAGE_BUCKETS.exercises, label: "Exercises" },
  { id: STORAGE_BUCKETS.equipment, label: "Equipment" },
  { id: STORAGE_BUCKETS.programs, label: "Programs" },
];

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

function isImagePath(path: string): boolean {
  return /\.(jpg|jpeg|png|gif|webp)$/i.test(path);
}

function isVideoPath(path: string): boolean {
  return /\.(mp4|webm|mov|m4v|mkv|avi)$/i.test(path);
}

function safeUploadName(name: string): string {
  const base = name.replace(/[^a-zA-Z0-9._-]+/g, "_").replace(/^_+|_+$/g, "");
  return base.length > 0 ? base : "upload.bin";
}

export function MediaLibraryClient() {
  const [bucketFilter, setBucketFilter] = useState<StorageBucketId | "all">("all");
  const [rows, setRows] = useState<AdminMediaRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [uploadBucket, setUploadBucket] = useState<StorageBucketId>(STORAGE_BUCKETS.programs);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [compressOpen, setCompressOpen] = useState(false);
  const [compressFile, setCompressFile] = useState<File | null>(null);
  const [compressTargetBucket, setCompressTargetBucket] = useState<StorageBucketId>(
    STORAGE_BUCKETS.programs
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await listAdminMediaAction(bucketFilter);
    if ("error" in res) {
      setError(res.error);
      setRows([]);
    } else {
      setRows(res.rows);
    }
    setLoading(false);
  }, [bucketFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        r.path.toLowerCase().includes(q) ||
        r.bucket.toLowerCase().includes(q) ||
        r.publicUrl.toLowerCase().includes(q)
    );
  }, [rows, query]);

  async function copyUrl(url: string) {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      window.prompt("Copy URL:", url);
    }
  }

  async function removeRow(row: AdminMediaRow) {
    if (!window.confirm(`Delete ${row.bucket}/${row.path}? This cannot be undone.`)) return;
    setDeleting(`${row.bucket}:${row.path}`);
    const res = await deleteAdminMediaAction(row.bucket, row.path);
    setDeleting(null);
    if ("error" in res) {
      alert(res.error);
    } else {
      void load();
    }
  }

  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const supabase = createClient();
      const folder = crypto.randomUUID();
      const name = safeUploadName(file.name);
      const path = `${folder}/${name}`;
      const { error: upErr } = await supabase.storage.from(uploadBucket).upload(path, file, {
        upsert: false,
      });
      if (upErr) throw new Error(upErr.message);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  async function openCompressFromRow(row: AdminMediaRow) {
    if (!isVideoPath(row.path)) return;
    setCompressTargetBucket(row.bucket);
    setError(null);
    try {
      const res = await fetch(row.publicUrl);
      if (!res.ok) throw new Error("Could not download file for compression.");
      const blob = await res.blob();
      const name = row.path.split("/").pop() || "video.mp4";
      setCompressFile(new File([blob], name, { type: blob.type || "video/mp4" }));
      setCompressOpen(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Download failed.");
    }
  }

  function openCompressFromDisk(file: File | null) {
    if (!videoFileOk(file)) {
      setError("Choose a video file (MP4, WebM, MOV, …).");
      return;
    }
    setCompressTargetBucket(uploadBucket);
    setCompressFile(file);
    setCompressOpen(true);
  }

  async function uploadCompressed(file: File, bucket: StorageBucketId) {
    const supabase = createClient();
    const folder = crypto.randomUUID();
    const name = safeUploadName(file.name);
    const path = `${folder}/${name}`;
    const { error: upErr } = await supabase.storage.from(bucket).upload(path, file, {
      upsert: false,
    });
    if (upErr) throw new Error(upErr.message);
    await load();
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="flex h-14 shrink-0 items-center justify-between gap-4 border-b border-gray-200 bg-white px-8">
        <h1 className="text-lg font-semibold text-gray-900">Media library</h1>
      </div>

      <div className="min-h-0 flex-1 overflow-auto p-8">
        <div className="mx-auto max-w-7xl space-y-6">
          <p className="text-sm text-gray-600">
            Browse public assets in the exercises, equipment, and programs buckets. Upload new files, copy URLs, or
            compress videos in the browser before uploading.
          </p>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>
          )}

          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="flex flex-wrap items-center gap-3">
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <HardDrive className="h-4 w-4 text-gray-400" />
                  Bucket
                  <select
                    value={bucketFilter}
                    onChange={(e) =>
                      setBucketFilter(e.target.value as StorageBucketId | "all")
                    }
                    className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-black focus:outline-none"
                  >
                    {BUCKET_OPTIONS.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.label}
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  type="button"
                  onClick={() => void load()}
                  disabled={loading}
                  className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50 disabled:opacity-50"
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                  Refresh
                </button>
              </div>

              <div className="relative w-full max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Filter by path or URL…"
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pr-4 pl-10 text-sm focus:border-transparent focus:ring-2 focus:ring-black focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-gray-900">
              <Upload className="h-5 w-5 text-gray-500" />
              Upload
            </h2>
            <div className="flex flex-wrap items-end gap-4">
              <label className="text-sm text-gray-700">
                Target bucket
                <select
                  value={uploadBucket}
                  onChange={(e) => setUploadBucket(e.target.value as StorageBucketId)}
                  className="mt-1 block w-full min-w-[10rem] rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-black focus:outline-none"
                >
                  {UPLOAD_BUCKETS.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-black px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50">
                {uploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                {uploading ? "Uploading…" : "Choose file"}
                <input type="file" className="sr-only" disabled={uploading} onChange={(e) => void onUpload(e)} />
              </label>
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-800 hover:bg-gray-50">
                <Film className="h-4 w-4" />
                Compress video from disk
                <input
                  type="file"
                  accept="video/*,.mp4,.webm,.mov,.m4v"
                  className="sr-only"
                  onChange={(e) => {
                    const f = e.target.files?.[0] ?? null;
                    e.target.value = "";
                    openCompressFromDisk(f);
                  }}
                />
              </label>
            </div>
            <p className="mt-3 text-xs text-gray-500">
              Files are stored under a random folder ID (same pattern as program and exercise uploads).
            </p>
          </div>

          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50/50 text-gray-500">
                    <th className="px-4 py-3 font-medium">Preview</th>
                    <th className="px-4 py-3 font-medium">Bucket</th>
                    <th className="px-4 py-3 font-medium">
                      <span className="inline-flex items-center gap-1">
                        <ArrowDownAZ className="h-3.5 w-3.5" />
                        Path
                      </span>
                    </th>
                    <th className="px-4 py-3 font-medium">Size</th>
                    <th className="px-4 py-3 font-medium">Updated</th>
                    <th className="px-4 py-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                        <Loader2 className="mx-auto h-6 w-6 animate-spin text-gray-400" />
                      </td>
                    </tr>
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center text-gray-500">
                        {rows.length === 0 ? "No objects in this bucket yet." : "No matches."}
                      </td>
                    </tr>
                  ) : (
                    filtered.map((row) => {
                      const key = `${row.bucket}:${row.path}`;
                      const busy = deleting === key;
                      return (
                        <tr key={key} className="hover:bg-gray-50/50">
                          <td className="px-4 py-3">
                            {isImagePath(row.path) ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={row.publicUrl}
                                alt=""
                                className="h-12 w-12 rounded-lg border border-gray-100 object-cover"
                                loading="lazy"
                              />
                            ) : isVideoPath(row.path) ? (
                              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100 text-gray-500">
                                <Film className="h-6 w-6" />
                              </div>
                            ) : (
                              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-50 text-gray-400">
                                <FolderOpen className="h-5 w-5" />
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-gray-600">{row.bucket}</td>
                          <td className="max-w-xs truncate px-4 py-3 font-mono text-xs text-gray-800" title={row.path}>
                            {row.path}
                          </td>
                          <td className="px-4 py-3 tabular-nums text-gray-600">{formatBytes(row.size)}</td>
                          <td className="px-4 py-3 text-gray-500">
                            {row.updated_at
                              ? new Date(row.updated_at).toLocaleString(undefined, {
                                  dateStyle: "short",
                                  timeStyle: "short",
                                })
                              : "—"}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex flex-wrap items-center justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => void copyUrl(row.publicUrl)}
                                className="rounded-lg border border-gray-200 bg-white p-2 text-gray-600 hover:bg-gray-50"
                                title="Copy public URL"
                              >
                                <Copy className="h-4 w-4" />
                              </button>
                              {isVideoPath(row.path) && (
                                <button
                                  type="button"
                                  onClick={() => void openCompressFromRow(row)}
                                  className="rounded-lg border border-gray-200 bg-white p-2 text-gray-600 hover:bg-gray-50"
                                  title="Compress video"
                                >
                                  <Film className="h-4 w-4" />
                                </button>
                              )}
                              <a
                                href={row.publicUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="rounded-lg border border-gray-200 bg-white px-2 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
                              >
                                Open
                              </a>
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() => void removeRow(row)}
                                className="rounded-lg border border-red-200 bg-white p-2 text-red-600 hover:bg-red-50 disabled:opacity-50"
                                title="Delete"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            {!loading && filtered.length > 0 && (
              <div className="border-t border-gray-200 bg-gray-50/50 px-4 py-3 text-xs text-gray-500">
                Showing {filtered.length} of {rows.length} file{rows.length === 1 ? "" : "s"}
              </div>
            )}
          </div>
        </div>
      </div>

      <VideoCompressDialog
        open={compressOpen}
        onClose={() => {
          setCompressOpen(false);
          setCompressFile(null);
        }}
        sourceFile={compressFile}
        initialTargetBucket={compressTargetBucket}
        onCompressedUpload={uploadCompressed}
      />
    </div>
  );
}
