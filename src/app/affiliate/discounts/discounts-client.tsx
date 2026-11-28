"use client";

import { useActionState, useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { MoreHorizontal, Plus, X } from "lucide-react";
import { formatPercent, formatWhen } from "@/lib/affiliates/types";
import type { AffiliateDiscount } from "@/lib/affiliates/discounts";
import { createDiscountAction, setDiscountActiveAction } from "./actions";

export function DiscountsClient({
  discounts,
  commissionPercent,
  signupUrl,
}: {
  discounts: AffiliateDiscount[];
  commissionPercent: number;
  signupUrl: string;
}) {
  const [open, setOpen] = useState(false);
  const [menuId, setMenuId] = useState<string | null>(null);
  const [toggleState, toggle, toggling] = useActionState(setDiscountActiveAction, {});

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Discounts</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-600">
            Customers enter the code on the checkout page. The customer pays that percent less. It comes out of your {formatPercent(commissionPercent)}{" "}
            commission{commissionPercent >= 10 ? `, so a 10% code pays you ${formatPercent(commissionPercent - 10)} of the list price` : ""}.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex shrink-0 items-center gap-2 rounded-full bg-zinc-950 px-4 py-2 text-sm font-medium text-white"
        >
          <Plus className="h-4 w-4" />
          Add discount
        </button>
      </div>
      {toggleState.error ? <p className="text-sm text-red-600">{toggleState.error}</p> : null}
      <div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white">
        <table className="w-full min-w-[680px] text-left text-sm">
          <thead className="border-b border-zinc-200 text-xs uppercase tracking-wide text-zinc-500">
            <tr>
              <th className="px-4 py-3 font-medium">Code</th>
              <th className="px-4 py-3 font-medium">Discount</th>
              <th className="px-4 py-3 font-medium">You earn</th>
              <th className="px-4 py-3 font-medium">Expiry</th>
              <th className="px-4 py-3 font-medium">Uses</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {discounts.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-zinc-500">
                  No discount codes yet.
                </td>
              </tr>
            ) : (
              discounts.map((discount) => {
                const expired = Boolean(discount.expiresAt && new Date(discount.expiresAt).getTime() <= Date.now());
                const status = expired ? "Expired" : discount.active ? "Active" : "Inactive";
                return (
                  <tr key={discount.id} className="border-b border-zinc-100 last:border-0">
                    <td className="px-4 py-3">
                      <div className="font-medium">{discount.code}</div>
                      <div className="mt-1 max-w-[220px] truncate text-xs text-zinc-500">
                        {signupUrl}?promo={discount.code}
                      </div>
                    </td>
                    <td className="px-4 py-3">{formatPercent(discount.percent)}</td>
                    <td className="px-4 py-3">{formatPercent(Math.max(0, commissionPercent - discount.percent))}</td>
                    <td className="px-4 py-3">{discount.expiresAt ? formatWhen(discount.expiresAt) : "No expiry"}</td>
                    <td className="px-4 py-3">{discount.uses}</td>
                    <td className="px-4 py-3">{status}</td>
                    <td className="px-4 py-3 text-right">
                      <DiscountMenu
                        open={menuId === discount.id}
                        onToggle={() => setMenuId((current) => (current === discount.id ? null : discount.id))}
                        onClose={() => setMenuId(null)}
                        active={discount.active}
                        expired={expired}
                        pending={toggling}
                        action={toggle}
                        id={discount.id}
                      />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      {open ? <AddDiscountModal commissionPercent={commissionPercent} onClose={() => setOpen(false)} /> : null}
    </div>
  );
}

function DiscountMenu({
  open,
  onToggle,
  onClose,
  active,
  expired,
  pending,
  action,
  id,
}: {
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
  active: boolean;
  expired: boolean;
  pending: boolean;
  action: (formData: FormData) => void;
  id: string;
}) {
  const menuId = useId();
  const showActivate = !active && !expired;
  const showDeactivate = active;

  return (
    <div className="relative inline-block">
      <button
        type="button"
        aria-label="Discount actions"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={onToggle}
        className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-950"
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>
      {open ? (
        <>
        <button type="button" aria-label="Close menu" className="fixed inset-0 z-10 cursor-default" onClick={onClose} />
        <div
          id={menuId}
          role="menu"
          className="absolute right-0 z-20 mt-1 w-44 rounded-xl border border-zinc-200 bg-white py-1 text-left shadow-lg"
        >
          {showDeactivate ? (
            <form action={action}>
              <input type="hidden" name="id" value={id} />
              <input type="hidden" name="active" value="false" />
              <button
                type="submit"
                role="menuitem"
                disabled={pending}
                className="block w-full px-3 py-2 text-left text-sm hover:bg-zinc-50 disabled:opacity-60"
              >
                Make inactive
              </button>
            </form>
          ) : null}
          {showActivate ? (
            <form action={action}>
              <input type="hidden" name="id" value={id} />
              <input type="hidden" name="active" value="true" />
              <button
                type="submit"
                role="menuitem"
                disabled={pending}
                className="block w-full px-3 py-2 text-left text-sm hover:bg-zinc-50 disabled:opacity-60"
              >
                Make active
              </button>
            </form>
          ) : null}
          {!showActivate && !showDeactivate ? (
            <p className="px-3 py-2 text-sm text-zinc-500">This code has expired.</p>
          ) : null}
        </div>
        </>
      ) : null}
    </div>
  );
}

function AddDiscountModal({
  commissionPercent,
  onClose,
}: {
  commissionPercent: number;
  onClose: () => void;
}) {
  const titleId = useId();
  const [mounted, setMounted] = useState(false);
  const [code, setCode] = useState("");
  const [state, action, pending] = useActionState(createDiscountAction, {});

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (state.created) onClose();
  }, [state.created, onClose]);
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
      <button type="button" className="absolute inset-0 bg-black/50" aria-label="Close" onClick={() => !pending && onClose()} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative w-full max-w-lg rounded-t-2xl border border-zinc-200 bg-white shadow-xl sm:rounded-2xl"
      >
        <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4">
          <h2 id={titleId} className="text-lg font-semibold">Add discount</h2>
          <button type="button" onClick={onClose} disabled={pending} className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-100" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>
        <form action={action} className="space-y-4 px-5 py-5">
          <label className="block text-sm text-zinc-700">
            Code
            <div className="mt-1 flex gap-2">
              <input
                name="code"
                value={code}
                onChange={(event) => setCode(event.target.value.toUpperCase())}
                placeholder="Leave blank to generate one"
                className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm uppercase outline-none focus:border-zinc-950"
              />
              <button
                type="button"
                onClick={() => setCode(randomCode())}
                className="shrink-0 rounded-full border border-zinc-200 px-3 py-2 text-sm font-medium"
              >
                Generate
              </button>
            </div>
          </label>
          <label className="block text-sm text-zinc-700">
            Discount %
            <input
              name="percent"
              type="number"
              required
              min="1"
              max={commissionPercent}
              step="0.01"
              defaultValue="10"
              className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-950"
            />
          </label>
          <label className="block text-sm text-zinc-700">
            Expiry date
            <input
              name="expires_on"
              type="date"
              className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-950"
            />
          </label>
          <p className="text-sm text-zinc-500">Leave the date empty if the code does not expire. Maximum discount is {formatPercent(commissionPercent)}.</p>
          {state.error ? <p className="text-sm text-red-600">{state.error}</p> : null}
          <div className="flex justify-end gap-3">
            <button type="button" onClick={onClose} disabled={pending} className="rounded-full border border-zinc-200 px-4 py-2 text-sm font-medium">
              Cancel
            </button>
            <button type="submit" disabled={pending} className="rounded-full bg-zinc-950 px-4 py-2 text-sm font-medium text-white disabled:opacity-60">
              {pending ? "Creating..." : "Create discount"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

function randomCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join("");
}
