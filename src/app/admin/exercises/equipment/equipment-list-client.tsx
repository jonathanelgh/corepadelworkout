"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { ImageIcon, Pencil, Search, Trash2, X } from "lucide-react";
import { deleteEquipment, updateEquipment } from "./actions";

export type EquipmentListItem = {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  created_at: string;
};

function EditEquipmentModal({
  item,
  onClose,
}: {
  item: EquipmentListItem | null;
  onClose: () => void;
}) {
  const titleId = useId();
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const blobRef = useRef<string | null>(null);

  useEffect(() => {
    if (!item) return;
    setFilePreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      blobRef.current = null;
      return null;
    });
  }, [item?.id]);

  useEffect(() => {
    if (!item) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [item, onClose]);

  useEffect(
    () => () => {
      if (blobRef.current) {
        URL.revokeObjectURL(blobRef.current);
        blobRef.current = null;
      }
    },
    []
  );

  if (!item) return null;

  const displayImage = filePreview || (item.image_url?.trim() ? item.image_url.trim() : null);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center" role="presentation">
      <button type="button" className="absolute inset-0 bg-black/50" aria-label="Close dialog" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-gray-200 bg-white shadow-2xl"
      >
        <div className="sticky top-0 flex items-center justify-between border-b border-gray-100 bg-white px-6 py-4">
          <h2 id={titleId} className="text-base font-semibold text-gray-900">
            Edit equipment
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-black"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <form action={updateEquipment} encType="multipart/form-data" className="space-y-4 px-6 py-5">
          <input type="hidden" name="id" value={item.id} />
          <input type="hidden" name="image_url" value={item.image_url ?? ""} />
          <div>
            <label htmlFor={`edit-eq-title-${item.id}`} className="mb-1.5 block text-sm font-medium text-gray-700">
              Title <span className="text-red-600">*</span>
            </label>
            <input
              id={`edit-eq-title-${item.id}`}
              name="title"
              required
              defaultValue={item.title}
              className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm focus:border-transparent focus:ring-2 focus:ring-black focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor={`edit-eq-desc-${item.id}`} className="mb-1.5 block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              id={`edit-eq-desc-${item.id}`}
              name="description"
              rows={3}
              defaultValue={item.description ?? ""}
              className="w-full resize-none rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm focus:border-transparent focus:ring-2 focus:ring-black focus:outline-none"
            />
          </div>
          <div>
            <span className="mb-1.5 block text-sm font-medium text-gray-700">Photo</span>
            <p className="mb-2 text-xs text-gray-500">Leave unchanged, or choose a new image (max 5 MB).</p>
            <label
              htmlFor={`edit-eq-photo-${item.id}`}
              className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50/80 px-4 py-6 transition-colors hover:border-gray-300 hover:bg-gray-50"
            >
              {displayImage ? (
                <img src={displayImage} alt="" className="max-h-36 w-auto max-w-full rounded-lg object-contain" />
              ) : (
                <>
                  <ImageIcon className="h-8 w-8 text-gray-400" />
                  <span className="text-sm text-gray-600">Upload a photo</span>
                </>
              )}
            </label>
            <input
              id={`edit-eq-photo-${item.id}`}
              name="photo"
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(e) => {
                const f = e.target.files?.[0];
                setFilePreview((prev) => {
                  if (prev) URL.revokeObjectURL(prev);
                  const next = f ? URL.createObjectURL(f) : null;
                  blobRef.current = next;
                  return next;
                });
              }}
            />
          </div>
          <div className="flex justify-end gap-2 border-t border-gray-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-black px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800"
            >
              Save changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function matchesEquipmentQuery(item: EquipmentListItem, q: string): boolean {
  if (!q) return true;
  const n = q.toLowerCase();
  if (item.title.toLowerCase().includes(n)) return true;
  if (item.description?.toLowerCase().includes(n)) return true;
  return false;
}

export function EquipmentListClient({ items }: { items: EquipmentListItem[] }) {
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<EquipmentListItem | null>(null);

  const filtered = useMemo(
    () => items.filter((item) => matchesEquipmentQuery(item, query.trim())),
    [items, query]
  );

  return (
    <>
      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by title or description…"
            className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pr-4 pl-10 text-sm transition-all focus:border-transparent focus:ring-2 focus:ring-black focus:outline-none"
            aria-label="Search equipment"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/50 text-gray-500">
                <th className="px-6 py-4 font-medium">Image</th>
                <th className="px-6 py-4 font-medium">Title</th>
                <th className="px-6 py-4 font-medium">Description</th>
                <th className="px-6 py-4 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                    {items.length === 0 ? (
                      <>
                        No equipment yet. Use <strong className="font-medium text-gray-800">Add equipment</strong> in the
                        bar above.
                      </>
                    ) : (
                      <>No matches for your search.</>
                    )}
                  </td>
                </tr>
              ) : (
                filtered.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50/50">
                    <td className="px-6 py-4 align-middle">
                      {row.image_url?.trim() ? (
                        <img
                          src={row.image_url.trim()}
                          alt=""
                          className="h-12 w-12 rounded-lg border border-gray-100 object-cover"
                        />
                      ) : (
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-dashed border-gray-200 bg-gray-50">
                          <ImageIcon className="h-5 w-5 text-gray-300" />
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 align-middle font-medium text-gray-900">{row.title}</td>
                    <td className="max-w-md px-6 py-4 align-middle text-gray-600">
                      {row.description?.trim() ? (
                        <p className="line-clamp-2 text-sm">{row.description.trim()}</p>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 align-middle text-right">
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setEditing(row)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-800 hover:bg-gray-50"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Edit
                        </button>
                        <form action={deleteEquipment} className="inline">
                          <input type="hidden" name="id" value={row.id} />
                          <button
                            type="submit"
                            className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-3 py-2 text-xs font-medium text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Delete
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {filtered.length > 0 && (
          <div className="border-t border-gray-200 bg-gray-50/50 px-6 py-3 text-sm text-gray-500">
            Showing {filtered.length} of {items.length} item{items.length === 1 ? "" : "s"}
          </div>
        )}
      </div>

      {editing && <EditEquipmentModal item={editing} onClose={() => setEditing(null)} />}
    </>
  );
}
