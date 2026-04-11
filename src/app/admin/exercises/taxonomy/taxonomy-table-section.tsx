import { Trash2 } from "lucide-react";
import type { ReactNode } from "react";

export type TaxonomyRow = { id: string; name: string; slug: string };

export function TaxonomyTableSection({
  heading,
  hint,
  rows,
  updateAction,
  deleteAction,
  addSlot,
}: {
  heading: string;
  hint: string;
  rows: TaxonomyRow[];
  updateAction: (formData: FormData) => void | Promise<void>;
  deleteAction: (formData: FormData) => void | Promise<void>;
  addSlot: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      <div className="flex flex-col gap-3 border-b border-gray-200 bg-gray-50/50 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-gray-900">{heading}</h2>
          <p className="text-xs text-gray-500">{hint}</p>
        </div>
        <div className="shrink-0">{addSlot}</div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50/30 text-gray-500">
              <th className="px-6 py-3 font-medium">{"Name & slug"}</th>
              <th className="px-6 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={2} className="px-6 py-10 text-center text-gray-500">
                  No rows yet. Use <strong className="font-medium text-gray-800">Add</strong> above.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50/50">
                  <td className="px-6 py-3 align-middle">
                    <form action={updateAction} id={`edit-${row.id}`} className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-4">
                      <input type="hidden" name="id" value={row.id} />
                      <div className="min-w-0 flex-1">
                        <label className="mb-1 block text-xs font-medium text-gray-600">Name</label>
                        <input
                          name="name"
                          required
                          defaultValue={row.name}
                          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-black focus:outline-none"
                        />
                      </div>
                      <div className="w-full shrink-0 sm:max-w-xs">
                        <label className="mb-1 block text-xs font-medium text-gray-600">Slug</label>
                        <input
                          name="slug"
                          required
                          defaultValue={row.slug}
                          className="w-full rounded-lg border border-gray-200 px-3 py-2 font-mono text-xs focus:border-transparent focus:ring-2 focus:ring-black focus:outline-none"
                        />
                      </div>
                    </form>
                  </td>
                  <td className="px-6 py-3 text-right align-middle">
                    <div className="inline-flex flex-wrap items-center justify-end gap-2">
                      <button
                        type="submit"
                        form={`edit-${row.id}`}
                        className="rounded-lg bg-black px-3 py-2 text-xs font-medium text-white hover:bg-gray-800"
                      >
                        Save
                      </button>
                      <form action={deleteAction} className="inline">
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
      {rows.length > 0 && (
        <div className="border-t border-gray-200 bg-gray-50/50 px-6 py-3 text-sm text-gray-500">
          {rows.length} row{rows.length === 1 ? "" : "s"}
        </div>
      )}
    </section>
  );
}
