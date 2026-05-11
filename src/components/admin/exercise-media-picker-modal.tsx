"use client";

import { useCallback, useEffect, useId, useMemo, useState } from "react";
import { FolderOpen, Loader2, RefreshCw, Search, UploadCloud, X } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { STORAGE_BUCKETS, type StorageBucketId } from "@/utils/supabase/storage";
import { listAdminMediaAction, type AdminMediaRow } from "@/app/admin/media/actions";

export type ExerciseMediaPickerKind = "image" | "video";

const BUCKET_OPTIONS: { id: StorageBucketId | "all"; label: string }[] = [
  { id: "all", label: "All buckets" },
  { id: STORAGE_BUCKETS.exercises, label: "Exercises" },
  { id: STORAGE_BUCKETS.equipment, label: "Equipment" },
  { id: STORAGE_BUCKETS.programs, label: "Programs" },
];

function isImagePath(path: string): boolean {
  return /\.(jpg|jpeg|png|gif|webp)$/i.test(path);
}

function isVideoPath(path: string): boolean {
  return /\.(mp4|webm|mov|m4v|mkv|avi)$/i.test(path);
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

function extFromFile(file: File, fallback: string) {
  const n = file.name.split(".").pop();
  if (n && n.length <= 5) return n.toLowerCase();
  if (file.type === "image/jpeg") return "jpg";
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";
  if (file.type === "image/gif") return "gif";
  if (file.type === "video/mp4") return "mp4";
  if (file.type === "video/webm") return "webm";
  if (file.type === "video/quicktime") return "mov";
  return fallback;
}

function rowMatchesKind(kind: ExerciseMediaPickerKind, row: AdminMediaRow): boolean {
  return kind === "image" ? isImagePath(row.path) : isVideoPath(row.path);
}

type TabId = "upload" | "library";

export function ExerciseMediaPickerModal({
  open,
  kind,
  onClose,
  onChooseUrl,
}: {
  open: boolean;
  kind: ExerciseMediaPickerKind;
  onClose: () => void;
  onChooseUrl: (url: string) => void;
}) {
  const titleId = useId();
  const uploadInputId = useId();
  const [tab, setTab] = useState<TabId>("upload");
  const [bucketFilter, setBucketFilter] = useState<StorageBucketId | "all">("all");
  const [rows, setRows] = useState<AdminMediaRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadDragging, setUploadDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setListError(null);
    const res = await listAdminMediaAction(bucketFilter);
    if ("error" in res) {
      setListError(res.error);
      setRows([]);
    } else {
      setRows(res.rows);
    }
    setLoading(false);
  }, [bucketFilter]);

  useEffect(() => {
    if (!open || tab !== "library") return;
    void load();
  }, [open, tab, load]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) {
      setTab("upload");
      setQuery("");
      setUploadFile(null);
      setUploadError(null);
      setListError(null);
      setSelectedKey(null);
      setUploadDragging(false);
    }
  }, [open]);

  const filteredRows = useMemo(() => {
    const byKind = rows.filter((r) => rowMatchesKind(kind, r));
    const q = query.trim().toLowerCase();
    if (!q) return byKind;
    return byKind.filter(
      (r) =>
        r.path.toLowerCase().includes(q) ||
        r.bucket.toLowerCase().includes(q) ||
        r.publicUrl.toLowerCase().includes(q)
    );
  }, [rows, query, kind]);

  useEffect(() => {
    if (!selectedKey) return;
    if (!filteredRows.some((r) => `${r.bucket}:${r.path}` === selectedKey)) {
      setSelectedKey(null);
    }
  }, [filteredRows, selectedKey]);

  function applyUploadFile(file: File | undefined) {
    if (!file) return;
    if (kind === "image" && !file.type.startsWith("image/")) return;
    if (kind === "video" && !file.type.startsWith("video/")) return;
    setUploadFile(file);
    setUploadError(null);
  }

  async function uploadToExercises() {
    if (!uploadFile) return;
    setUploading(true);
    setUploadError(null);
    try {
      const supabase = createClient();
      const folder = crypto.randomUUID();
      const ext = extFromFile(uploadFile, kind === "image" ? "jpg" : "mp4");
      const path = `${folder}/${kind}.${ext}`;
      const { error: upErr } = await supabase.storage.from(STORAGE_BUCKETS.exercises).upload(path, uploadFile, {
        upsert: false,
      });
      if (upErr) throw new Error(upErr.message);
      const { data } = supabase.storage.from(STORAGE_BUCKETS.exercises).getPublicUrl(path);
      onChooseUrl(data.publicUrl);
      onClose();
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  function confirmLibrarySelection() {
    if (!selectedKey) return;
    const row = filteredRows.find((r) => `${r.bucket}:${r.path}` === selectedKey);
    if (!row) return;
    onChooseUrl(row.publicUrl);
    onClose();
  }

  const kindLabel = kind === "image" ? "image" : "video";

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center" role="presentation">
      <button type="button" className="absolute inset-0 bg-black/50" aria-label="Close dialog" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 flex max-h-[min(90vh,720px)] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-gray-100 px-5 py-4">
          <h2 id={titleId} className="text-base font-semibold text-gray-900">
            Choose {kindLabel}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-black"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="shrink-0 border-b border-gray-100 px-5 pt-2">
          <div className="flex gap-1" role="tablist" aria-label="Media source">
            <button
              type="button"
              role="tab"
              aria-selected={tab === "upload"}
              onClick={() => setTab("upload")}
              className={`border-b-2 px-3 py-2.5 text-sm font-medium transition-colors ${
                tab === "upload"
                  ? "border-black text-gray-900"
                  : "border-transparent text-gray-500 hover:text-gray-900"
              }`}
            >
              <span className="inline-flex items-center gap-2">
                <UploadCloud className="h-4 w-4" />
                Upload new
              </span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === "library"}
              onClick={() => setTab("library")}
              className={`border-b-2 px-3 py-2.5 text-sm font-medium transition-colors ${
                tab === "library"
                  ? "border-black text-gray-900"
                  : "border-transparent text-gray-500 hover:text-gray-900"
              }`}
            >
              <span className="inline-flex items-center gap-2">
                <FolderOpen className="h-4 w-4" />
                Media library
              </span>
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-auto p-5">
          {tab === "upload" && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Files are saved to the exercises bucket (same pattern as other exercise uploads).
              </p>
              <input
                id={uploadInputId}
                type="file"
                accept={kind === "image" ? "image/jpeg,image/png,image/webp,image/gif" : "video/*,.mp4,.webm,.mov"}
                className="sr-only"
                onChange={(e) => {
                  applyUploadFile(e.target.files?.[0]);
                  e.target.value = "";
                }}
              />
              <label
                htmlFor={uploadInputId}
                onDragEnter={(e) => {
                  e.preventDefault();
                  setUploadDragging(true);
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = "copy";
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  if (!e.currentTarget.contains(e.relatedTarget as Node)) setUploadDragging(false);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  setUploadDragging(false);
                  applyUploadFile(e.dataTransfer.files?.[0]);
                }}
                className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-10 text-center transition-colors ${
                  uploadDragging ? "border-black bg-gray-100" : "border-gray-300 hover:bg-gray-50"
                }`}
              >
                <UploadCloud className="mb-3 h-8 w-8 text-gray-400" />
                <p className="text-sm font-medium text-gray-900">Click or drop a file</p>
                <p className="mt-1 text-xs text-gray-500">
                  {kind === "image" ? "PNG, JPG, WebP, or GIF" : "MP4, WebM, MOV, …"}
                </p>
              </label>
              {uploadFile && (
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
                  <span className="min-w-0 truncate text-sm font-medium text-gray-900">{uploadFile.name}</span>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setUploadFile(null)}
                      className="text-sm font-medium text-gray-600 hover:text-gray-900"
                    >
                      Clear
                    </button>
                    <button
                      type="button"
                      disabled={uploading}
                      onClick={() => void uploadToExercises()}
                      className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-60"
                    >
                      {uploading ? "Uploading…" : "Upload and use"}
                    </button>
                  </div>
                </div>
              )}
              {uploadError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                  {uploadError}
                </div>
              )}
            </div>
          )}

          {tab === "library" && (
            <div className="space-y-4">
              {listError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                  {listError}
                </div>
              )}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <label className="text-sm text-gray-700">
                  Bucket
                  <select
                    value={bucketFilter}
                    onChange={(e) => setBucketFilter(e.target.value as StorageBucketId | "all")}
                    className="mt-1 block w-full min-w-40 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-black sm:w-auto"
                  >
                    {BUCKET_OPTIONS.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.label}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="relative w-full sm:max-w-xs">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Filter…"
                    className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pr-4 pl-10 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-black"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => void load()}
                  disabled={loading}
                  className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50 disabled:opacity-50"
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                  Refresh
                </button>
              </div>

              <div className="overflow-hidden rounded-xl border border-gray-200">
                <div className="max-h-[min(45vh,360px)] overflow-auto">
                  <table className="w-full border-collapse text-left text-sm">
                    <thead>
                      <tr className="sticky top-0 border-b border-gray-200 bg-gray-50/95 text-gray-500 backdrop-blur-sm">
                        <th className="px-3 py-2.5 font-medium">Preview</th>
                        <th className="px-3 py-2.5 font-medium">Bucket</th>
                        <th className="px-3 py-2.5 font-medium">Path</th>
                        <th className="hidden px-3 py-2.5 font-medium sm:table-cell">Size</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {loading ? (
                        <tr>
                          <td colSpan={4} className="px-3 py-10 text-center text-gray-500">
                            <Loader2 className="mx-auto h-6 w-6 animate-spin text-gray-400" />
                          </td>
                        </tr>
                      ) : filteredRows.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-3 py-10 text-center text-sm text-gray-500">
                            No matching {kindLabel} files. Try another bucket or upload new.
                          </td>
                        </tr>
                      ) : (
                        filteredRows.map((row) => {
                          const key = `${row.bucket}:${row.path}`;
                          const selected = selectedKey === key;
                          return (
                            <tr
                              key={key}
                              role="button"
                              tabIndex={0}
                              onClick={() => setSelectedKey(key)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                  e.preventDefault();
                                  setSelectedKey(key);
                                }
                              }}
                              className={`cursor-pointer transition-colors ${
                                selected ? "bg-gray-100" : "hover:bg-gray-50/80"
                              }`}
                            >
                              <td className="px-3 py-2">
                                {kind === "image" ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src={row.publicUrl}
                                    alt=""
                                    className="h-12 w-16 rounded-md border border-gray-200 object-cover"
                                  />
                                ) : (
                                  <video
                                    src={row.publicUrl}
                                    className="h-12 w-20 rounded-md border border-gray-200 object-cover"
                                    muted
                                    playsInline
                                    preload="metadata"
                                  />
                                )}
                              </td>
                              <td className="px-3 py-2 text-gray-600">{row.bucket}</td>
                              <td className="max-w-[200px] truncate px-3 py-2 font-mono text-xs text-gray-800">
                                {row.path}
                              </td>
                              <td className="hidden px-3 py-2 text-gray-600 sm:table-cell">{formatBytes(row.size)}</td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!selectedKey}
                  onClick={confirmLibrarySelection}
                  className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
                >
                  Use selected
                </button>
              </div>
            </div>
          )}
        </div>

        {tab === "upload" && (
          <div className="shrink-0 border-t border-gray-100 px-5 py-4">
            <div className="flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
