"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signUpForCourtWarmup } from "./actions";
import { COURT_WARMUP_DEST_PATH } from "@/lib/programs/court-warmup-funnel";

const inputClassName =
  "w-full rounded-xl border border-white/15 bg-black/40 px-4 py-3.5 text-sm text-white placeholder:text-white/40 outline-none transition focus:border-[#ccff00]/60 focus:ring-2 focus:ring-[#ccff00]/20";

export function CourtWarmupSignUpForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [verifySent, setVerifySent] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);

    const result = await signUpForCourtWarmup({
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

  if (verifySent) {
    return (
      <div className="space-y-4 text-center">
        <h3 className="text-xl font-semibold text-white">Check your email</h3>
        <p className="text-sm leading-relaxed text-white/70">
          We sent a confirmation link to <span className="text-white">{email}</span>. After you confirm,
          you&apos;ll land in the free court warm-up.
        </p>
        <Link
          href={`/login?next=${encodeURIComponent(COURT_WARMUP_DEST_PATH)}`}
          className="inline-flex w-full items-center justify-center rounded-full bg-white px-6 py-3.5 text-sm font-semibold text-black transition hover:bg-white/90"
        >
          Already confirmed? Sign in
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={(e) => void onSubmit(e)} className="space-y-4">
      {error && (
        <div className="rounded-xl border border-red-400/40 bg-red-500/15 px-4 py-3 text-sm text-red-100">
          {error}{" "}
          {error.toLowerCase().includes("already exists") ? (
            <Link
              href={`/login?next=${encodeURIComponent(COURT_WARMUP_DEST_PATH)}`}
              className="font-semibold underline underline-offset-2"
            >
              Sign in
            </Link>
          ) : null}
        </div>
      )}

      <div>
        <label htmlFor="warmup-email" className="mb-1.5 block text-sm font-medium text-white/80">
          Email
        </label>
        <input
          id="warmup-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputClassName}
          placeholder="you@club.com"
        />
      </div>

      <div>
        <label htmlFor="warmup-password" className="mb-1.5 block text-sm font-medium text-white/80">
          Password
        </label>
        <input
          id="warmup-password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={inputClassName}
          placeholder="At least 8 characters"
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-full bg-[#ccff00] py-3.5 text-sm font-semibold text-black transition hover:bg-[#b3e600] disabled:opacity-60"
      >
        {pending ? "Creating account…" : "Start free warm-up"}
      </button>

      <p className="text-center text-xs leading-relaxed text-white/50">
        By continuing you agree to our{" "}
        <Link href="/terms" className="underline underline-offset-2 hover:text-white/80">
          Terms
        </Link>{" "}
        and{" "}
        <Link href="/privacy" className="underline underline-offset-2 hover:text-white/80">
          Privacy Policy
        </Link>
        .
      </p>

      <p className="text-center text-sm text-white/60">
        Already have an account?{" "}
        <Link
          href={`/login?next=${encodeURIComponent(COURT_WARMUP_DEST_PATH)}`}
          className="font-semibold text-[#ccff00] hover:text-[#b3e600]"
        >
          Sign in
        </Link>
      </p>
    </form>
  );
}
