"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, Dumbbell, Sparkles, Target } from "lucide-react";
import { EARLY_ACCESS_OFFER, EARLY_ACCESS_PRO_MONTHS, EARLY_ACCESS_TOKEN_PARAM } from "@/lib/pre-launch/early-access";
import { PROMO_QUERY_PARAM, normalizePromoCode } from "@/lib/billing/promo-cookie";
import { signUpWithPassword } from "./actions";

const perks = [
  {
    icon: Dumbbell,
    title: "Padel-specific programs",
    text: "Smash power, agility, rehab, and year-round conditioning built for club players.",
  },
  {
    icon: Target,
    title: "Train anywhere",
    text: "Follow workouts at home, in the gym, or on court — no app store required.",
  },
  {
    icon: Sparkles,
    title: "Personalized from day one",
    text: "A short onboarding tailors recommendations to your level, goals, and any niggles.",
  },
];

const inputClassName =
  "w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20";

function SignUpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const earlyAccessToken =
    searchParams.get("offer") === EARLY_ACCESS_OFFER
      ? searchParams.get(EARLY_ACCESS_TOKEN_PARAM)?.trim() || null
      : null;
  const hasEarlyAccess = Boolean(earlyAccessToken);
  const promoCode = normalizePromoCode(searchParams.get(PROMO_QUERY_PARAM));
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
      earlyAccessToken,
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
    <div className="min-h-dvh bg-zinc-50 text-zinc-900">
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.85]"
        aria-hidden
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(204, 255, 0, 0.28), transparent), radial-gradient(ellipse 60% 40% at 100% 50%, rgba(16, 185, 129, 0.14), transparent), radial-gradient(ellipse 50% 30% at 0% 80%, rgba(16, 24, 40, 0.06), transparent)",
        }}
      />

      <div className="relative z-10 mx-auto flex min-h-dvh w-full max-w-6xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between">
          <Link href="/" className="text-lg font-bold tracking-wider uppercase text-zinc-900">
            CORE<span className="text-emerald-600">PADEL</span>
          </Link>
          <Link
            href="/login"
            className="rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 shadow-sm transition hover:bg-zinc-50"
          >
            Sign in
          </Link>
        </header>

        <main className="flex flex-1 items-center py-8 lg:py-12">
          <div className="grid w-full items-center gap-10 lg:grid-cols-2 lg:gap-16">
            <div className="hidden lg:block">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">
                Strength &amp; conditioning for padel
              </p>
              <h1 className="mt-4 text-4xl font-bold tracking-tight text-zinc-900 xl:text-5xl">
                Train smarter.
                <br />
                <span className="text-emerald-700">Play stronger.</span>
              </h1>
              <p className="mt-4 max-w-md text-base leading-relaxed text-zinc-600">
                Join club players using structured programs to move faster, hit harder, and stay injury-free.
              </p>

              <ul className="mt-8 space-y-5">
                {perks.map(({ icon: Icon, title, text }) => (
                  <li key={title} className="flex gap-4">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
                      <Icon className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="font-semibold text-zinc-900">{title}</p>
                      <p className="mt-1 text-sm leading-relaxed text-zinc-600">{text}</p>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="mt-10 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
                <img
                  src="/padel_player_footwork.webp"
                  alt="Padel player training footwork"
                  className="h-48 w-full object-cover"
                />
              </div>
            </div>

            <div className="w-full max-w-md justify-self-center lg:max-w-none">
              <div className="mb-6 text-center lg:text-left">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700 lg:hidden">
                  Create account
                </p>
                <h2 className="mt-2 text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
                  {verifySent ? "Check your email" : "Create your account"}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-zinc-600">
                  {verifySent
                    ? `We sent a verification link to ${email}. After you confirm, you'll continue to onboarding${hasEarlyAccess ? ` and your ${EARLY_ACCESS_PRO_MONTHS} months of Pro will be activated` : ""}.`
                    : hasEarlyAccess
                      ? `Use the same waitlist email to unlock ${EARLY_ACCESS_PRO_MONTHS} months of Pro free.`
                      : "Free programs are available right away. Upgrade anytime for the full library and AI Coach."}
                </p>
              </div>

              {promoCode && !verifySent && (
                <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
                  Promo <strong className="font-semibold">{promoCode}</strong> saved — it will be applied when you
                  subscribe to Pro.
                </div>
              )}

              {hasEarlyAccess && !verifySent && (
                <div className="mb-4 rounded-xl border border-[#ccff00]/50 bg-[#ccff00]/20 px-4 py-3 text-sm text-zinc-800">
                  Early-access perk: <strong className="font-semibold">{EARLY_ACCESS_PRO_MONTHS} months of Pro</strong>{" "}
                  included when you sign up with your waitlist email.
                </div>
              )}

              <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
                {error && (
                  <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                    {error}
                  </div>
                )}

                {verifySent ? (
                  <div className="space-y-4">
                    <p className="text-sm text-zinc-600">
                      Open the link in the same browser you used to sign up. Check spam if it does not arrive within a
                      few minutes.
                    </p>
                    <Link
                      href="/login"
                      className="flex w-full items-center justify-center rounded-xl bg-zinc-900 py-3.5 text-sm font-semibold text-white transition hover:bg-zinc-800"
                    >
                      Back to sign in
                    </Link>
                  </div>
                ) : (
                  <form onSubmit={(e) => void onSubmit(e)} className="space-y-4">
                    <div>
                      <label htmlFor="fullName" className="mb-1.5 block text-sm font-medium text-zinc-700">
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
                        className={inputClassName}
                        placeholder="Your name"
                      />
                    </div>
                    <div>
                      <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-zinc-700">
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
                        className={inputClassName}
                        placeholder="you@club.com"
                      />
                    </div>
                    <div>
                      <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-zinc-700">
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
                        className={inputClassName}
                        placeholder="At least 8 characters"
                      />
                    </div>

                    <ul className="space-y-2 rounded-xl bg-zinc-50 px-4 py-3 text-xs text-zinc-600">
                      {["Access free training programs", "Personalize your plan in under 2 minutes", "Works on phone, tablet, and desktop"].map(
                        (item) => (
                          <li key={item} className="flex items-center gap-2">
                            <Check className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                            {item}
                          </li>
                        )
                      )}
                    </ul>

                    <button
                      type="submit"
                      disabled={pending}
                      className="w-full rounded-xl bg-zinc-900 py-3.5 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:opacity-60"
                    >
                      {pending ? "Creating account…" : "Create account"}
                    </button>

                    <p className="text-center text-xs leading-relaxed text-zinc-500">
                      By creating an account, you agree to our{" "}
                      <Link href="/terms" className="underline underline-offset-2 hover:text-zinc-700">
                        Terms &amp; Conditions
                      </Link>{" "}
                      and{" "}
                      <Link href="/privacy" className="underline underline-offset-2 hover:text-zinc-700">
                        Privacy Policy
                      </Link>
                      .
                    </p>

                    <p className="text-center text-sm text-zinc-600">
                      Already have an account?{" "}
                      <Link href="/login" className="font-semibold text-emerald-700 hover:text-emerald-800">
                        Sign in
                      </Link>
                    </p>
                  </form>
                )}
              </div>
            </div>
          </div>
        </main>

        <footer className="pt-4 text-center text-xs text-zinc-500">
          <Link href="/" className="hover:text-zinc-700">
            ← Back to home
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
        <div className="flex min-h-dvh items-center justify-center bg-zinc-50 text-sm text-zinc-500">Loading…</div>
      }
    >
      <SignUpForm />
    </Suspense>
  );
}
