"use client";

import { useEffect, useId, useState } from "react";
import { Plus, X } from "lucide-react";
import {
  createBodyPart,
  createBodyRegion,
  createCategoryType,
  createExerciseLevel,
  createMovementPattern,
} from "./actions";

function AddModal({
  title,
  submitLabel,
  action,
  namePlaceholder,
  slugPlaceholder,
}: {
  title: string;
  submitLabel: string;
  action: (formData: FormData) => void | Promise<void>;
  namePlaceholder: string;
  slugPlaceholder: string;
}) {
  const [open, setOpen] = useState(false);
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50"
      >
        <Plus className="h-4 w-4" />
        Add
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
            className="relative z-10 w-full max-w-md rounded-2xl border border-gray-200 bg-white shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <h2 id={titleId} className="text-base font-semibold text-gray-900">
                {title}
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
            <form action={action} className="space-y-4 px-6 py-5">
              <div>
                <label htmlFor={`${titleId}-name`} className="mb-1.5 block text-sm font-medium text-gray-700">
                  Name <span className="text-red-600">*</span>
                </label>
                <input
                  id={`${titleId}-name`}
                  name="name"
                  required
                  placeholder={namePlaceholder}
                  className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm focus:border-transparent focus:ring-2 focus:ring-black focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor={`${titleId}-slug`} className="mb-1.5 block text-sm font-medium text-gray-700">
                  Slug <span className="text-gray-400">(optional)</span>
                </label>
                <input
                  id={`${titleId}-slug`}
                  name="slug"
                  placeholder={slugPlaceholder}
                  className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm focus:border-transparent focus:ring-2 focus:ring-black focus:outline-none"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Lowercase, hyphens. Leave empty to derive from the name.
                </p>
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
                  {submitLabel}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export function AddCategoryTypeModal() {
  return (
    <AddModal
      title="New category type"
      submitLabel="Create"
      action={createCategoryType}
      namePlaceholder="e.g. Strength"
      slugPlaceholder="e.g. strength"
    />
  );
}

export function AddMovementPatternModal() {
  return (
    <AddModal
      title="New movement pattern"
      submitLabel="Create"
      action={createMovementPattern}
      namePlaceholder="e.g. Hinge"
      slugPlaceholder="e.g. hinge"
    />
  );
}

export function AddBodyRegionModal() {
  return (
    <AddModal
      title="New body region"
      submitLabel="Create"
      action={createBodyRegion}
      namePlaceholder="e.g. Shoulders"
      slugPlaceholder="e.g. shoulders"
    />
  );
}

export function AddBodyPartModal() {
  return (
    <AddModal
      title="New body part"
      submitLabel="Create"
      action={createBodyPart}
      namePlaceholder="e.g. Knee"
      slugPlaceholder="e.g. knee"
    />
  );
}

export function AddExerciseLevelModal() {
  return (
    <AddModal
      title="New exercise level"
      submitLabel="Create"
      action={createExerciseLevel}
      namePlaceholder="e.g. Intermediate"
      slugPlaceholder="e.g. intermediate"
    />
  );
}
