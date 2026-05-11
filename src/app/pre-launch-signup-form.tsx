"use client";

import { useActionState } from "react";
import Image from "next/image";
import { Loader2, Sparkles } from "lucide-react";
import { submitPreLaunchSignup, type PreLaunchSignupState } from "./pre-launch-actions";

const initialState: PreLaunchSignupState = null;

export function PreLaunchSignupForm() {
  const [state, formAction, pending] = useActionState(submitPreLaunchSignup, initialState);

  return (
    <div className="mx-auto mt-8 w-full max-w-md md:mx-0 md:mt-0">
      <div className="rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.08] to-black/50 p-6 shadow-[0_24px_80px_-12px_rgba(0,0,0,0.65)] backdrop-blur-xl sm:p-8">
        <p className="text-center text-xs font-medium uppercase tracking-wider text-gray-400">
          Takes five seconds
        </p>
        <p className="mt-1 text-center text-lg font-semibold text-white">Get your spot + free e-book</p>

        <div className="mx-auto mt-4 w-full max-w-[10.5rem] sm:max-w-[11.5rem]">
          <div className="relative overflow-hidden rounded-lg shadow-md shadow-black/40 ring-1 ring-white/10">
            <Image
              src="/landingpage-bg.webp"
              alt="Core Padel Workout e-book"
              width={880}
              height={1100}
              sizes="(max-width: 640px) 168px, 184px"
              className="h-auto w-full object-contain"
            />
          </div>
        </div>

        <form action={formAction} className="mt-5 flex flex-col gap-3">
          <div className="text-left">
            <label htmlFor="prelaunch-email" className="mb-1.5 block text-xs font-medium text-gray-400">
              Work or personal email
            </label>
            <input
              id="prelaunch-email"
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              required
              placeholder="you@example.com"
              className="w-full rounded-2xl border border-white/15 bg-black/40 px-4 py-3.5 text-base text-white placeholder:text-gray-600 outline-none ring-2 ring-transparent transition-all focus:border-[#ccff00]/40 focus:ring-[#ccff00]/25"
            />
          </div>
          {state?.error ? (
            <p className="rounded-xl bg-red-500/10 px-3 py-2 text-center text-sm text-red-200" role="alert">
              {state.error}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={pending}
            className="group relative mt-1 flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-[#ccff00] px-6 py-4 text-base font-bold text-black shadow-lg shadow-[#ccff00]/20 transition-all hover:bg-[#d4ff33] hover:shadow-xl hover:shadow-[#ccff00]/25 disabled:opacity-55"
          >
            {pending ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
                Saving your spot…
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5 transition-transform group-hover:scale-110" aria-hidden />
                Join the list and send my e-book
              </>
            )}
          </button>
        </form>
        <p className="mt-4 text-center text-[11px] leading-relaxed text-gray-500">
          By joining you agree to get launch updates at this address. Unsubscribe anytime. One click, no hassle.
        </p>
      </div>
    </div>
  );
}
