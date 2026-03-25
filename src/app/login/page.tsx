"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const supabase = createClient();
    const { error: signError } = await supabase.auth.signInWithPassword({ email, password });
    setPending(false);
    if (signError) {
      setError(signError.message);
      return;
    }
    const next = searchParams.get("next");
    const target =
      next && next.startsWith("/") && !next.startsWith("//")
        ? next
        : "/admin";
    router.push(target);
    router.refresh();
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-black text-white">
      {/* Background */}
      <div className="absolute inset-0">
        <img src="/elbopain-landing.webp" alt="" className="h-full w-full object-cover opacity-25" />
        <div className="absolute inset-0 bg-linear-to-b from-black/70 via-black/55 to-black/85" />
      </div>

      <div className="relative mx-auto flex min-h-screen w-full max-w-[1400px] flex-col px-6 py-10 md:px-12">
        <header className="flex items-center justify-between">
          <Link href="/" className="font-bold tracking-wider uppercase text-white">
            CORE<span className="text-[#ccff00]">PADEL</span>
          </Link>
          <Link
            href="/onboarding/apply"
            className="hidden rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white ring-1 ring-white/15 transition hover:bg-white/15 md:inline-flex"
          >
            Get Started Now
          </Link>
        </header>

        <main className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-md">
            <div className="mb-8 text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#ccff00]">Sign in</p>
              <h1 className="mt-3 text-3xl font-medium tracking-tight md:text-4xl">Welcome back</h1>
              <p className="mt-3 text-sm text-white/70">
                Use your account to access your programs and dashboard.
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-2xl backdrop-blur-md md:p-8">
          {error && (
            <div className="mb-4 rounded-2xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-100">
              {error}
            </div>
          )}
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-white/85 mb-1.5">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white placeholder:text-white/40 outline-none ring-0 transition focus:border-[#ccff00]/60 focus:bg-black/40 focus:ring-2 focus:ring-[#ccff00]/25"
                placeholder="you@club.com"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-white/85 mb-1.5">
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white placeholder:text-white/40 outline-none ring-0 transition focus:border-[#ccff00]/60 focus:bg-black/40 focus:ring-2 focus:ring-[#ccff00]/25"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              disabled={pending}
              className="w-full rounded-xl bg-[#ccff00] py-3.5 text-sm font-semibold text-black transition hover:bg-[#b3e600] disabled:opacity-60"
            >
              {pending ? "Signing in…" : "Sign in"}
            </button>
          </form>

              <div className="mt-6 flex flex-col items-center gap-2 text-center text-xs text-white/60">
                <p>
                  Want to explore first?{" "}
                  <Link href="/free-warmup" className="text-white underline underline-offset-4 hover:text-white/80">
                    Free 15-min warmup
                  </Link>
                </p>
                <p>
                  Member access?{" "}
                  <Link
                    href="/login?next=/member"
                    className="text-white underline underline-offset-4 hover:text-white/80"
                  >
                    Go to member dashboard
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </main>

        <footer className="mt-auto pt-6 text-center text-xs text-white/45">
          <p>
            <Link href="/" className="hover:text-white/70">
              Back to home
            </Link>
          </p>
        </footer>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center text-sm text-gray-500">
          Loading…
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
