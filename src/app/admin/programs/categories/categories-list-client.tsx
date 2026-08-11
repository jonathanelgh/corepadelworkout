"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { Pencil, Plus, Search, Tags, Trash2, X } from "lucide-react";
import {
  createProgramCategory,
  deleteProgramCategory,
  updateProgramCategory,
} from "./actions";

export type ProgramCategoryRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sort_order: number;
  programCount: number;
};

function CategoryFormFields({
  idPrefix,
  defaults,
}: {
  idPrefix: string;
  defaults?: Partial<ProgramCategoryRow>;
}) {
  return (
    <>
      <div>
        <label htmlFor={`${idPrefix}-name`} className="mb-1.5 block text-sm font-medium text-gray-700">
          Name <span className="text-red-600">*</span>
        </label>
        <input
          id={`${idPrefix}-name`}
          name="name"
          required
          defaultValue={defaults?.name ?? ""}
          placeholder="e.g. Warm-up"
          className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm focus:border-transparent focus:ring-2 focus:ring-black focus:outline-none"
        />
      </div>
      <div>
        <label htmlFor={`${idPrefix}-slug`} className="mb-1.5 block text-sm font-medium text-gray-700">
          Slug
        </label>
        <input
          id={`${idPrefix}-slug`}
          name="slug"
          defaultValue={defaults?.slug ?? ""}
          placeholder="Auto from name if empty"
          className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 font-mono text-xs focus:border-transparent focus:ring-2 focus:ring-black focus:outline-none"
        />
        <p className="mt-1 text-xs text-gray-500">Lowercase letters, numbers, hyphens.</p>
      </div>
      <div>
        <label htmlFor={`${idPrefix}-desc`} className="mb-1.5 block text-sm font-medium text-gray-700">
          Description
        </label>
        <textarea
          id={`${idPrefix}-desc`}
          name="description"
          rows={3}
          defaultValue={defaults?.description ?? ""}
          placeholder="Optional short description"
          className="w-full resize-none rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm focus:border-transparent focus:ring-2 focus:ring-black focus:outline-none"
        />
      </div>
      <div>
        <label htmlFor={`${idPrefix}-sort`} className="mb-1.5 block text-sm font-medium text-gray-700">
          Sort order
        </label>
        <input
          id={`${idPrefix}-sort`}
          name="sort_order"
          type="number"
          defaultValue={defaults?.sort_order ?? 0}
          className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm focus:border-transparent focus:ring-2 focus:ring-black focus:outline-none"
        />
        <p className="mt-1 text-xs text-gray-500">Lower numbers appear first in filters.</p>
      </div>
    </>
  );
}

function AddCategoryModal() {
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
        className="inline-flex items-center gap-2 rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
      >
        <Plus className="h-4 w-4" />
        Add category
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
                Add program category
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-black"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <form action={createProgramCategory} className="space-y-4 px-6 py-5">
              <CategoryFormFields idPrefix="add-cat" />
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

function EditCategoryModal({
  item,
  onClose,
}: {
  item: ProgramCategoryRow | null;
  onClose: () => void;
}) {
  const titleId = useId();

  useEffect(() => {
    if (!item) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [item, onClose]);

  if (!item) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center" role="presentation">
      <button type="button" className="absolute inset-0 bg-black/50" aria-label="Close dialog" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-gray-200 bg-white shadow-2xl"
      >
        <div className="sticky top-0 flex items-center justify-between border-b border-gray-100 bg-white px-6 py-4">
          <h2 id={titleId} className="text-base font-semibold text-gray-900">
            Edit category
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-black"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <form action={updateProgramCategory} className="space-y-4 px-6 py-5">
          <input type="hidden" name="id" value={item.id} />
          <CategoryFormFields idPrefix={`edit-cat-${item.id}`} defaults={item} />
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function CategoriesListClient({ items }: { items: ProgramCategoryRow[] }) {
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<ProgramCategoryRow | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (row) =>
        row.name.toLowerCase().includes(q) ||
        row.slug.toLowerCase().includes(q) ||
        (row.description ?? "").toLowerCase().includes(q)
    );
  }, [items, query]);

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search categories…"
            className="w-full rounded-lg border border-gray-200 bg-white py-2 pr-4 pl-10 text-sm focus:border-transparent focus:ring-2 focus:ring-black focus:outline-none"
          />
        </div>
        <AddCategoryModal />
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50/50 text-gray-500">
              <th className="px-6 py-3 font-medium">Category</th>
              <th className="hidden px-6 py-3 font-medium md:table-cell">Sort</th>
              <th className="hidden px-6 py-3 font-medium sm:table-cell">Programs</th>
              <th className="px-6 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                  <Tags className="mx-auto mb-2 h-8 w-8 text-gray-300" />
                  {items.length === 0
                    ? "No categories yet. Add one to tag programs."
                    : "No categories match your search."}
                </td>
              </tr>
            ) : (
              filtered.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50/50">
                  <td className="px-6 py-4 align-top">
                    <p className="font-medium text-gray-900">{row.name}</p>
                    <p className="mt-0.5 font-mono text-xs text-gray-500">{row.slug}</p>
                    {row.description && (
                      <p className="mt-1 line-clamp-2 text-xs text-gray-600">{row.description}</p>
                    )}
                  </td>
                  <td className="hidden px-6 py-4 align-top text-gray-600 md:table-cell">
                    {row.sort_order}
                  </td>
                  <td className="hidden px-6 py-4 align-top text-gray-600 sm:table-cell">
                    {row.programCount}
                  </td>
                  <td className="px-6 py-4 text-right align-top">
                    <div className="inline-flex flex-wrap items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setEditing(row)}
                        className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-800 hover:bg-gray-50"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Edit
                      </button>
                      <form
                        action={deleteProgramCategory}
                        onSubmit={(e) => {
                          const ok = window.confirm(
                            row.programCount > 0
                              ? `Delete “${row.name}”? It will be removed from ${row.programCount} program${row.programCount === 1 ? "" : "s"}.`
                              : `Delete “${row.name}”?`
                          );
                          if (!ok) e.preventDefault();
                        }}
                      >
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
        {filtered.length > 0 && (
          <div className="border-t border-gray-200 bg-gray-50/50 px-6 py-3 text-sm text-gray-500">
            {filtered.length} categor{filtered.length === 1 ? "y" : "ies"}
            {query.trim() && filtered.length !== items.length ? ` (of ${items.length})` : ""}
          </div>
        )}
      </div>

      <EditCategoryModal item={editing} onClose={() => setEditing(null)} />
    </>
  );
}
