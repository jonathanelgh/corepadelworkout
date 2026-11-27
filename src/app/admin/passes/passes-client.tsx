"use client";

import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { Download, Loader2, Plus, QrCode, X } from "lucide-react";
import { PRO_PASS_BATCH_MAX, PRO_PASS_MONTHS, type ProPassRow, type ProPassStatus } from "@/lib/billing/pro-pass-types";
import { createProPasses } from "./actions";

function formatWhen(iso: string | null): string {
  if (!iso) return "Never";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const STATUS_LABEL: Record<ProPassStatus, string> = {
  available: "Available",
  redeemed: "Redeemed",
  expired: "Expired",
  inactive: "Inactive",
};

const STATUS_CLASS: Record<ProPassStatus, string> = {
  available: "bg-emerald-50 text-emerald-800",
  redeemed: "bg-zinc-100 text-zinc-700",
  expired: "bg-amber-50 text-amber-800",
  inactive: "bg-gray-100 text-gray-600",
};

function CreatePassesModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (rows: ProPassRow[]) => void;
}) {
  const titleId = useId();
  const [mounted, setMounted] = useState(false);
  const [count, setCount] = useState("6");
  const [neverExpires, setNeverExpires] = useState(true);
  const [expiryDate, setExpiryDate] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    setCount("6");
    setNeverExpires(true);
    setExpiryDate("");
    setError(null);
    setPending(false);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !pending) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, pending]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!neverExpires && !expiryDate) {
      setError("Choose an expiry date, or set the passes to never expire.");
      return;
    }
    setPending(true);
    const expiresAt = neverExpires
      ? null
      : new Date(`${expiryDate}T23:59:59`).toISOString();
    const result = await createProPasses({ count: Number(count), expiresAt });
    setPending(false);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    onCreated(result.rows);
    onClose();
  }

  if (!open || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        aria-label="Close"
        onClick={() => !pending && onClose()}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative w-full max-w-md overflow-hidden rounded-t-2xl border border-gray-200 bg-white shadow-xl sm:rounded-2xl"
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <h2 id={titleId} className="text-lg font-semibold text-gray-900">
            Create Pro passes
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={pending}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4 px-5 py-4">
          <p className="text-sm text-gray-500">
            Each pass is a one-time signup QR code for {PRO_PASS_MONTHS} months of Pro.
          </p>
          <div>
            <label htmlFor="pass-count" className="mb-1.5 block text-sm font-medium text-gray-700">
              How many
            </label>
            <input
              id="pass-count"
              type="number"
              min={1}
              max={PRO_PASS_BATCH_MAX}
              required
              value={count}
              onChange={(e) => setCount(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>
          <fieldset className="space-y-2">
            <legend className="mb-1.5 text-sm font-medium text-gray-700">Expiry</legend>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="radio"
                name="pass-expiry"
                checked={neverExpires}
                onChange={() => setNeverExpires(true)}
              />
              Never expire
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="radio"
                name="pass-expiry"
                checked={!neverExpires}
                onChange={() => setNeverExpires(false)}
              />
              Expires on
            </label>
            {!neverExpires && (
              <input
                type="date"
                required
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
              />
            )}
          </fieldset>
          {error && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>
          )}
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={pending}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={pending}
              className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-60"
            >
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Create
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

export function PassesClient({ initialRows }: { initialRows: ProPassRow[] }) {
  const [rows, setRows] = useState(initialRows);
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    setRows(initialRows);
  }, [initialRows]);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="flex shrink-0 items-start justify-between gap-4 border-b border-gray-200 bg-white px-6 py-5">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
            <QrCode className="h-4 w-4" />
          </span>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Pro passes</h1>
            <p className="mt-1 max-w-xl text-sm text-gray-500">
              One-time QR codes. Scanning one creates an account and grants {PRO_PASS_MONTHS} months of Pro.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-gray-800"
        >
          <Plus className="h-4 w-4" />
          Create
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
        {message && (
          <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
            {message}
          </div>
        )}
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
            <thead className="bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Months</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Redeemed</th>
                <th className="px-4 py-3">Expiry</th>
                <th className="px-4 py-3 text-right">QR</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-sm text-gray-500">
                    No passes yet.
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50/80">
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-gray-900">{row.code}</td>
                    <td className="px-4 py-3 text-gray-700">{row.months}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_CLASS[row.status]}`}
                      >
                        {STATUS_LABEL[row.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {row.redeemed_at ? (
                        <span>
                          {row.redeemed_by_name || row.redeemed_by_email || "Redeemed"}
                          <span className="mt-0.5 block text-xs text-gray-500">{formatWhen(row.redeemed_at)}</span>
                        </span>
                      ) : (
                        "Not redeemed"
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-700">{row.expires_at ? formatWhen(row.expires_at) : "Never"}</td>
                    <td className="px-4 py-3 text-right">
                      <a
                        href={`/api/admin/pro-passes/${row.id}/qr`}
                        download={`pro-pass-${row.code}.png`}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                      >
                        <Download className="h-3.5 w-3.5" />
                        Download
                      </a>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <CreatePassesModal
        open={open}
        onClose={() => setOpen(false)}
        onCreated={(created) => {
          setRows((prev) => {
            const ids = new Set(created.map((row) => row.id));
            return [...created, ...prev.filter((row) => !ids.has(row.id))];
          });
          setMessage(
            created.length === 1 ? "Created 1 Pro pass." : `Created ${created.length} Pro passes.`
          );
        }}
      />
    </div>
  );
}
