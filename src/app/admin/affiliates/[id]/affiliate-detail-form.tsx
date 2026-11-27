"use client";

import { useActionState } from "react";
import { formatMoney, type AffiliateProfile } from "@/lib/affiliates/types";
import { recordPayoutAction, updateAffiliateAction } from "../actions";

export function AffiliateDetailForm({
  profile,
  balanceCents,
  currency,
}: {
  profile: AffiliateProfile;
  balanceCents: number;
  currency: string;
}) {
  const [saved, save, saving] = useActionState(updateAffiliateAction, {});
  const [paid, pay, paying] = useActionState(recordPayoutAction, {});

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <form action={save} className="rounded-2xl border border-zinc-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-zinc-950">Account and commission</h2>
        <input type="hidden" name="id" value={profile.id} />
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Name" name="display_name" defaultValue={profile.display_name} required />
          <Field label="Email" name="email" type="email" defaultValue={profile.email} required />
          <Field label="New password" name="password" placeholder="Leave blank to keep the current password" />
          <Field label="Phone" name="phone" defaultValue={profile.phone ?? ""} />
          <Field label="Instagram" name="instagram" defaultValue={profile.instagram ?? ""} />
          <Field label="YouTube" name="youtube" defaultValue={profile.youtube ?? ""} />
          <Field label="Facebook" name="facebook" defaultValue={profile.facebook ?? ""} />
          <Field label="TikTok" name="tiktok" defaultValue={profile.tiktok ?? ""} />
          <Field label="Website" name="website" defaultValue={profile.website ?? ""} />
          <label className="block text-sm text-zinc-700">
            Status
            <select
              name="status"
              defaultValue={profile.status}
              className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-950"
            >
              <option value="active">Active</option>
              <option value="paused">Paused</option>
            </select>
          </label>
          <Field
            label="Commission % for new referrals"
            name="commission_percent"
            type="number"
            defaultValue={String(profile.commission_percent)}
            min="0"
            max="100"
            step="0.01"
            required
          />
          <Field
            label="Months for new referrals"
            name="commission_months"
            type="number"
            defaultValue={String(profile.commission_months)}
            min="1"
            max="60"
            step="1"
            required
          />
        </div>
        <label className="mt-4 block text-sm text-zinc-700">
          Notes
          <textarea
            name="notes"
            rows={3}
            defaultValue={profile.notes ?? ""}
            className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-950"
          />
        </label>
        <p className="mt-3 text-sm text-zinc-500">
          Pausing stops new referral links. Customers already referred still earn through their window.
          Changing the rate applies to new visits only.
        </p>
        {saved.error ? <p className="mt-3 text-sm text-red-600">{saved.error}</p> : null}
        {saved.saved ? <p className="mt-3 text-sm text-zinc-700">Saved.</p> : null}
        <button
          type="submit"
          disabled={saving}
          className="mt-4 rounded-full bg-zinc-950 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save changes"}
        </button>
      </form>

      <form action={pay} className="h-fit rounded-2xl border border-zinc-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-zinc-950">Record payout</h2>
        <p className="mt-2 text-sm text-zinc-600">
          Unpaid balance: {formatMoney(balanceCents, currency)}. This marks that balance as paid.
        </p>
        <input type="hidden" name="id" value={profile.id} />
        <label className="mt-4 block text-sm text-zinc-700">
          Period
          <input
            name="period_label"
            placeholder="March 2026"
            className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-950"
          />
        </label>
        <label className="mt-4 block text-sm text-zinc-700">
          Note
          <input
            name="notes"
            placeholder="Bank transfer"
            className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-950"
          />
        </label>
        {paid.error ? <p className="mt-3 text-sm text-red-600">{paid.error}</p> : null}
        {paid.saved ? <p className="mt-3 text-sm text-zinc-700">Payout recorded.</p> : null}
        <button
          type="submit"
          disabled={paying || balanceCents <= 0}
          className="mt-4 w-full rounded-full bg-[#ccff00] px-4 py-2 text-sm font-semibold text-zinc-950 disabled:opacity-50"
        >
          {paying ? "Saving..." : "Mark balance paid"}
        </button>
      </form>
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
