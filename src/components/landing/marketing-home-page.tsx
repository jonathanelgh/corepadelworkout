"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Check, Menu, Volume2, VolumeX, X } from "lucide-react";
import { BrandWordmark } from "@/components/brand/brand-wordmark";
import { SiteFooter } from "@/components/landing/site-footer";

export type FeaturedProgram = {
  slug: string;
  title: string;
  description: string;
  image: string;
  meta: string[];
};

export type WorkoutPreview = {
  title: string;
  posterUrl: string;
  videoUrl: string;
};

const TRIAL_HREF = "/signup";
const TRIAL_TERMS =
  "€0 today, then €19.99/month unless you cancel before the trial ends.";

const steps = [
  {
    title: "Pick a training goal",
    body: "Build strength, work on your conditioning, or fit in short sessions during a busy week.",
  },
  {
    title: "Follow the workout",
    body: "Watch the exercise demos and follow the session at home, at the gym, or on court, depending on the program.",
  },
  {
    title: "Track your sessions",
    body: "See what you’ve completed and pick up where you left off.",
  },
];

function TrialButton({
  placement,
  id,
  className,
}: {
  placement: "header" | "hero" | "coach" | "pricing" | "closing" | "sticky";
  id?: string;
  className?: string;
}) {
  return (
    <Link
      id={id}
      href={TRIAL_HREF}
      data-cta="trial"
      data-placement={placement}
      className={
        className ??
        "inline-flex items-center justify-center rounded-full bg-[#ccff00] px-5 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-[#b3e600]"
      }
    >
      Start your 7-day free trial
    </Link>
  );
}

function TrialTerms({ className = "" }: { className?: string }) {
  return <p className={`text-sm leading-relaxed text-gray-500 ${className}`}>{TRIAL_TERMS}</p>;
}

function WorkoutFrame({ preview }: { preview: WorkoutPreview }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(false);

  function syncSound() {
    const video = videoRef.current;
    if (!video) return;
    setMuted(video.muted || video.volume === 0);
  }

  function toggleSound() {
    const video = videoRef.current;
    if (!video) return;
    const turnOn = video.muted || video.volume === 0;
    video.muted = !turnOn;
    if (turnOn) video.volume = 1;
    setMuted(!turnOn);
  }

  return (
    <figure className="overflow-hidden rounded-3xl border border-white/10 bg-black shadow-2xl">
      <div className="relative">
        <video
          ref={videoRef}
          className="aspect-video w-full bg-black object-cover"
          poster={preview.posterUrl}
          controls
          playsInline
          preload="metadata"
          onVolumeChange={syncSound}
          onLoadedMetadata={syncSound}
        >
          <source src={preview.videoUrl} type="video/mp4" />
        </video>
        <button
          type="button"
          onClick={toggleSound}
          className="absolute top-3 right-3 z-10 inline-flex items-center gap-1.5 rounded-full bg-black/70 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-sm hover:bg-black/80"
          aria-label={muted ? "Turn sound on" : "Turn sound off"}
        >
          {muted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
          {muted ? "Sound off" : "Sound on"}
        </button>
      </div>
      <figcaption className="flex items-center justify-between gap-3 px-4 py-3 text-left">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#ccff00]">Session</p>
          <p className="mt-1 text-sm font-medium text-white">{preview.title}</p>
        </div>
        <p className="shrink-0 text-xs text-white/60">Video demo</p>
      </figcaption>
    </figure>
  );
}

export function MarketingHomePage({
  featuredPrograms,
  workoutPreview,
  signedIn = false,
}: {
  featuredPrograms: FeaturedProgram[];
  workoutPreview: WorkoutPreview | null;
  signedIn?: boolean;
}) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showMobileStickyCta, setShowMobileStickyCta] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY || document.documentElement.scrollTop;
      setIsScrolled(scrollPosition > 10);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const heroCta = document.getElementById("home-hero-cta");
    if (!heroCta) return;

    const mql = window.matchMedia("(max-width: 767px)");
    let isMobile = mql.matches;
    let heroInView = true;

    function update() {
      setShowMobileStickyCta(isMobile && !heroInView);
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        heroInView = Boolean(entry?.isIntersecting);
        update();
      },
      { threshold: 0.2 }
    );
    observer.observe(heroCta);

    const onMqlChange = (e: MediaQueryListEvent) => {
      isMobile = e.matches;
      update();
    };
    if (typeof mql.addEventListener === "function") mql.addEventListener("change", onMqlChange);
    else mql.addListener(onMqlChange);
    update();

    return () => {
      observer.disconnect();
      if (typeof mql.removeEventListener === "function") mql.removeEventListener("change", onMqlChange);
      else mql.removeListener(onMqlChange);
    };
  }, []);

  const navLinkClass = isScrolled ? "hover:text-gray-600" : "hover:text-[#ccff00]";

  return (
    <div className="min-h-screen bg-white font-sans text-black selection:bg-[#ccff00] selection:text-black">
      <nav
        className={`fixed top-0 right-0 left-0 z-[90] w-full px-6 py-4 transition-all duration-300 md:px-12 ${
          isScrolled
            ? "bg-white/90 text-black shadow-sm backdrop-blur-xl [-webkit-backdrop-filter:blur(24px)]"
            : "bg-transparent text-white"
        }`}
      >
        <div className="mx-auto flex w-full max-w-[1400px] items-center justify-between gap-4">
          <Link href="/" className="inline-flex" aria-label="CorePadel">
            <BrandWordmark tone={isScrolled ? "onLight" : "onDark"} />
          </Link>
          <div className="hidden items-center gap-8 text-sm font-medium md:flex">
            <a href="#how-it-works" className={`transition-colors ${navLinkClass}`}>
              How it works
            </a>
            <a href="#programs" className={`transition-colors ${navLinkClass}`}>
              Programs
            </a>
            <a href="#pricing" className={`transition-colors ${navLinkClass}`}>
              Pricing
            </a>
          </div>
          <div className="hidden items-center gap-3 md:flex">
            <Link
              href={signedIn ? "/member" : "/login"}
              className={`text-sm font-medium transition-colors ${navLinkClass}`}
            >
              {signedIn ? "Go to app" : "Log in"}
            </Link>
            <TrialButton placement="header" />
          </div>
          <button
            className="relative z-[100] -mr-2 p-2 md:hidden"
            onClick={() => setIsMobileMenuOpen(true)}
            aria-label="Open menu"
            type="button"
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>
      </nav>

      <div
        className={`fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm transition-opacity duration-300 md:hidden ${
          isMobileMenuOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={() => setIsMobileMenuOpen(false)}
      />
      <div
        className={`fixed top-0 right-0 bottom-0 z-[110] flex w-[80%] max-w-sm flex-col bg-white shadow-2xl transition-transform duration-300 ease-in-out md:hidden ${
          isMobileMenuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-gray-100 p-6">
          <BrandWordmark />
          <button
            className="-mr-2 p-2 text-gray-500 transition-colors hover:text-black"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-label="Close menu"
            type="button"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        <div className="flex flex-col space-y-6 p-6 text-lg font-medium text-black">
          <a href="#how-it-works" onClick={() => setIsMobileMenuOpen(false)}>
            How it works
          </a>
          <a href="#programs" onClick={() => setIsMobileMenuOpen(false)}>
            Programs
          </a>
          <a href="#pricing" onClick={() => setIsMobileMenuOpen(false)}>
            Pricing
          </a>
          <Link href={signedIn ? "/member" : "/login"} onClick={() => setIsMobileMenuOpen(false)}>
            {signedIn ? "Go to app" : "Log in"}
          </Link>
        </div>
      </div>

      <section className="relative flex h-[100vh] flex-col overflow-hidden px-6 pt-20 pb-0 text-white md:px-12 lg:block lg:h-auto lg:pt-28 lg:pb-20">
        <div className="absolute inset-0 z-0">
          <picture className="absolute inset-0 h-full w-full">
            <source media="(max-width: 767px)" srcSet="/hero-bg-mobile.webp" />
            <img src="/hero-bg.webp" alt="" className="h-full w-full object-cover" />
          </picture>
          <div className="absolute inset-0 bg-black/65" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/55 to-black/35" />
        </div>

        <div className="relative z-10 mx-auto mt-auto flex w-full max-w-[1400px] flex-col gap-8 lg:mt-0 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(280px,460px)] lg:items-center lg:gap-16">
          <div className="mx-auto w-full max-w-xl text-center lg:mx-0 lg:text-left">
            <h1 className="text-4xl leading-[1.08] font-medium tracking-tight sm:text-5xl lg:text-6xl">
              Move quicker. Stay strong through the last set.
            </h1>
            <p className="mt-5 text-base leading-relaxed text-gray-200 sm:text-lg">
              Strength and conditioning for padel players. Follow video-guided workouts to build the
              strength and fitness you need for quick changes of direction, overhead shots, and long
              rallies.
            </p>
            <div className="mt-8">
              <TrialButton
                id="home-hero-cta"
                placement="hero"
                className="inline-flex w-full items-center justify-center rounded-full bg-[#ccff00] px-8 py-3.5 text-base font-semibold text-black transition-colors hover:bg-[#b3e600] sm:w-auto"
              />
            </div>
          </div>

          <div className="relative mx-auto aspect-[519/768] w-full max-w-[320px] overflow-hidden lg:aspect-auto lg:max-w-none lg:overflow-visible">
            <picture>
              <source media="(min-width: 1024px)" srcSet="/hero-session.webp" />
              <img
                src="/hero-session-portrait.webp"
                alt="CorePadel on a phone, showing Padel Power Base and the next workout"
                className="absolute inset-x-0 top-0 h-auto w-full object-contain object-top drop-shadow-2xl lg:static"
              />
            </picture>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="scroll-mt-24 bg-white px-6 py-16 md:px-12 md:py-24">
        <div className="mx-auto grid w-full max-w-[1400px] items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <h2 className="text-3xl font-medium tracking-tight sm:text-4xl md:text-5xl">
              Know what to train between matches.
            </h2>
            <p className="mt-4 max-w-xl text-lg leading-relaxed text-gray-500">
              Pick a program that fits your game and follow each session from your phone, tablet, or
              computer.
            </p>
            <ol className="mt-10 space-y-6">
              {steps.map((step, index) => (
                <li key={step.title} className="flex gap-4">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#ccff00] text-sm font-semibold text-black">
                    {index + 1}
                  </span>
                  <div>
                    <h3 className="text-lg font-medium">{step.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-gray-600">{step.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
          {workoutPreview ? <WorkoutFrame preview={workoutPreview} /> : null}
        </div>
      </section>

      <section className="bg-white px-6 py-16 md:px-12 md:py-24">
        <div className="mx-auto grid w-full max-w-[1400px] items-start gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">
              CorePadel AI Coach
            </p>
            <h2 className="mt-3 text-3xl font-medium tracking-tight sm:text-4xl md:text-5xl">
              A padel training plan built around you.
            </h2>
            <p className="mt-4 max-w-xl text-lg leading-relaxed text-gray-500">
              Tell us what you want to improve and where you train. The CorePadel AI Coach builds a
              program around your goal using exercises created by our padel training experts.
            </p>
            <ol className="mt-10 space-y-6">
              <li className="flex gap-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#ccff00] text-sm font-semibold text-black">
                  1
                </span>
                <div>
                  <h3 className="text-lg font-medium">Choose your goal</h3>
                  <p className="mt-1 text-sm leading-relaxed text-gray-600">
                    Build strength for overhead shots, get quicker around the court, or improve your
                    endurance for longer rallies.
                  </p>
                </div>
              </li>
              <li className="flex gap-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#ccff00] text-sm font-semibold text-black">
                  2
                </span>
                <div>
                  <h3 className="text-lg font-medium">Choose where you train</h3>
                  <p className="mt-1 text-sm leading-relaxed text-gray-600">
                    At home, in the gym, or on the padel court. Your program is built around the
                    setting you choose.
                  </p>
                </div>
              </li>
              <li className="flex gap-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#ccff00] text-sm font-semibold text-black">
                  3
                </span>
                <div>
                  <h3 className="text-lg font-medium">Get your personal program</h3>
                  <p className="mt-1 text-sm leading-relaxed text-gray-600">
                    The AI Coach uses guidance from our experts to put together your sessions. Follow
                    the exercise videos and track your progress as you train.
                  </p>
                </div>
              </li>
            </ol>
            <div className="mt-10 hidden lg:block">
              <TrialButton
                placement="coach"
                className="inline-flex items-center justify-center rounded-full bg-[#ccff00] px-8 py-3.5 text-base font-semibold text-black transition-colors hover:bg-[#b3e600]"
              />
              <TrialTerms className="mt-3 max-w-md" />
            </div>
          </div>

          <img
            src="/ai-coach-plan.webp"
            alt="Build your plan by choosing a training goal and where you train. An example week includes lower-body strength, lateral movement, and acceleration and braking."
            className="h-auto w-full rounded-3xl"
          />

          <div className="lg:hidden">
            <TrialButton
              placement="coach"
              className="inline-flex w-full items-center justify-center rounded-full bg-[#ccff00] px-8 py-3.5 text-base font-semibold text-black transition-colors hover:bg-[#b3e600]"
            />
            <TrialTerms className="mt-3" />
          </div>
        </div>
      </section>

      <section id="programs" className="scroll-mt-24 bg-[#f7f7f5] px-6 py-16 md:px-12 md:py-24">
        <div className="mx-auto w-full max-w-[1400px]">
          <h2 className="text-3xl font-medium tracking-tight sm:text-4xl md:text-5xl">
            Find a program that fits your game.
          </h2>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-gray-500">
            Choose what you want to work on and see how each program fits into your week.
          </p>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {featuredPrograms.map((program) => (
              <article key={program.slug} className="flex flex-col overflow-hidden rounded-3xl bg-white shadow-sm">
                <img src={program.image} alt="" className="h-52 w-full object-cover" />
                <div className="flex flex-1 flex-col p-6">
                  <h3 className="text-xl font-medium">{program.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-gray-600">{program.description}</p>
                  {program.meta.length > 0 && (
                    <ul className="mt-4 flex flex-wrap gap-2">
                      {program.meta.map((item) => (
                        <li
                          key={item}
                          className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700"
                        >
                          {item}
                        </li>
                      ))}
                    </ul>
                  )}
                  <Link
                    href={`/programs/${program.slug}`}
                    className="mt-6 text-sm font-semibold text-black underline-offset-4 hover:underline"
                  >
                    View program
                  </Link>
                </div>
              </article>
            ))}
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
            <Link href="/programs" className="text-sm font-semibold text-black underline-offset-4 hover:underline">
              Browse all programs
            </Link>
            <Link
              href="/programs?category=Recovery"
              className="text-sm font-medium text-gray-600 underline-offset-4 hover:text-black hover:underline"
            >
              Explore comeback programs
            </Link>
          </div>
        </div>
      </section>

      <section id="pricing" className="scroll-mt-24 bg-white px-6 py-16 md:px-12 md:py-24">
        <div className="mx-auto w-full max-w-5xl lg:text-center">
          <h2 className="text-3xl font-medium tracking-tight sm:text-4xl md:text-5xl">
            Try CorePadel Pro free for 7 days.
          </h2>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-gray-500 lg:mx-auto">
            Get full access to the training library and try a program that fits your game.
          </p>

          <div className="mt-10 max-w-xl lg:mx-auto lg:text-left">
            <article className="flex flex-col rounded-[2rem] bg-[#0a0a0a] p-8 text-white md:p-10">
              <h3 className="text-xl font-medium">CorePadel Pro</h3>
              <p className="mt-6 text-4xl font-medium">7 days free</p>
              <p className="mt-1 text-gray-400">Then €19.99/month</p>
              <ul className="mt-8 space-y-3 text-sm text-gray-200">
                {[
                  "Full access to the program library",
                  "Video-guided workouts and session tracking",
                  "AI Coach for personalized routines",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#ccff00]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-8">
                <TrialButton
                  placement="pricing"
                  className="inline-flex w-full items-center justify-center rounded-full bg-[#ccff00] px-8 py-3.5 text-base font-semibold text-black transition-colors hover:bg-[#b3e600]"
                />
                <p className="mt-3 text-sm leading-relaxed text-gray-400">{TRIAL_TERMS}</p>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section className="bg-white px-6 pb-16 md:px-12 md:pb-24">
        <div className="mx-auto w-full max-w-3xl">
          <h2 className="text-3xl font-medium tracking-tight sm:text-4xl">Questions</h2>
          <div className="mt-8 divide-y divide-gray-200 border-y border-gray-200">
            <details className="group py-4">
              <summary className="cursor-pointer list-none text-lg font-medium [&::-webkit-details-marker]:hidden">
                How does the 7-day free trial work?
              </summary>
              <p className="mt-3 leading-relaxed text-gray-600">
                You’ll enter your payment details when you sign up and get full Pro access for 7 days.
                Your first €19.99 payment is charged when your trial ends, then monthly after that. Cancel
                before the trial ends to avoid the first charge.
              </p>
            </details>
            <details className="group py-4">
              <summary className="cursor-pointer list-none text-lg font-medium [&::-webkit-details-marker]:hidden">
                Can I cancel my subscription?
              </summary>
              <p className="mt-3 leading-relaxed text-gray-600">
                Yes. You can cancel anytime. Cancel before the end of your 7-day trial to avoid being
                charged.
              </p>
            </details>
            <details className="group py-4">
              <summary className="cursor-pointer list-none text-lg font-medium [&::-webkit-details-marker]:hidden">
                Can I try a workout before starting a trial?
              </summary>
              <p className="mt-3 leading-relaxed text-gray-600">
                No. You need a CorePadel Pro subscription to use the workouts. You can start with a
                7-day trial and cancel before it ends to avoid being charged.
              </p>
            </details>
            <details className="group py-4">
              <summary className="cursor-pointer list-none text-lg font-medium [&::-webkit-details-marker]:hidden">
                Do I need gym equipment?
              </summary>
              <p className="mt-3 leading-relaxed text-gray-600">
                Some workouts require no equipment. Others use standard gym equipment. Check the program
                details to see what you’ll need.
              </p>
            </details>
            <details className="group py-4">
              <summary className="cursor-pointer list-none text-lg font-medium [&::-webkit-details-marker]:hidden">
                Is CorePadel suitable for beginners?
              </summary>
              <p className="mt-3 leading-relaxed text-gray-600">
                Yes. Choose a beginner-friendly program and use the video demos to follow each exercise at
                your own pace.
              </p>
            </details>
            <details className="group py-4">
              <summary className="cursor-pointer list-none text-lg font-medium [&::-webkit-details-marker]:hidden">
                Do I need to download an app?
              </summary>
              <p className="mt-3 leading-relaxed text-gray-600">
                You can use CorePadel in your browser on a phone, tablet, or computer.
              </p>
            </details>
          </div>
        </div>
      </section>

      <section className="relative px-6 py-16 text-white md:px-12 md:py-24">
        <div className="absolute inset-0 z-0">
          <img src="/hero-bg.webp" alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-black/70" />
        </div>
        <div className="relative z-10 mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-medium tracking-tight sm:text-4xl md:text-5xl">
            Start training for your next match.
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-gray-200">
            Pick your first program and follow it free for 7 days with CorePadel Pro.
          </p>
          <div className="mt-8">
            <TrialButton
              placement="closing"
              className="inline-flex w-full items-center justify-center rounded-full bg-[#ccff00] px-8 py-3.5 text-base font-semibold text-black transition-colors hover:bg-[#b3e600] sm:w-auto"
            />
            <p className="mt-3 text-sm leading-relaxed text-gray-300">{TRIAL_TERMS}</p>
          </div>
        </div>
      </section>

      <SiteFooter />

      <div
        className={`fixed inset-x-0 bottom-0 z-[120] transition-transform duration-300 md:hidden ${
          showMobileStickyCta && !isMobileMenuOpen ? "translate-y-0" : "translate-y-full"
        }`}
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="border-t border-black/10 bg-white/95 p-3 backdrop-blur">
          <TrialButton
            placement="sticky"
            className="flex w-full items-center justify-center rounded-xl bg-[#ccff00] px-5 py-3.5 text-sm font-semibold text-black transition-colors hover:bg-[#b3e600]"
          />
        </div>
      </div>
    </div>
  );
}
