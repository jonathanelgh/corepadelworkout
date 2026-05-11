import type { Metadata } from "next";
import Link from "next/link";
import { PreLaunchSignupForm } from "./pre-launch-signup-form";
import { Check } from "lucide-react";

export const metadata: Metadata = {
  title: "Join the waitlist (free Pro + e-book)",
  description:
    "Be first when Core Padel Workout launches. Get 6 months Pro free and our training e-book as a gift.",
  openGraph: {
    title: "Core Padel Workout | Join the waitlist",
    description: "6 months Pro free at launch + free e-book for waitlist signups.",
    url: "/",
  },
};

const benefits = [
  {
    title: "First in when we open",
    body: "One email the moment doors open. No FOMO, no checking the site every week.",
  },
  {
    title: "6 months of Pro, on us",
    body: "Everyone on the list gets half a year of Pro subscription free when we launch. No tricks, no trial cliff.",
  },
  {
    title: "Your e-book, right away",
    body: "Our training e-book hits your inbox as soon as you join, so you can start improving today.",
  },
];

export default function Home() {
  return (
    <div className="relative min-h-screen bg-black font-sans text-white selection:bg-[#ccff00] selection:text-black">
      {/* Background */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <picture className="absolute inset-0 block h-full w-full">
          <source media="(max-width: 767px)" srcSet="/hero-bg-mobile.webp" />
          <img src="/hero-bg.webp" alt="" className="h-full w-full object-cover" />
        </picture>
        <div className="absolute inset-0 bg-black/55" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/40 to-black/92" />
      </div>

      <div className="relative z-10 flex min-h-screen flex-col px-4 pb-6 pt-[max(1.5rem,env(safe-area-inset-top))] sm:px-6 sm:pb-10 sm:pt-10">
        <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center py-8 sm:py-12 lg:py-16">
          <div className="grid w-full grid-cols-1 items-start gap-10 md:grid-cols-2 md:gap-12 lg:gap-16">
            {/* Form column: left on desktop, second on mobile */}
            <div className="order-2 flex w-full justify-center md:order-1 md:justify-start md:pt-1">
              <div className="w-full max-w-md md:sticky md:top-24 md:self-start">
                <PreLaunchSignupForm />
              </div>
            </div>

            {/* Copy column: right on desktop, first on mobile */}
            <div className="order-1 flex flex-col text-center md:order-2 md:text-left">
              <h1 className="text-[1.75rem] font-semibold leading-[1.15] tracking-tight text-white sm:text-4xl sm:leading-[1.12] lg:text-[2.5rem] lg:leading-tight">
                Padel players: get stronger, faster, and injury-free.{" "}
                <span className="text-[#ccff00]">Before we open to everyone.</span>
              </h1>

              <p className="mx-auto mt-5 max-w-xl text-[15px] leading-relaxed text-gray-300 sm:text-lg md:mx-0">
                Core Padel Workout is almost live. Join the list with your email and we will ping you at launch, plus
                you lock in <span className="font-medium text-white">6 months of Pro free</span> and we send you our
                training <span className="font-medium text-white">e-book immediately</span> as a thank-you.
              </p>

              <ul className="mx-auto mt-8 max-w-xl space-y-3.5 md:mx-0">
                {benefits.map((b) => (
                  <li key={b.title} className="flex gap-3 text-left">
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#ccff00] text-black">
                      <Check className="h-3.5 w-3.5 stroke-[3]" aria-hidden />
                    </span>
                    <span>
                      <span className="font-medium text-white">{b.title}.</span>{" "}
                      <span className="text-gray-400">{b.body}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <p className="mx-auto mt-10 max-w-xl text-center text-xs leading-relaxed text-gray-500 md:mt-12">
            No spam. One list for launch news and your perks. Unsubscribe anytime. We think you will want to stay.
          </p>
        </main>

        <footer className="mx-auto mt-auto flex w-full max-w-6xl flex-col items-center gap-3 border-t border-white/10 pt-6 text-center text-[11px] text-gray-600 sm:flex-row sm:justify-between sm:pt-8">
          <span>© {new Date().getFullYear()} Core Padel Workout</span>
          <Link href="/login" className="text-gray-500 underline-offset-4 hover:text-gray-400 hover:underline">
            Team login
          </Link>
        </footer>
      </div>
    </div>
  );
}
