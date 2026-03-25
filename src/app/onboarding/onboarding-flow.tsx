"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  Bandage,
  BookOpen,
  Building2,
  Dumbbell,
  Flame,
  Footprints,
  HeartPulse,
  Home,
  Loader2,
  Medal,
  Repeat,
  Sparkles,
  Target,
  Timer,
  Trophy,
  Wind,
  X,
  Zap,
} from "lucide-react";
import type { OnboardingEnvironment, OnboardingGoal, OnboardingLevel, PainKey } from "@/lib/member/onboarding";
import {
  PENDING_ONBOARDING_STORAGE_KEY,
  type PendingOnboardingV1,
} from "@/lib/member/pending-onboarding";
import { createClient } from "@/utils/supabase/client";
import { completeOnboarding } from "./actions";

const STEPS = 7;

const LEVELS: {
  id: OnboardingLevel;
  title: string;
  subtitle: string;
  icon: typeof Activity;
}[] = [
  {
    id: "beginner",
    title: "Beginner",
    subtitle: "Learning the basics · playing 0–1× a week",
    icon: Activity,
  },
  {
    id: "intermediate",
    title: "Intermediate",
    subtitle: "Can sustain rallies · playing 2–3× a week",
    icon: Wind,
  },
  {
    id: "advanced",
    title: "Advanced / Pro",
    subtitle: "Tournament play · 4+ sessions a week",
    icon: Trophy,
  },
];

const PAINS: { id: PainKey; label: string; hint: string }[] = [
  { id: "padel_elbow", label: "Padel elbow", hint: "Lateral epicondylitis" },
  { id: "jumpers_knee", label: "Jumper's knee", hint: "Patellar tendonitis" },
  { id: "lower_back", label: "Lower back", hint: "Stiffness & tightness" },
  { id: "plantar_fasciitis", label: "Heel pain", hint: "Plantar fasciitis" },
  { id: "none", label: "None of these", hint: "I just want to get stronger" },
];

const GOALS: {
  id: OnboardingGoal;
  title: string;
  subtitle: string;
  icon: typeof Zap;
}[] = [
  {
    id: "injury_recovery",
    title: "Return from injury",
    subtitle: "Rebuild confidence and load after time off",
    icon: Bandage,
  },
  {
    id: "longevity",
    title: "Longevity",
    subtitle: "Play hard for years without injury",
    icon: HeartPulse,
  },
  {
    id: "speed",
    title: "Speed",
    subtitle: "Footwork & reaction time",
    icon: Footprints,
  },
  {
    id: "stamina",
    title: "Stamina",
    subtitle: "Last through long rallies and full matches",
    icon: Flame,
  },
  {
    id: "overall_fitness",
    title: "Overall fitness",
    subtitle: "Stronger, more mobile, better prepared physically",
    icon: Dumbbell,
  },
  {
    id: "match_play",
    title: "Match play",
    subtitle: "Perform better when it counts — tactics, focus, results",
    icon: Medal,
  },
  {
    id: "power",
    title: "Power",
    subtitle: "A more explosive smash",
    icon: Zap,
  },
  {
    id: "consistency",
    title: "Consistency",
    subtitle: "Show up week after week with a plan",
    icon: Repeat,
  },
  {
    id: "technique",
    title: "Technique",
    subtitle: "Cleaner shots, better positioning, smarter play",
    icon: BookOpen,
  },
];

const ENVIRONMENTS: {
  id: OnboardingEnvironment;
  title: string;
  subtitle: string;
  icon: typeof Dumbbell;
}[] = [
  {
    id: "gym",
    title: "At the gym",
    subtitle: "Weights, cables, machines",
    icon: Dumbbell,
  },
  {
    id: "home",
    title: "At home",
    subtitle: "Bodyweight or bands",
    icon: Home,
  },
  {
    id: "club",
    title: "At the club",
    subtitle: "On court before / after matches",
    icon: Building2,
  },
];

function displayClassName(extra = "") {
  return extra;
}

export function OnboardingFlow({
  initialName,
  initialEmail,
  isAuthenticated,
}: {
  initialName: string;
  initialEmail: string;
  isAuthenticated: boolean;
}) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [showPrivacyNote, setShowPrivacyNote] = useState(true);
  const [name, setName] = useState(initialName);
  const [email, setEmail] = useState(initialEmail);
  const [level, setLevel] = useState<OnboardingLevel | null>(null);
  const [pains, setPains] = useState<PainKey[]>([]);
  const [goal, setGoal] = useState<OnboardingGoal | null>(null);
  const [environments, setEnvironments] = useState<OnboardingEnvironment[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  const handleBack = useCallback(() => {
    if (submitting) return;
    if (step === 0) {
      router.back();
      return;
    }
    setStep((s) => Math.max(0, s - 1));
  }, [router, step, submitting]);

  const togglePain = useCallback((p: PainKey) => {
    if (p === "none") {
      setPains(["none"]);
      return;
    }
    setPains((prev) => {
      const withoutNone = prev.filter((x) => x !== "none");
      if (withoutNone.includes(p)) {
        return withoutNone.filter((x) => x !== p);
      }
      return [...withoutNone, p];
    });
  }, []);

  const canContinue = useMemo(() => {
    switch (step) {
      case 0:
        return true;
      case 1:
        return name.trim().length >= 1;
      case 2:
        return level !== null;
      case 3:
        return pains.length >= 1;
      case 4:
        return goal !== null;
      case 5:
        return environments.length > 0;
      case 6:
        return isAuthenticated ? true : /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
      default:
        return false;
    }
  }, [step, name, level, pains, goal, environments, email, isAuthenticated]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter" && canContinue && !submitting) {
        if (step < STEPS - 1) {
          e.preventDefault();
          setStep((s) => s + 1);
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [canContinue, step, submitting]);

  async function handleFinish() {
    if (!level || !goal || environments.length === 0 || pains.length === 0) return;
    setSubmitting(true);
    setError(null);
    setMagicLinkSent(false);

    const payload = {
      displayName: name.trim(),
      level,
      pains,
      goal,
      environments,
    };

    if (isAuthenticated) {
      const res = await completeOnboarding(payload);
      setSubmitting(false);
      if (!res.ok) {
        setError(res.message);
        return;
      }
      router.push("/member");
      router.refresh();
      return;
    }

    const trimmedEmail = email.trim();
    const pending: PendingOnboardingV1 = {
      v: 1,
      ...payload,
      signupEmail: trimmedEmail,
    };

    try {
      localStorage.setItem(PENDING_ONBOARDING_STORAGE_KEY, JSON.stringify(pending));
    } catch {
      setSubmitting(false);
      setError("Could not save your answers in this browser. Try again or use another browser.");
      return;
    }

    const supabase = createClient();
    const callback = `${window.location.origin}/auth/callback?next=${encodeURIComponent("/onboarding/apply")}`;
    const { error: magicErr } = await supabase.auth.signInWithOtp({
      email: trimmedEmail,
      options: { emailRedirectTo: callback },
    });
    setSubmitting(false);
    if (magicErr) {
      localStorage.removeItem(PENDING_ONBOARDING_STORAGE_KEY);
      setError(magicErr.message || "Could not send magic link right now.");
      return;
    }
    setMagicLinkSent(true);
  }

  return (
    <>
      <style>{`
        @keyframes onboarding-step-in {
          from { opacity: 0; transform: translateY(14px) scale(0.99); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .onboarding-animate {
          animation: onboarding-step-in 0.5s cubic-bezier(0.22, 1, 0.36, 1) both;
        }
      `}</style>

      <div className="mx-auto flex w-full max-w-xl flex-1 flex-col pb-32 sm:max-w-2xl">
        <div className="mb-6">
          <button
            type="button"
            onClick={handleBack}
            disabled={submitting}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-zinc-300 bg-white text-zinc-800 shadow-sm transition hover:border-zinc-400 hover:bg-zinc-100 disabled:pointer-events-none disabled:opacity-40"
            aria-label={step === 0 ? "Go back to previous page" : "Go to previous step"}
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
        </div>

        <div className="onboarding-animate flex flex-1 flex-col" key={step}>
          {step === 0 && (
            <>
              <h2 className={displayClassName("text-2xl font-semibold text-zinc-900 sm:text-3xl")}>
                Welcome to Core Padel onboarding
              </h2>
              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-zinc-200 bg-white/80 p-4">
                  <div className="text-sm font-semibold text-zinc-900">All programs</div>
                  <div className="mt-1 text-sm text-zinc-600">Unlock the full workout library ✅</div>
                </div>
                <div className="rounded-2xl border border-zinc-200 bg-white/80 p-4">
                  <div className="text-sm font-semibold text-zinc-900">Smart suggestions</div>
                  <div className="mt-1 text-sm text-zinc-600">What to do next, based on you 🎯</div>
                </div>
                <div className="rounded-2xl border border-zinc-200 bg-white/80 p-4">
                  <div className="text-sm font-semibold text-zinc-900">AI plans</div>
                  <div className="mt-1 text-sm text-zinc-600">Personalized plans for goals + recovery 💪</div>
                </div>
              </div>

              <div className="mt-8">
                <div className="block w-full overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/Padel_coach_standing.webp"
                    alt="Core Padel intro"
                    className="h-48 w-full object-cover sm:h-56"
                  />
                </div>
              </div>

              <p className="mt-6 text-base text-zinc-600">
                Takes about a minute — let&apos;s build your setup ✍️
              </p>
            </>
          )}

          {step === 1 && (
            <>
              <h2 className={displayClassName("text-2xl font-semibold text-zinc-900 sm:text-3xl")}>
                First up — what should we call you? 🙂
              </h2>
              <p className="mt-2 text-base text-zinc-600">
                We&apos;ll use it in the app — like: &ldquo;Ready for your smash session, {name.trim() || "…"}?&rdquo; 🎾
              </p>
              <label className="mt-8 block">
                <span className="sr-only">Your name</span>
                <div className="group relative">
                  <Sparkles className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#ccff00]/60 transition group-focus-within:text-[#ccff00]" />
                  <input
                    autoFocus
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="First name, nickname…"
                    maxLength={80}
                    className="w-full rounded-2xl border-2 border-zinc-300 bg-white py-4 pl-12 pr-4 text-lg text-zinc-900 outline-none ring-0 transition placeholder:text-zinc-400 focus:border-[#ccff00]/90"
                  />
                </div>
              </label>
            </>
          )}

          {step === 2 && (
            <>
              <h2 className={displayClassName("text-2xl font-semibold text-zinc-900 sm:text-3xl")}>
                Quick level check — where are you at? 📈
              </h2>
              <p className="mt-2 text-base text-zinc-600">
                This helps us set the right intensity (no ego, just smart training). 🧠
              </p>
              <ul className="mt-8 space-y-3">
                {LEVELS.map(({ id, title, subtitle, icon: Icon }) => {
                  const selected = level === id;
                  return (
                    <li key={id}>
                      <button
                        type="button"
                        onClick={() => setLevel(id)}
                        className={`flex w-full items-start gap-4 rounded-2xl border-2 p-4 text-left transition-all duration-200 sm:p-5 ${
                          selected
                            ? "border-[#ccff00] bg-[#ccff00]/10 shadow-[0_0_24px_-8px_rgba(204,255,0,0.35)]"
                            : "border-zinc-300 bg-white hover:border-zinc-400"
                        }`}
                      >
                        <span
                          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
                            selected ? "bg-[#ccff00] text-zinc-950" : "bg-zinc-100 text-zinc-700"
                          }`}
                        >
                          <Icon className="h-6 w-6" />
                        </span>
                        <span className="min-w-0 pt-0.5">
                          <span className="block font-semibold text-zinc-900">{title}</span>
                          <span className="mt-1 block text-sm text-zinc-600">{subtitle}</span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </>
          )}

          {step === 3 && (
            <>
              <h2 className={displayClassName("text-2xl font-semibold text-zinc-900 sm:text-3xl")}>
                Any &ldquo;padel pains&rdquo; right now? 🩹
              </h2>
              <p className="mt-2 text-base text-zinc-600">
                If you pick something here, we&apos;ll weave in a rehab-friendly block automatically. You can change this
                anytime later. ✅
              </p>
              <ul className="mt-8 flex flex-wrap gap-2">
                {PAINS.map(({ id, label, hint }) => {
                  const on = pains.includes(id);
                  return (
                    <li key={id}>
                      <button
                        type="button"
                        onClick={() => togglePain(id)}
                        className={`rounded-2xl border-2 px-4 py-3 text-left transition-all duration-200 ${
                          on
                            ? "border-[#ccff00] bg-[#ccff00]/20 text-zinc-900"
                            : "border-zinc-300 bg-white text-zinc-800 hover:border-zinc-400"
                        }`}
                      >
                        <span className="block text-sm font-semibold">{label}</span>
                        <span className="mt-0.5 block text-xs text-zinc-500">{hint}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </>
          )}

          {step === 4 && (
            <>
              <h2 className={displayClassName("text-2xl font-semibold text-zinc-900 sm:text-3xl")}>
                What do you want most right now? 🎯
              </h2>
              <p className="mt-2 text-base text-zinc-600">
                Pick your #1 focus — we&apos;ll prioritize the best program path for you. 🚀
              </p>
              <ul className="mt-8 grid gap-3 sm:grid-cols-2">
                {GOALS.map(({ id, title, subtitle, icon: Icon }) => {
                  const selected = goal === id;
                  return (
                    <li key={id} className="min-h-0">
                      <button
                        type="button"
                        onClick={() => setGoal(id)}
                        className={`flex h-full min-h-[4.75rem] w-full items-center gap-4 rounded-2xl border-2 p-4 text-left transition-all duration-200 sm:p-5 ${
                          selected
                            ? "border-emerald-400/90 bg-emerald-500/10 shadow-[0_0_28px_-10px_rgba(52,211,153,0.4)]"
                            : "border-zinc-300 bg-white hover:border-zinc-400"
                        }`}
                      >
                        <span
                          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
                            selected ? "bg-emerald-400 text-zinc-950" : "bg-zinc-100 text-zinc-700"
                          }`}
                        >
                          <Icon className="h-6 w-6" />
                        </span>
                        <span>
                          <span className="block font-semibold text-zinc-900">{title}</span>
                          <span className="mt-1 block text-sm text-zinc-600">{subtitle}</span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </>
          )}

          {step === 5 && (
            <>
              <h2 className={displayClassName("text-2xl font-semibold text-zinc-900 sm:text-3xl")}>
                Where do you usually train? 🏟️
              </h2>
              <p className="mt-2 text-base text-zinc-600">
                Pick one or more. This is just your preference — you can always train somewhere else too. 🔁
              </p>
              <p className="mt-1 text-base text-zinc-600">
                All programs include options for gym, home, and club — we&apos;ll stitch the best fit inside the program. 🧩
              </p>
              <ul className="mt-8 space-y-3">
                {ENVIRONMENTS.map(({ id, title, subtitle, icon: Icon }) => {
                  const selected = environments.includes(id);
                  return (
                    <li key={id}>
                      <button
                        type="button"
                        onClick={() =>
                          setEnvironments((prev) =>
                            prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id],
                          )
                        }
                        className={`flex w-full items-center gap-4 rounded-2xl border-2 p-4 text-left transition-all duration-200 sm:p-5 ${
                          selected
                            ? "border-[#ccff00] bg-[#ccff00]/10"
                            : "border-zinc-300 bg-white hover:border-zinc-400"
                        }`}
                      >
                        <span
                          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
                            selected ? "bg-[#ccff00] text-zinc-950" : "bg-zinc-100 text-zinc-700"
                          }`}
                        >
                          <Icon className="h-6 w-6" />
                        </span>
                        <span>
                          <span className="block font-semibold text-zinc-900">{title}</span>
                          <span className="mt-1 block text-sm text-zinc-600">{subtitle}</span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
              <div className="mt-8 flex items-start gap-3 rounded-2xl border border-zinc-300 bg-white/80 p-4 text-sm text-zinc-700">
                <Target className="mt-0.5 h-5 w-5 shrink-0 text-[#ccff00]/80" />
                <p>
                  You&apos;re all set, <span className="font-medium text-zinc-900">{name.trim() || "champion"}</span>! 🎉
                  Tap below to open your dashboard — everything will adapt to what you picked.
                </p>
              </div>
            </>
          )}

          {step === 6 && (
            <>
              <h2 className={displayClassName("text-2xl font-semibold text-zinc-900 sm:text-3xl")}>
                {isAuthenticated ? "Save your plan & head to your hub 🎾" : "Create your personal Padel training hub 🎾"}
              </h2>
              {isAuthenticated ? (
                <>
                  <p className="mt-2 text-base text-zinc-600">
                    You&apos;re signed in as <span className="font-medium text-zinc-900">{initialEmail || email}</span>.
                    Tap below to save your answers and open your dashboard.
                  </p>
                </>
              ) : (
                <>
                  <p className="mt-2 text-base text-zinc-600">
                    Enter your email and we&apos;ll create your account instantly.
                  </p>
                  <p className="mt-1 text-base text-zinc-600">
                    We&apos;ll send you a secure magic link so you can jump straight into your personalized plan — no
                    password needed.
                  </p>
                  <label className="mt-8 block">
                    <span className="mb-1.5 block text-sm font-medium text-zinc-700">Email</span>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full rounded-2xl border-2 border-zinc-300 bg-white px-4 py-4 text-lg text-zinc-900 outline-none ring-0 transition placeholder:text-zinc-400 focus:border-[#ccff00]/90"
                    />
                  </label>
                  {magicLinkSent && (
                    <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                      Magic link sent! Check your inbox 📬 — then come back here after you tap the link.
                    </p>
                  )}
                </>
              )}
            </>
          )}
        </div>

        {error && (
          <p className="mb-4 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        )}

      </div>

      {showPrivacyNote && (
        <div className="pointer-events-none fixed inset-x-0 bottom-20 z-40 px-3 sm:bottom-28 sm:px-6">
          <div className="mx-auto w-full max-w-xl rounded-xl border border-zinc-200 bg-white/95 p-3 text-sm text-zinc-700 shadow-sm backdrop-blur sm:max-w-2xl">
            <div className="pointer-events-auto flex items-start gap-3">
              <p className="flex-1">
                All your data is secure. We do not share your data with any third parties.
              </p>
              <button
                type="button"
                onClick={() => setShowPrivacyNote(false)}
                className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-zinc-300 text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-800"
                aria-label="Dismiss privacy note"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-0 pb-0 sm:px-6 sm:pb-[max(env(safe-area-inset-bottom),16px)]">
        <div className="mx-auto w-full max-w-xl rounded-none border-x-0 border-b-0 border-zinc-200/80 bg-white/95 p-3 shadow-none backdrop-blur sm:max-w-2xl sm:rounded-2xl sm:border sm:bg-white/90 sm:shadow-lg">
          <div className="pointer-events-auto flex justify-end">
            {step < STEPS - 1 ? (
              <button
                type="button"
                onClick={() => setStep((s) => s + 1)}
                disabled={!canContinue || submitting}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#ccff00] px-6 py-3.5 text-sm font-bold text-zinc-950 shadow-lg shadow-[#ccff00]/20 transition hover:bg-[#b8e600] sm:w-auto disabled:pointer-events-none disabled:opacity-40"
              >
                {step === 0 ? "Start onboarding" : "Continue"}
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => void handleFinish()}
                disabled={!canContinue || submitting || (!isAuthenticated && magicLinkSent)}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#ccff00] px-6 py-3.5 text-sm font-bold text-zinc-950 shadow-lg shadow-[#ccff00]/25 transition hover:bg-[#b8e600] sm:w-auto disabled:pointer-events-none disabled:opacity-40"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {isAuthenticated ? "Saving…" : "Sending link…"}
                  </>
                ) : (
                  <>
                    <Timer className="h-4 w-4" />
                    {isAuthenticated ? "Save & go to hub" : "Send my magic link"}
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

    </>
  );
}
