"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

function ResetPasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    void supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        router.replace("/login?error=" + encodeURIComponent("Reset link expired or invalid. Request a new one."));
        return;
      }
      setCheckingSession(false);
    });
  }, [router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setPending(true);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setPending(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    await supabase.auth.signOut();
    router.push("/login?reset=1");
    router.refresh();
  }

  if (checkingSession) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-black text-white flex items-center justify-center">
        <p className="text-sm text-white/70">Verifying reset link…</p>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-black text-white">
      <div className="absolute inset-0">
        <img src="/elbopain-landing.webp" alt="" className="h-full w-full object-cover opacity-25" />
        <div className="absolute inset-0 bg-linear-to-b from-black/70 via-black/55 to-black/85" />
      </div>

      <div className="relative mx-auto flex min-h-screen w-full max-w-[1400px] flex-col px-6 py-10 md:px-12">
        <header className="flex items-center justify-between">
          <Link href="/" className="font-bold tracking-wider uppercase text-white">
            CORE<span className="text-[#ccff00]">PADEL</span>
          </Link>
        </header>

        <main className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-md">
            <div className="mb-8 text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#ccff00]">Password</p>
              <h1 className="mt-3 text-3xl font-medium tracking-tight md:text-4xl">Choose a new password</h1>
              <p className="mt-3 text-sm text-white/70">Enter a new password for your account.</p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-2xl backdrop-blur-md md:p-8">
              {error && (
                <div className="mb-4 rounded-2xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                  {error}
                </div>
              )}
              <form onSubmit={onSubmit} className="space-y-4">
                <div>
                  <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-white/85">
                    New password
                  </label>
                  <input
                    id="password"
                    type="password"
                    autoComplete="new-password"
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white placeholder:text-white/40 outline-none transition focus:border-[#ccff00]/60 focus:bg-black/40 focus:ring-2 focus:ring-[#ccff00]/25"
                    placeholder="At least 8 characters"
                  />
                </div>
                <div>
                  <label htmlFor="confirm" className="mb-1.5 block text-sm font-medium text-white/85">
                    Confirm password
                  </label>
                  <input
                    id="confirm"
                    type="password"
                    autoComplete="new-password"
                    required
                    minLength={8}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white placeholder:text-white/40 outline-none transition focus:border-[#ccff00]/60 focus:bg-black/40 focus:ring-2 focus:ring-[#ccff00]/25"
                    placeholder="Repeat password"
                  />
                </div>
                <button
                  type="submit"
                  disabled={pending}
                  className="w-full rounded-xl bg-[#ccff00] py-3.5 text-sm font-semibold text-black transition hover:bg-[#b3e600] disabled:opacity-60"
                >
                  {pending ? "Saving…" : "Update password"}
                </button>
              </form>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-black flex items-center justify-center text-sm text-white/70">
          Loading…
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
