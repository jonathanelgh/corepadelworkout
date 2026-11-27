"use client";

import { useActionState } from "react";
import Link from "next/link";
import type { AdminAffiliateRow } from "@/lib/affiliates/load-admin";
import { formatMoney, formatPercent } from "@/lib/affiliates/types";
import { createAffiliateAction, type CreateAffiliateState } from "./actions";

const initialState: CreateAffiliateState = {};

export function AffiliatesAdminClient({ rows }: { rows: AdminAffiliateRow[] }) {
  const [state, action, pending] = useActionState(createAffiliateAction, initialState);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-950">Affiliates</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-600">
          Create an affiliate account, set the commission, and share their link. A player who arrives
          from that link stays attributed for 30 days. Paid subscription invoices inside the commission
          window earn the rate locked at the first visit.
        </p>
      </div>

      <form action={action} className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-zinc-950">New affiliate</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Name" name="display_name" required />
          <Field label="Email" name="email" type="email" required />
          <Field label="Password" name="password" type="text" placeholder="Leave blank to generate one" />
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
        <button
          type="submit"
          disabled={pending}
          className="mt-4 rounded-full bg-zinc-950 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {pending ? "Creating..." : "Create affiliate"}
        </button>
        {state.created ? (
          <div className="mt-4 rounded-xl bg-zinc-950 p-4 text-sm text-white">
            <p className="font-medium">Account created. Copy the password now. It is not shown again.</p>
            <p className="mt-2">Email: {state.created.email}</p>
            <p>Password: {state.created.password}</p>
            <p className="mt-2 break-all">Link: {state.created.link}</p>
            <Link href={`/admin/affiliates/${state.created.id}`} className="mt-3 inline-block text-[#ccff00]">
              Open affiliate
            </Link>
          </div>
        ) : null}
      </form>

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
