"use client";

import { useEffect, useState, useTransition } from "react";
import { Check, Copy, Gift, Loader2, Plus } from "lucide-react";
import { ADMIN_PRO_GRANT_MONTHS } from "@/lib/admin/manage-pro-subscription";
import { buildSignupOfferUrl, type SignupOfferRow } from "@/lib/billing/signup-offer";
import { createSignupOffer, setSignupOfferActive } from "./actions";

function formatWhen(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function OffersClient({ initialRows }: { initialRows: SignupOfferRow[] }) {
  const [rows, setRows] = useState(initialRows);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [months, setMonths] = useState<number>(3);
  const [maxRedemptions, setMaxRedemptions] = useState("");

  useEffect(() => {
    setRows(initialRows);
  }, [initialRows]);

  async function onCopy(row: SignupOfferRow) {
    const url = buildSignupOfferUrl(row.code);
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(row.id);
      setTimeout(() => setCopiedId((id) => (id === row.id ? null : id)), 2000);
    } catch {
      setError("Could not copy link.");
    }
  }

  function onCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const result = await createSignupOffer({
        code,
        name,
        months,
        maxRedemptions: maxRedemptions.trim() ? Number(maxRedemptions) : null,
      });
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setRows((prev) => [result.row, ...prev]);
      setCode("");
      setName("");
      setMaxRedemptions("");
      setMessage(`Created ${result.row.code}. Shareable link copied below.`);
      try {
        await navigator.clipboard.writeText(result.url);
        setCopiedId(result.row.id);
      } catch {
        /* ignore */
      }
    });
  }

  function onToggle(row: SignupOfferRow) {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const result = await setSignupOfferActive(row.id, !row.active);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setRows((prev) =>
        prev.map((r) => (r.id === row.id ? { ...r, active: !r.active } : r))
      );
      setMessage(`${row.code} ${row.active ? "deactivated" : "activated"}.`);
    });
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="shrink-0 border-b border-gray-200 bg-white px-6 py-5">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
            <Gift className="h-4 w-4" />
          </span>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Signup offers</h1>
            <p className="mt-1 text-sm text-gray-500">
              Shareable links that grant free Pro months when someone creates an account. Anyone can use an active
              link; each person can redeem once.
            </p>
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        )}
        {message && (
          <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
            {message}
          </div>
        )}

        <form
          onSubmit={onCreate}
          className="mb-8 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
        >
          <h2 className="text-sm font-semibold text-gray-900">Create offer</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-600">Code</label>
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="PRO3"
                required
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-600">Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Partner 3 months"
                required
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-600">Pro months</label>
              <select
                value={months}
                onChange={(e) => setMonths(Number(e.target.value))}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
              >
                {ADMIN_PRO_GRANT_MONTHS.map((m) => (
                  <option key={m} value={m}>
                    {m} months
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-600">
                Max redemptions <span className="font-normal text-gray-400">(optional)</span>
              </label>
              <input
                type="number"
                min={1}
                value={maxRedemptions}
                onChange={(e) => setMaxRedemptions(e.target.value)}
                placeholder="Unlimited"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={pending}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:opacity-60"
          >
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Create &amp; copy link
          </button>
        </form>

        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
            <thead className="bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Months</th>
                <th className="px-4 py-3">Redeemed</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm text-gray-500">
                    No offers yet. Create one above.
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50/80">
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-gray-900">{row.code}</td>
                    <td className="px-4 py-3 text-gray-700">{row.name}</td>
                    <td className="px-4 py-3 text-gray-700">{row.months}</td>
                    <td className="px-4 py-3 text-gray-700">
                      {row.redemption_count}
                      {row.max_redemptions != null ? ` / ${row.max_redemptions}` : ""}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                          row.active ? "bg-emerald-50 text-emerald-800" : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {row.active ? "Active" : "Off"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{formatWhen(row.created_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => void onCopy(row)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                        >
                          {copiedId === row.id ? (
                            <Check className="h-3.5 w-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                          {copiedId === row.id ? "Copied" : "Copy link"}
                        </button>
                        <button
                          type="button"
                          disabled={pending}
                          onClick={() => onToggle(row)}
                          className="rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                        >
                          {row.active ? "Deactivate" : "Activate"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
