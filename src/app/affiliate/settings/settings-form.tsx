"use client";

import { useActionState } from "react";
import type { AffiliateProfile } from "@/lib/affiliates/types";
import { updateAffiliateSettings } from "../actions";

export function AffiliateSettingsForm({ profile }: { profile: AffiliateProfile }) {
  const [state, action, pending] = useActionState(updateAffiliateSettings, {});

  return (
    <form action={action} className="rounded-2xl border border-zinc-200 bg-white p-5">
      <div className="grid gap-4">
        <Field label="Name" name="display_name" defaultValue={profile.display_name} required />
        <Field label="Phone" name="phone" defaultValue={profile.phone ?? ""} />
        <Field label="Instagram" name="instagram" defaultValue={profile.instagram ?? ""} />
        <Field label="YouTube" name="youtube" defaultValue={profile.youtube ?? ""} />
        <Field label="Facebook" name="facebook" defaultValue={profile.facebook ?? ""} />
        <Field label="TikTok" name="tiktok" defaultValue={profile.tiktok ?? ""} />
        <Field label="Website" name="website" defaultValue={profile.website ?? ""} />
      </div>
      {state.error ? <p className="mt-3 text-sm text-red-600">{state.error}</p> : null}
      {state.saved ? <p className="mt-3 text-sm text-zinc-700">Saved.</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="mt-4 rounded-full bg-zinc-950 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
      >
        {pending ? "Saving..." : "Save settings"}
      </button>
    </form>
  );
}

function Field({
  label,
  name,
  defaultValue,
  required,
}: {
  label: string;
  name: string;
  defaultValue: string;
  required?: boolean;
}) {
  return (
    <label className="block text-sm text-zinc-700">
      {label}
      <input
        name={name}
        defaultValue={defaultValue}
        required={required}
        className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-950"
      />
    </label>
  );
}
