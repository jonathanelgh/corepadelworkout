"use client";

import { useActionState, useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { Plus, X } from "lucide-react";
import type { AdminAffiliateRow } from "@/lib/affiliates/load-admin";
import { formatMoney, formatPercent } from "@/lib/affiliates/types";
import { createAffiliateAction, type CreateAffiliateState } from "./actions";

const initialState: CreateAffiliateState = {};

export function AffiliatesAdminClient({ rows }: { rows: AdminAffiliateRow[] }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-950">Affiliates</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-600">
            Create an affiliate account, set the commission, and share their link. A player who arrives
            from that link stays attributed for 30 days. Paid subscription invoices inside the commission
            window earn the rate locked at the first visit.
          </p>
          <div className="mt-3 flex gap-4 text-sm">
            <Link href="/admin/affiliates/subscriptions" className="font-medium text-zinc-950 underline">
              Subscriptions
            </Link>
            <Link href="/admin/affiliates/payouts" className="font-medium text-zinc-950 underline">
              Payout reports
            </Link>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex shrink-0 items-center gap-2 rounded-full bg-zinc-950 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
        >
          <Plus className="h-4 w-4" />
          Add affiliate
        </button>
      </div>

      {open ? <CreateAffiliateModal onClose={() => setOpen(false)} /> : null}

      <div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="border-b border-zinc-200 text-xs uppercase tracking-wide text-zinc-500">
            <tr>
              <th className="px-4 py-3 font-medium">Affiliate</th>
              <th className="px-4 py-3 font-medium">Deal</th>
              <th className="px-4 py-3 font-medium">Clicks</th>
              <th className="px-4 py-3 font-medium">Signups</th>
              <th className="px-4 py-3 font-medium">Subscribers</th>
              <th className="px-4 py-3 font-medium">Unpaid</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-zinc-500">
                  No affiliates yet.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="border-b border-zinc-100 last:border-0">
                  <td className="px-4 py-3">
                    <Link href={`/admin/affiliates/${row.id}`} className="font-medium text-zinc-950 hover:underline">
                      {row.display_name}
                    </Link>
                    <div className="text-zinc-500">{row.email}</div>
                  </td>
                  <td className="px-4 py-3">
                    {formatPercent(row.commission_percent)} for {row.commission_months} months
                  </td>
                  <td className="px-4 py-3">{row.clicks}</td>
                  <td className="px-4 py-3">{row.signups}</td>
                  <td className="px-4 py-3">{row.subscribers}</td>
                  <td className="px-4 py-3">{formatMoney(row.balanceCents, row.currency)}</td>
                  <td className="px-4 py-3 capitalize">{row.status}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
  placeholder,
  defaultValue,
  min,
  max,
  step,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  defaultValue?: string;
  min?: string;
  max?: string;
  step?: string;
}) {
  return (
    <label className="block text-sm text-zinc-700">
      {label}
      <input
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        defaultValue={defaultValue}
        min={min}
        max={max}
        step={step}
        className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-950"
      />
    </label>
  );
}

function CreateAffiliateModal({ onClose }: { onClose: () => void }) {
  const titleId = useId();
  const [mounted, setMounted] = useState(false);
  const [state, action, pending] = useActionState(createAffiliateAction, initialState);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape" && !pending) onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, pending]);

  if (!mounted) return null;

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
        className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl border border-zinc-200 bg-white shadow-xl sm:rounded-2xl"
      >
        <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4">
          <h2 id={titleId} className="text-lg font-semibold text-zinc-950">
            {state.created ? "Affiliate created" : "Add affiliate"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={pending}
            className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 disabled:opacity-50"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {state.created ? (
          <div className="overflow-y-auto px-5 py-5 text-sm">
            <p className="font-medium text-zinc-950">
              {state.created.existingAccount
                ? state.created.emailSent
                  ? "Welcome email sent. They sign in with the password they already use."
                  : "This email already had an account. The welcome email could not be sent. They sign in with their current password."
                : state.created.emailSent
                  ? "Welcome email sent with the login link and temporary password. Copy the password here as well. It is not shown again."
                  : "The welcome email could not be sent. Copy the password now. It is not shown again."}
            </p>
            <p className="mt-3 text-zinc-700">Email: {state.created.email}</p>
            {state.created.password ? <p className="text-zinc-700">Password: {state.created.password}</p> : null}
            <p className="mt-2 break-all text-zinc-700">Link: {state.created.link}</p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href={`/admin/affiliates/${state.created.id}`}
                className="rounded-full bg-zinc-950 px-4 py-2 text-sm font-medium text-white"
              >
                Open affiliate
              </Link>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          <form action={action} className="overflow-y-auto px-5 py-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Name" name="display_name" required />
              <Field label="Email" name="email" type="email" required />
              <Field label="Password" name="password" type="text" placeholder="New accounts only. Blank generates one" />
              <Field label="Phone" name="phone" />
              <Field label="Instagram" name="instagram" placeholder="@handle or URL" />
              <Field label="YouTube" name="youtube" placeholder="@handle or URL" />
              <Field label="Facebook" name="facebook" placeholder="URL" />
              <Field label="TikTok" name="tiktok" placeholder="@handle or URL" />
              <Field label="Website" name="website" placeholder="https://" />
              <Field label="Commission %" name="commission_percent" type="number" defaultValue="50" min="0" max="100" step="0.01" required />
              <Field label="Commission months" name="commission_months" type="number" defaultValue="6" min="1" max="60" step="1" required />
            </div>
            <label className="mt-4 block text-sm text-zinc-700">
              Notes
              <textarea
                name="notes"
                rows={3}
                className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-950"
              />
            </label>
            {state.error ? <p className="mt-3 text-sm text-red-600">{state.error}</p> : null}
            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={pending}
                className="rounded-full border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={pending}
                className="rounded-full bg-zinc-950 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
              >
                {pending ? "Creating..." : "Create affiliate"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>,
    document.body
  );
}
