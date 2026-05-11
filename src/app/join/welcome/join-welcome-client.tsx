"use client";

import { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import confetti from "canvas-confetti";

function runWelcomeConfetti(): () => void {
  const lime = "#ccff00";
  const white = "#ffffff";
  const green = "#86efac";

  const duration = 3.5 * 1000;
  const end = Date.now() + duration;
  const colors = [lime, white, green];

  let rafId = 0;
  const frame = () => {
    confetti({
      particleCount: 2,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.65 },
      colors,
      zIndex: 99999,
    });
    confetti({
      particleCount: 2,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.65 },
      colors,
      zIndex: 99999,
    });

    if (Date.now() < end) {
      rafId = requestAnimationFrame(frame);
    }
  };
  rafId = requestAnimationFrame(frame);

  confetti({
    particleCount: 120,
    spread: 100,
    origin: { y: 0.35 },
    colors,
    zIndex: 99999,
    scalar: 1.1,
  });

  const burst = window.setInterval(() => {
    confetti({
      particleCount: 40,
      startVelocity: 25,
      spread: 360,
      ticks: 50,
      origin: {
        x: Math.random(),
        y: Math.random() * 0.4,
      },
      colors,
      zIndex: 99999,
    });
  }, 400);

  const stopBurst = window.setTimeout(() => clearInterval(burst), duration);

  return () => {
    cancelAnimationFrame(rafId);
    clearInterval(burst);
    clearTimeout(stopBurst);
  };
}

export function JoinWelcomeClient({
  isExisting,
  ebookDownloadUrl,
}: {
  isExisting: boolean;
  ebookDownloadUrl: string;
}) {
  useEffect(() => {
    return runWelcomeConfetti();
  }, []);

  return (
    <div className="relative min-h-screen bg-black font-sans text-white selection:bg-[#ccff00] selection:text-black">
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(204,255,0,0.08)_0%,_transparent_55%)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-950 via-black to-black" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen max-w-2xl flex-col px-4 py-12 pb-24 sm:px-6 sm:py-16">
        <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-[#ccff00]">
          {isExisting ? "Already on the list" : "You are in"}
        </p>
        <h1 className="mt-4 text-center text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
          {isExisting ? "Welcome back. You are all set." : "Thank you for joining us."}
        </h1>
        <p className="mx-auto mt-5 max-w-lg text-center text-base leading-relaxed text-gray-400 sm:text-lg">
          {isExisting
            ? "This email was already on the founding list. Your perks still stand. Check your inbox for the e-book link from when you first signed up."
            : "We saved your spot. You should get a welcome email in a moment with your free e-book. When we launch, we will email you right away so you can claim your 6 months of Pro."}
        </p>

        {ebookDownloadUrl ? (
          <a
            href={ebookDownloadUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mx-auto mt-8 inline-flex items-center justify-center rounded-2xl bg-[#ccff00] px-8 py-4 text-sm font-bold text-black transition-colors hover:bg-[#d4ff33]"
          >
            Open your e-book (PDF)
          </a>
        ) : null}

        <div className="mt-14 rounded-3xl border border-white/10 bg-white/[0.04] p-6 sm:p-8">
          <h2 className="text-lg font-semibold text-white sm:text-xl">What is Core Padel Workout?</h2>
          <p className="mt-3 text-sm leading-relaxed text-gray-400 sm:text-base">
            We build strength, conditioning, and rehab programs made for padel players. Train in the gym, at home, or
            on the court with clear sessions, video demos, and progress you can feel in matches.
          </p>
          <p className="mt-4 text-sm leading-relaxed text-gray-400 sm:text-base">
            Soon you will unlock full programs (think smash power, elbow rehab, on-court agility) in one place, with a
            mobile experience built for quick sessions between work and club nights.
          </p>
        </div>

        <div className="mt-12">
          <p className="text-center text-xs font-medium uppercase tracking-wider text-gray-500">Coming soon</p>
          <p className="mt-1 text-center text-sm font-semibold text-white">Train from your phone</p>
          <p className="mx-auto mt-2 max-w-md text-center text-xs text-gray-500">
            The Core Padel Workout app is on the way. Here is a first look at how your programs and sessions will live
            in your pocket.
          </p>
          <div className="relative mx-auto mt-8 max-w-sm">
            <div className="pointer-events-none absolute inset-0 bg-[#ccff00]/15 blur-[60px]" aria-hidden />
            <Image
              src="/Core Padel Workout 2-left.png"
              alt="Preview of the Core Padel Workout mobile app"
              width={900}
              height={1200}
              sizes="(max-width: 640px) 100vw, 24rem"
              className="relative z-[1] h-auto w-full drop-shadow-2xl"
              priority
            />
          </div>
        </div>

        <div className="mt-14 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link
            href="/"
            className="inline-flex w-full items-center justify-center rounded-2xl border border-white/20 bg-white/5 px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-white/10 sm:w-auto"
          >
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
