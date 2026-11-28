"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { changeAffiliatePassword } from "@/app/affiliate/actions";
import { createClient } from "@/utils/supabase/client";

export function ChangePasswordModal() {
  const router = useRouter();
  const [state, action, pending] = useActionState(changeAffiliatePassword, {});
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    if (state.saved) router.refresh();
  }, [state.saved, router]);

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 sm:items-center sm:p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="affiliate-password-title"
        className="w-full max-w-md rounded-t-2xl border border-zinc-200 bg-white p-6 shadow-xl sm:rounded-2xl"
      >
        <h2 id="affiliate-password-title" className="text-lg font-semibold text-zinc-950">
          Choose your password
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-zinc-600">
          This is your first sign-in. Choose a password only you know. You need it the next time you sign in.
        </p>
        <form action={action} className="mt-5 space-y-4">
          <label className="block text-sm text-zinc-700">
            New password
            <input
              name="password"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-950"
            />
          </label>
          <label className="block text-sm text-zinc-700">
            Confirm password
            <input
              name="confirm_password"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-950"
            />
          </label>
          {state.error ? <p className="text-sm text-red-600">{state.error}</p> : null}
          <button
            type="submit"
            disabled={pending || signingOut}
            className="w-full rounded-full bg-zinc-950 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60"
          >
            {pending ? "Saving..." : "Save password"}
          </button>
        </form>
        <button
          type="button"
          disabled={pending || signingOut}
          onClick={() => {
            setSigningOut(true);
            void createClient()
              .auth.signOut()
              .then(() => {
                router.push("/login");
                router.refresh();
              });
          }}
          className="mt-4 w-full text-center text-sm text-zinc-500 hover:text-zinc-950 disabled:opacity-60"
        >
          {signingOut ? "Signing out..." : "Sign out"}
        </button>
      </div>
    </div>
  );
}
