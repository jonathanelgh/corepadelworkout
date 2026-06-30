"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signUpWithPassword } from "./actions";

function SignUpForm() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [verifySent, setVerifySent] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);

    const result = await signUpWithPassword({
      fullName,
      email,
      password,
      origin: window.location.origin,
    });

    setPending(false);

    if ("error" in result) {
      setError(result.error);
      return;
    }

    if (result.needsVerification) {
      setVerifySent(true);
      return;
    }

    router.push(result.redirectTo);
    router.refresh();
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
          <Link
            href="/login"
            className="hidden rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white ring-1 ring-white/15 transition hover:bg-white/15 md:inline-flex"
          >
            Sign in
          </Link>
        </header>

        <main className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-md">
            <div className="mb-8 text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#ccff00]">Create account</p>
              <h1 className="mt-3 text-3xl font-medium tracking-tight md:text-4xl">
                {verifySent ? "Check your email" : "Join Core Padel"}
              </h1>
              <p className="mt-3 text-sm text-white/70">
                {verifySent
                  ? `We sent a verification link to ${email}. After you confirm, you'll continue to onboarding.`
                  : "Sign up with your name, email, and password. You'll personalize your plan next."}
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-2xl backdrop-blur-md md:p-8">
              {error && (
                <div className="mb-4 rounded-2xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                  {error}
                </div>
              )}

              {verifySent ? (
                <div className="space-y-4">
                  <p className="text-sm text-white/75">
                    Open the link in the same browser you used to sign up. Check spam if it does not arrive within a few
                    minutes.
                  </p>
                  <Link
                    href="/login"
                    className="flex w-full items-center justify-center rounded-xl bg-[#ccff00] py-3.5 text-sm font-semibold text-black transition hover:bg-[#b3e600]"
                  >
                    Back to sign in
                  </Link>
                </div>
              ) : (
                <form onSubmit={(e) => void onSubmit(e)} className="space-y-4">
                  <div>
                    <label htmlFor="fullName" className="mb-1.5 block text-sm font-medium text-white/85">
                      Name
                    </label>
                    <input
                      id="fullName"
                      name="fullName"
                      type="text"
                      autoComplete="name"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white placeholder:text-white/40 outline-none transition focus:border-[#ccff00]/60 focus:bg-black/40 focus:ring-2 focus:ring-[#ccff00]/25"
                      placeholder="Your name"
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-white/85">
                      Email
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white placeholder:text-white/40 outline-none transition focus:border-[#ccff00]/60 focus:bg-black/40 focus:ring-2 focus:ring-[#ccff00]/25"
                      placeholder="you@club.com"
                    />
                  </div>
                  <div>
                    <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-white/85">
                      Password
                    </label>
                    <input
                      id="password"
                      name="password"
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
                  <button
                    type="submit"
                    disabled={pending}
                    className="w-full rounded-xl bg-[#ccff00] py-3.5 text-sm font-semibold text-black transition hover:bg-[#b3e600] disabled:opacity-60"
                  >
                    {pending ? "Creating account…" : "Create account"}
                  </button>
                  <p className="text-center text-xs leading-relaxed text-white/50">
                    By creating an account, you agree to our{" "}
                    <Link href="/terms" className="underline underline-offset-2 hover:text-white/70">
                      Terms &amp; Conditions
                    </Link>{" "}
                    and{" "}
                    <Link href="/privacy" className="underline underline-offset-2 hover:text-white/70">
                      Privacy Policy
                    </Link>
                    .
                  </p>
                  <p className="text-center text-sm text-white/60">
                    Already have an account?{" "}
                    <Link href="/login" className="font-medium text-white underline underline-offset-4 hover:text-white/80">
                      Sign in
                    </Link>
                  </p>
                </form>
              )}
            </div>
          </div>
        </main>

        <footer className="mt-auto pt-6 text-center text-xs text-white/45">
          <Link href="/" className="hover:text-white/70">
            Back to home
          </Link>
        </footer>
      </div>
    </div>
  );
}

export default function SignUpPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-black text-sm text-white/50">Loading…</div>
      }
    >
      <SignUpForm />
    </Suspense>
  );
}
