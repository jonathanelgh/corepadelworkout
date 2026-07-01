"use client";

import { Suspense, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

import { sendLoginMagicLink, signInWithPassword } from "./actions";

type View = "login" | "forgot" | "forgot-sent" | "magic-sent";

function LoginForm() {
  const searchParams = useSearchParams();
  const emailRef = useRef<HTMLInputElement>(null);
  const [view, setView] = useState<View>("login");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const resetSuccess = searchParams.get("reset") === "1";
  const authError = searchParams.get("error");
  const nextPath = searchParams.get("next") ?? "";

  function emailFromLoginField(): string {
    return (emailRef.current?.value ?? email).trim();
  }

  async function onSubmitPassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);

    const formData = new FormData(e.currentTarget);
    const submittedEmail = String(formData.get("email") ?? "").trim();
    const submittedPassword = String(formData.get("password") ?? "");

    try {
      const result = await signInWithPassword({
        email: submittedEmail,
        password: submittedPassword,
        next: nextPath || null,
      });

      setPending(false);

      if ("error" in result) {
        setError(result.error);
      }
    } catch (err) {
      setPending(false);
      throw err;
    }
  }

  async function onSubmitMagicLink() {
    setError(null);
    const emailValue = emailFromLoginField();
    if (!emailValue) {
      setError("Enter your email address.");
      return;
    }
    setEmail(emailValue);
    setPending(true);
    const result = await sendLoginMagicLink({
      email: emailValue,
      next: searchParams.get("next"),
      origin: window.location.origin,
    });
    setPending(false);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    setView("magic-sent");
  }

  async function onSubmitForgot(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const supabase = createClient();
    const redirectTo = `${window.location.origin}/auth/recovery`;
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo,
    });
    setPending(false);
    if (resetError) {
      setError(resetError.message);
      return;
    }
    setView("forgot-sent");
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
            href="/signup"
            className="hidden rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white ring-1 ring-white/15 transition hover:bg-white/15 md:inline-flex"
          >
            Create account
          </Link>
        </header>

        <main className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-md">
            <div className="mb-8 text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#ccff00]">
                {view === "login" ? "Sign in" : "Reset password"}
              </p>
              <h1 className="mt-3 text-3xl font-medium tracking-tight md:text-4xl">
                {view === "login"
                  ? "Welcome back"
                  : view === "forgot-sent" || view === "magic-sent"
                    ? "Check your email"
                    : "Forgot password?"}
              </h1>
              <p className="mt-3 text-sm text-white/70">
                {view === "login" && "Use your account to access your programs and dashboard."}
                {view === "forgot" && "We will email you a link to reset your password."}
                {(view === "forgot-sent" || view === "magic-sent") &&
                  `If an account exists for ${email}, you will receive a link shortly.`}
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-2xl backdrop-blur-md md:p-8">
              {resetSuccess && view === "login" && (
                <div className="mb-4 rounded-2xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
                  Your password was updated. Sign in with your new password.
                </div>
              )}
              {authError && view === "login" && (
                <div className="mb-4 rounded-2xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                  {authError}
                </div>
              )}
              {error && (
                <div className="mb-4 rounded-2xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                  {error}
                </div>
              )}

              {view === "login" && (
                <form onSubmit={(e) => void onSubmitPassword(e)} className="space-y-4">
                  <div>
                    <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-white/85">
                      Email
                    </label>
                    <input
                      ref={emailRef}
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      defaultValue={email}
                      className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white placeholder:text-white/40 outline-none transition focus:border-[#ccff00]/60 focus:bg-black/40 focus:ring-2 focus:ring-[#ccff00]/25"
                      placeholder="you@club.com"
                    />
                  </div>
                  <div>
                    <div className="mb-1.5 flex items-center justify-between gap-2">
                      <label htmlFor="password" className="block text-sm font-medium text-white/85">
                        Password
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setError(null);
                          setEmail(emailFromLoginField());
                          setView("forgot");
                        }}
                        className="text-xs font-medium text-[#ccff00] hover:text-[#b3e600]"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      autoComplete="current-password"
                      required
                      className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white placeholder:text-white/40 outline-none transition focus:border-[#ccff00]/60 focus:bg-black/40 focus:ring-2 focus:ring-[#ccff00]/25"
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
                  <div className="relative py-2">
                    <div className="absolute inset-0 flex items-center" aria-hidden>
                      <div className="w-full border-t border-white/15" />
                    </div>
                    <p className="relative text-center text-xs text-white/50">or</p>
                  </div>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => void onSubmitMagicLink()}
                    className="w-full rounded-xl border border-white/20 bg-white/5 py-3.5 text-sm font-semibold text-white transition hover:bg-white/10 disabled:opacity-60"
                  >
                    {pending ? "Sending…" : "Email me a sign-in link"}
                  </button>
                  <p className="text-center text-xs text-white/50">
                    New here?{" "}
                    <Link href="/signup" className="font-medium text-white underline underline-offset-4 hover:text-white/80">
                      Create an account
                    </Link>
                  </p>
                </form>
              )}

              {view === "forgot" && (
                <form onSubmit={onSubmitForgot} className="space-y-4">
                  <div>
                    <label htmlFor="forgot-email" className="mb-1.5 block text-sm font-medium text-white/85">
                      Email
                    </label>
                    <input
                      id="forgot-email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white placeholder:text-white/40 outline-none transition focus:border-[#ccff00]/60 focus:bg-black/40 focus:ring-2 focus:ring-[#ccff00]/25"
                      placeholder="you@club.com"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={pending}
                    className="w-full rounded-xl bg-[#ccff00] py-3.5 text-sm font-semibold text-black transition hover:bg-[#b3e600] disabled:opacity-60"
                  >
                    {pending ? "Sending…" : "Send reset link"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setError(null);
                      setView("login");
                    }}
                    className="w-full text-center text-sm text-white/70 hover:text-white"
                  >
                    Back to sign in
                  </button>
                </form>
              )}

              {view === "forgot-sent" && (
                <div className="space-y-4">
                  <p className="text-sm text-white/75">
                    The reset link expires after a short time. Check spam if you do not see it in your inbox.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setError(null);
                      setView("login");
                    }}
                    className="w-full rounded-xl bg-[#ccff00] py-3.5 text-sm font-semibold text-black transition hover:bg-[#b3e600]"
                  >
                    Back to sign in
                  </button>
                </div>
              )}

              {view === "magic-sent" && (
                <div className="space-y-4">
                  <p className="text-sm text-white/75">
                    Open the link in the same browser you use for Core Padel. Check spam if it does not arrive.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setError(null);
                      setView("login");
                    }}
                    className="w-full rounded-xl bg-[#ccff00] py-3.5 text-sm font-semibold text-black transition hover:bg-[#b3e600]"
                  >
                    Back to sign in
                  </button>
                </div>
              )}

              {view === "login" && (
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
              )}
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
