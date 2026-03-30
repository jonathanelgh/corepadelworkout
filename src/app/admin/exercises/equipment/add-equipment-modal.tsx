"use client";

import { useEffect, useId, useState } from "react";
import { ImageIcon, Plus, X } from "lucide-react";
import { createEquipment } from "./actions";

export function AddEquipmentModal() {
  const [open, setOpen] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    if (open) return;
    setPhotoPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
      >
        <Plus className="h-4 w-4" />
        Add equipment
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center" role="presentation">
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            aria-label="Close dialog"
            onClick={() => setOpen(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="relative z-10 w-full max-w-lg rounded-2xl border border-gray-200 bg-white shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <h2 id={titleId} className="text-base font-semibold text-gray-900">
                Add equipment
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-black"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <form action={createEquipment} encType="multipart/form-data" className="space-y-4 px-6 py-5">
              <div>
                <label htmlFor="modal-eq-title" className="mb-1.5 block text-sm font-medium text-gray-700">
                  Title <span className="text-red-600">*</span>
                </label>
                <input
                  id="modal-eq-title"
                  name="title"
                  required
                  placeholder="e.g. Resistance band"
                  className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm focus:border-transparent focus:ring-2 focus:ring-black focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="modal-eq-desc" className="mb-1.5 block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  id="modal-eq-desc"
                  name="description"
                  rows={3}
                  className="w-full resize-none rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm focus:border-transparent focus:ring-2 focus:ring-black focus:outline-none"
                />
              </div>
              <div>
                <span className="mb-1.5 block text-sm font-medium text-gray-700">Photo</span>
                <p className="mb-2 text-xs text-gray-500">Optional. JPG, PNG, WebP, or GIF up to 5 MB.</p>
                <label
                  htmlFor="modal-eq-photo"
                  className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50/80 px-4 py-8 transition-colors hover:border-gray-300 hover:bg-gray-50"
                >
                  {photoPreview ? (
                    <img
                      src={photoPreview}
                      alt=""
                      className="max-h-40 w-auto max-w-full rounded-lg object-contain"
                    />
                  ) : (
                    <>
                      <ImageIcon className="h-10 w-10 text-gray-400" />
                      <span className="text-sm font-medium text-gray-700">Upload a photo</span>
                      <span className="text-xs text-gray-500">Click to choose a file</span>
                    </>
                  )}
                </label>
                <input
                  id="modal-eq-photo"
                  name="photo"
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    setPhotoPreview((prev) => {
                      if (prev) URL.revokeObjectURL(prev);
                      return f ? URL.createObjectURL(f) : null;
                    });
                  }}
                />
              </div>
              <div className="flex justify-end gap-2 border-t border-gray-100 pt-4">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-lg bg-black px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800"
                >
                  <Plus className="h-4 w-4" />
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
