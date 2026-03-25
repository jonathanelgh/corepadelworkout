"use client";

import { ArrowRight, CheckCircle2, Star, Menu, X, Smartphone, Play, ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";
import Link from "next/link";

const heroStats = [
  { emoji: "🎯", value: "Outer elbow", text: "Pain that flares on grip & backhand" },
  { emoji: "⏱️", value: "Weeks to months", text: "Often ignored until every match hurts" },
  { emoji: "🎾", value: "Padel + tennis elbow", text: "Same overloaded tendons, new sport" },
  { emoji: "✅", value: "Load + technique", text: "What actually moves the needle" },
];

const testimonials = [
  {
    text: "I told myself it was just soreness. Six months later I could barely finish a set. The structured rehab plan finally gave me a progression I could trust, not random stretches from YouTube.",
    name: "Marcus V.",
    role: "Club player, padel 3x/week",
    rating: "5/5",
    img: "https://i.pravatar.cc/100?img=11",
  },
  {
    text: "The pain was always worst the day after league night. I thought rest would fix it. Turns out I needed the right loading and to stop muscling every volley. Back to playing without that sharp grab on the outside of my elbow.",
    name: "Elena R.",
    role: "Intermediate",
    rating: "5/5",
    img: "https://i.pravatar.cc/100?img=5",
  },
  {
    text: "I had classic tennis elbow years ago and it came back when I switched to padel. Same spot, same story. Having clear video progressions and knowing what to do on bad days kept me consistent.",
    name: "Jonas P.",
    role: "Returned from desk job + padel",
    rating: "4.9/5",
    img: "https://i.pravatar.cc/100?img=8",
  },
  {
    text: "My fear was reinjury. The program broke things into small wins: less pain with daily tasks first, then court work. I stopped guessing if I was doing too much.",
    name: "Sofia L.",
    role: "Competitive doubles",
    rating: "5/5",
    img: "https://i.pravatar.cc/100?img=9",
  },
  {
    text: "Ice and anti-inflammatories were a band-aid. What helped was fixing how I warmed up, how hard I gripped the racket, and strengthening the forearm in a way that matched padel.",
    name: "David K.",
    role: "Advanced",
    rating: "5/5",
    img: "https://i.pravatar.cc/100?img=12",
  },
  {
    text: "I almost quit the sport. The elbow program was the first thing that felt designed for racket athletes, not generic gym rehab.",
    name: "Anna M.",
    role: "New to padel, former tennis",
    rating: "4.9/5",
    img: "https://i.pravatar.cc/100?img=4",
  },
];

const faqs = [
  {
    question: "Is this tennis elbow or something else?",
    answer:
      "Many padel players feel pain on the outside of the elbow where the forearm tendons attach (often called tennis elbow or lateral epicondylopathy). Typical clues: pain with gripping the racket, backhands, serves, or the day after hard sessions.\n\nIf you have severe swelling, numbness, fever, or pain after a fall, see a clinician. This platform supports structured training and education; it does not replace medical diagnosis.",
  },
  {
    question: "Why doesn't rest fix it?",
    answer:
      "Complete rest can calm symptoms short term, but tendons often need gradual, specific loading to tolerate padel again. The problem is usually overload (volume, intensity, grip death, technique) plus tissues that lost capacity. A smart plan reduces provocative load while rebuilding strength and control.",
  },
  {
    question: "Can I still play while I rehab?",
    answer:
      "Sometimes yes, sometimes you need a short pullback. The goal is to find a dose of play and training that improves week to week instead of flaring pain after every match. Our Elbow Rehab program is built around that idea: clear progressions and modifications rather than all-or-nothing rest.",
  },
  {
    question: "Do I need a gym or special equipment?",
    answer:
      "You can start with minimal equipment (bands, light weights, or household substitutes). Some progressions use common gym items. Each exercise is shown on video so you know form and scaling options before you begin.",
  },
  {
    question: "How is this delivered?",
    answer:
      "Core Padel Workout runs in your browser. No App Store download required. Use phone, tablet, or computer, and cast to a TV if you like.",
  },
  {
    question: "What if I want everything, not just elbow rehab?",
    answer:
      "The monthly membership unlocks the full library (strength, on-court work, other programs). Many players pair elbow rehab with general conditioning once symptoms are under control.",
  },
];

export default function ElbowPainPage() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [currentStatIndex, setCurrentStatIndex] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  const [showMobileStickyCta, setShowMobileStickyCta] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY || document.documentElement.scrollTop;
      setIsScrolled(scrollPosition > 10);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    const statInterval = setInterval(() => {
      setCurrentStatIndex((prev) => (prev + 1) % heroStats.length);
    }, 2500);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      clearInterval(statInterval);
    };
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

  return (
    <div className="min-h-screen bg-white font-sans text-black selection:bg-[#ccff00] selection:text-black">
      <nav
        className={`fixed top-0 left-0 right-0 z-[90] flex items-center justify-between px-6 md:px-12 py-4 w-full transition-all duration-300 ${
          isScrolled
            ? "bg-white/90 backdrop-blur-xl [-webkit-backdrop-filter:blur(24px)] text-black shadow-sm"
            : "bg-transparent text-white"
        }`}
      >
        <div className="max-w-[1400px] mx-auto w-full flex items-center justify-between">
          <Link href="/" className="text-xl font-bold tracking-wider uppercase">
            Core Padel Workout
          </Link>
          <div className="hidden md:flex space-x-8 text-sm font-medium">
            <a href="#problem" className={`transition-colors ${isScrolled ? "hover:text-gray-600" : "hover:text-[#ccff00]"}`}>
              The problem
            </a>
            <a href="#plan" className={`transition-colors ${isScrolled ? "hover:text-gray-600" : "hover:text-[#ccff00]"}`}>
              The plan
            </a>
            <a href="#programs" className={`transition-colors ${isScrolled ? "hover:text-gray-600" : "hover:text-[#ccff00]"}`}>
              Programs
            </a>
            <a href="#pricing" className={`transition-colors ${isScrolled ? "hover:text-gray-600" : "hover:text-[#ccff00]"}`}>
              Pricing
            </a>
          </div>
          <div className="hidden items-center gap-3 md:flex">
            <Link
              href="/login"
              className={`px-4 py-2.5 rounded-full text-sm font-semibold transition-colors ${
                isScrolled
                  ? "bg-white text-black hover:bg-gray-100 border border-gray-200"
                  : "bg-black/35 text-white hover:bg-black/50 border border-white/30"
              }`}
            >
              Login
            </Link>
            <Link
              href="/onboarding/apply"
              className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-colors ${
                isScrolled ? "bg-black text-white hover:bg-gray-800" : "bg-white text-black hover:bg-gray-100"
              }`}
            >
              Start your plan
            </Link>
          </div>

          <button
            className="md:hidden p-2 -mr-2 relative z-[100]"
            onClick={() => setIsMobileMenuOpen(true)}
            aria-label="Open menu"
            style={{ cursor: "pointer", touchAction: "manipulation" }}
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </nav>

      <div
        className={`fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm transition-opacity duration-300 md:hidden ${
          isMobileMenuOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setIsMobileMenuOpen(false)}
      />

      <div
        className={`fixed top-0 right-0 bottom-0 w-[80%] max-w-sm bg-white z-[110] shadow-2xl transition-transform duration-300 ease-in-out md:hidden flex flex-col ${
          isMobileMenuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="text-xl font-bold tracking-wider uppercase text-black">Menu</div>
          <button
            className="p-2 -mr-2 text-gray-500 hover:text-black transition-colors"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-label="Close menu"
            style={{ cursor: "pointer", touchAction: "manipulation" }}
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="flex flex-col p-6 space-y-6 text-lg font-medium text-black">
          <a href="#problem" className="hover:text-gray-600 transition-colors" onClick={() => setIsMobileMenuOpen(false)}>
            The problem
          </a>
          <a href="#plan" className="hover:text-gray-600 transition-colors" onClick={() => setIsMobileMenuOpen(false)}>
            The plan
          </a>
          <a href="#programs" className="hover:text-gray-600 transition-colors" onClick={() => setIsMobileMenuOpen(false)}>
            Programs
          </a>
          <a href="#pricing" className="hover:text-gray-600 transition-colors" onClick={() => setIsMobileMenuOpen(false)}>
            Pricing
          </a>
        </div>
        <div className="mt-auto p-6 border-t border-gray-100">
          <Link
            href="/login"
            className="mb-3 block w-full border border-gray-200 bg-white px-6 py-4 rounded-full font-semibold text-black hover:bg-gray-50 transition-colors text-center"
          >
            Login
          </Link>
          <Link
            href="/onboarding/apply"
            className="block w-full bg-black text-white px-6 py-4 rounded-full font-semibold hover:bg-gray-800 transition-colors text-center"
          >
            Start your plan
          </Link>
        </div>
      </div>

      <section className="relative min-h-[100vh] md:min-h-[90vh] flex flex-col justify-end pb-24 px-6 md:px-12 text-white">
        <div className="absolute inset-0 z-0">
          <img
            src="/elbopain-landing.webp"
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/45"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent"></div>
        </div>

        <div className="relative z-10 max-w-[1400px] mx-auto w-full flex flex-col md:flex-row justify-between items-end gap-12">
          <div className="max-w-3xl">
            <div className="relative h-14 mb-6 overflow-hidden">
              {heroStats.map((stat, index) => (
                <div
                  key={index}
                  className={`absolute top-0 left-0 transition-all duration-500 ease-in-out ${
                    index === currentStatIndex ? "opacity-100 translate-y-0 z-10" : "opacity-0 translate-y-4 -z-10"
                  }`}
                >
                  <div className="text-sm text-gray-200 leading-tight">
                    <span className="font-bold text-white text-lg">{stat.value}</span>
                    <br />
                    <span className="mr-1.5">{stat.emoji}</span>
                    {stat.text}
                  </div>
                </div>
              ))}
            </div>
            <p className="text-sm font-semibold uppercase tracking-widest text-[#ccff00] mb-4">Elbow pain from padel</p>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-medium leading-[1.08] tracking-tight">
              Fix padel elbow pain — and play again without the flare-ups.
            </h1>
          </div>

          <div className="max-w-sm flex flex-col gap-8 pb-4">
            <p className="text-gray-300 text-base leading-relaxed">
              Padel rewards volume: fast rallies, hard grips, and lots of backhands. If the outside of your elbow burns, aches, or ruins the day after you play, you need a plan that calms the tendon, fixes load, and gets you back on court without the fear of reinjury.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                id="home-hero-cta"
                href="/onboarding/apply"
                className="bg-[#ccff00] text-black px-8 py-3.5 rounded-full font-semibold hover:bg-[#b3e600] transition-colors text-center"
              >
                Get your personalized plan
              </Link>
              <Link
                href="/programs/elbow-rehab"
                className="border border-white/40 bg-white/10 text-white px-8 py-3.5 rounded-full font-semibold hover:bg-white/20 transition-colors text-center"
              >
                View Elbow Rehab
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section id="problem" className="py-14 md:py-24 px-6 md:px-12 bg-zinc-950 text-white">
        <div className="max-w-[1400px] mx-auto">
          <div className="max-w-3xl mb-12 md:mb-16">
            <div className="inline-block rounded-full border border-white/15 px-5 py-1.5 text-sm font-medium text-zinc-400 mb-6">
              Pinpoint the problem
            </div>
            <h2 className="text-3xl md:text-5xl font-medium tracking-tight mb-6">
              Your elbow is not weak. It is tired of being asked to absorb the same forces, over and over, without recovery.
            </h2>
            <p className="text-zinc-400 text-lg leading-relaxed">
              Most players wait until pain becomes the main story of their week. By then, simple shots already irritate the tendon. The fix is not a single miracle stretch. It is reducing the spikes that keep reinjuring you, then rebuilding tolerance with the right progressions.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 md:gap-8">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-8">
              <h3 className="text-lg font-semibold text-white mb-3">Symptoms that sound familiar</h3>
              <ul className="space-y-3 text-zinc-400 text-sm leading-relaxed">
                <li className="flex gap-2">
                  <span className="text-[#ccff00] shrink-0">—</span>
                  Aching or sharp pain on the outside of the elbow after play
                </li>
                <li className="flex gap-2">
                  <span className="text-[#ccff00] shrink-0">—</span>
                  Grip feels heavy: kettle, coffee cup, or racket feels like a trigger
                </li>
                <li className="flex gap-2">
                  <span className="text-[#ccff00] shrink-0">—</span>
                  Backhands, extension, or serves light up the same spot
                </li>
              </ul>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-8">
              <h3 className="text-lg font-semibold text-white mb-3">What padel adds to the mix</h3>
              <ul className="space-y-3 text-zinc-400 text-sm leading-relaxed">
                <li className="flex gap-2">
                  <span className="text-[#ccff00] shrink-0">—</span>
                  High repetition rallies compared with many other racket sports
                </li>
                <li className="flex gap-2">
                  <span className="text-[#ccff00] shrink-0">—</span>
                  Death grip under pressure, especially in defense
                </li>
                <li className="flex gap-2">
                  <span className="text-[#ccff00] shrink-0">—</span>
                  Jumping back to full court time after a short break
                </li>
              </ul>
            </div>
            <div className="rounded-2xl border border-[#ccff00]/40 bg-zinc-950 p-8">
              <h3 className="text-lg font-semibold text-[#ccff00] mb-3">What actually converts</h3>
              <p className="text-zinc-200 text-sm leading-relaxed mb-4">
                A clear sequence: calm symptoms, rebuild forearm and grip capacity, then return to court volume with rules you can follow on busy weeks.
              </p>
              <Link
                href="/onboarding/apply"
                className="inline-flex items-center gap-2 text-sm font-semibold text-white hover:text-[#ccff00] transition-colors"
              >
                Tell us your situation <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section id="plan" className="py-14 md:py-24 px-6 md:px-12 bg-white text-black">
        <div className="max-w-[1400px] mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-14 md:mb-20">
            <div className="inline-block border border-gray-200 rounded-full px-5 py-1.5 text-sm font-medium mb-6 text-gray-600">
              The plan
            </div>
            <h2 className="text-3xl md:text-5xl font-medium tracking-tight mb-6">Three beats guessing with Dr. Google</h2>
            <p className="text-gray-500 text-lg leading-relaxed">
              You get structure: what to do, how hard, and how to tell if you are on track. No more random exercises on rest days that do not connect to padel.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto text-left">
            <div>
              <div className="text-4xl font-medium text-[#ccff00] mb-4">01</div>
              <h3 className="text-xl font-semibold mb-3">Reduce the flare pattern</h3>
              <p className="text-gray-600 leading-relaxed">
                Identify the loads that spike pain (grip, volume, certain shots) and swap them for tolerable training so the tendon can settle without you quitting the sport.
              </p>
            </div>
            <div>
              <div className="text-4xl font-medium text-[#ccff00] mb-4">02</div>
              <h3 className="text-xl font-semibold mb-3">Rebuild with video-led progressions</h3>
              <p className="text-gray-600 leading-relaxed">
                Follow coached demos for forearm, wrist, and shoulder patterns that support the elbow. Progress when symptoms allow, not on a random calendar.
              </p>
            </div>
            <div>
              <div className="text-4xl font-medium text-[#ccff00] mb-4">03</div>
              <h3 className="text-xl font-semibold mb-3">Return to court with confidence</h3>
              <p className="text-gray-600 leading-relaxed">
                Pair rehab with smarter warm-ups and on-court habits so you are not stuck in a loop of play, pain, rest, repeat.
              </p>
            </div>
          </div>
          <div className="mt-12 flex justify-center">
            <Link
              href="/onboarding/apply"
              className="inline-flex items-center gap-2 rounded-full bg-black px-8 py-3.5 text-sm font-semibold text-white hover:bg-gray-800 transition-colors"
            >
              Apply for access <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      <section id="programs" className="py-12 md:py-24 px-6 md:px-12 bg-[#f9f9f9] text-black text-center">
        <div className="max-w-[1400px] mx-auto">
          <div className="inline-block border border-gray-200 rounded-full px-5 py-1.5 text-sm font-medium mb-8 text-gray-600 bg-white">
            Built for painful elbows
          </div>
          <h2 className="text-4xl md:text-5xl font-medium mb-6 tracking-tight max-w-3xl mx-auto">
            Start with Elbow Rehab. Add strength and footwork when you are ready.
          </h2>
          <p className="text-gray-500 text-lg max-w-2xl mx-auto mb-16 leading-relaxed">
            The library is designed so you are not choosing between fixing pain and improving performance. You fix the bottleneck first, then stack the work that keeps you durable.
          </p>

          <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto text-left">
            <Link href="/programs/elbow-rehab" className="relative h-[500px] rounded-3xl overflow-hidden group cursor-pointer block ring-2 ring-[#ccff00] ring-offset-4 ring-offset-[#f9f9f9]">
              <img
                src="/Padel_player_elbow_202603231059.jpeg"
                alt="Elbow Rehab program for padel and tennis elbow"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent"></div>
              <div className="absolute top-6 left-6 bg-[#ccff00] text-black text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                Start here
              </div>
              <div className="absolute top-6 right-6 bg-white rounded-full p-2">
                <ArrowRight className="w-5 h-5 text-black -rotate-45" />
              </div>
              <div className="absolute bottom-8 left-8 text-white">
                <h3 className="text-2xl font-medium mb-1">Elbow Rehab</h3>
                <p className="text-gray-300 text-sm">Tendon-friendly loading, grip fixes, return-to-play guidance</p>
              </div>
            </Link>

            <Link href="/programs/smash-power" className="relative h-[500px] rounded-3xl overflow-hidden group cursor-pointer block">
              <img
                src="/Padel_player_makes_202603231105.jpeg"
                alt="Smash Power program"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
              <div className="absolute top-6 left-6 bg-white rounded-full p-2">
                <ArrowRight className="w-5 h-5 text-black -rotate-45" />
              </div>
              <div className="absolute bottom-8 left-8 text-white">
                <h3 className="text-2xl font-medium mb-1">Smash Power</h3>
                <p className="text-gray-300 text-sm">Chain strength so the elbow stops doing all the work</p>
              </div>
            </Link>

            <Link href="/programs/on-court-agility" className="relative h-[500px] rounded-3xl overflow-hidden group cursor-pointer block">
              <img
                src="/padel_player_footwork.webp"
                alt="On-court agility program"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
              <div className="absolute top-6 left-6 bg-white rounded-full p-2">
                <ArrowRight className="w-5 h-5 text-black -rotate-45" />
              </div>
              <div className="absolute bottom-8 left-8 text-white">
                <h3 className="text-2xl font-medium mb-1">On-Court Agility</h3>
                <p className="text-gray-300 text-sm">Fewer forced reaches and panic swings that overload the arm</p>
              </div>
            </Link>
          </div>

          <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/programs/elbow-rehab" className="text-black font-semibold hover:text-gray-600 transition-colors underline underline-offset-4">
              Go straight to Elbow Rehab
            </Link>
            <span className="hidden sm:inline text-gray-300">|</span>
            <Link href="/programs" className="flex items-center gap-2 text-black font-semibold hover:text-gray-600 transition-colors group">
              Browse full library
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </section>

      <section className="py-12 md:py-24 px-6 md:px-12 bg-white overflow-hidden">
        <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row items-center gap-12 md:gap-20">
          <div className="flex-1 text-center md:text-left">
            <div className="inline-block border border-gray-200 bg-[#f9f9f9] rounded-full px-5 py-1.5 text-sm font-medium mb-8 text-gray-600">
              Rehab you will actually follow
            </div>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-medium leading-[1.1] tracking-tight mb-6 text-black">
              Your sessions, on your phone, without another app install.
            </h2>
            <p className="text-gray-500 text-lg md:text-xl leading-relaxed mb-10 max-w-xl mx-auto md:mx-0">
              Open the program in the browser before training or at home. Clear video, simple progressions, and a path that respects how a sore elbow actually behaves on Monday after Sunday padel.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start mb-10">
              <Link
                href="/onboarding/apply"
                className="flex items-center justify-center gap-3 bg-black text-white px-8 py-4 rounded-full font-semibold hover:bg-gray-800 transition-colors"
              >
                <Smartphone className="w-6 h-6" />
                <span>Start on this device</span>
              </Link>
              <Link
                href="/free-warmup"
                className="flex items-center justify-center gap-3 bg-white border border-gray-200 text-black px-8 py-4 rounded-full font-semibold hover:bg-gray-50 transition-colors"
              >
                <Play className="w-6 h-6" />
                <span>Free 15-min warmup</span>
              </Link>
            </div>

            <div className="flex items-center justify-center md:justify-start gap-4">
              <div className="flex -space-x-3">
                <img src="https://i.pravatar.cc/100?img=1" alt="" className="w-10 h-10 rounded-full border-2 border-white" />
                <img src="https://i.pravatar.cc/100?img=2" alt="" className="w-10 h-10 rounded-full border-2 border-white" />
                <img src="https://i.pravatar.cc/100?img=3" alt="" className="w-10 h-10 rounded-full border-2 border-white" />
                <img src="https://i.pravatar.cc/100?img=4" alt="" className="w-10 h-10 rounded-full border-2 border-white" />
              </div>
              <div className="text-sm text-left">
                <div className="flex text-[#ccff00]">
                  <Star className="w-4 h-4 fill-current" />
                  <Star className="w-4 h-4 fill-current" />
                  <Star className="w-4 h-4 fill-current" />
                  <Star className="w-4 h-4 fill-current" />
                  <Star className="w-4 h-4 fill-current" />
                </div>
                <div className="text-gray-500 font-medium mt-0.5">Trusted by serious club players</div>
              </div>
            </div>
          </div>

          <div className="flex-1 w-full max-w-md mx-auto relative">
            <div className="absolute inset-0 bg-[#ccff00]/20 blur-[100px] rounded-full"></div>
            <img
              src="/Core Padel Workout 2-left.png"
              alt="Core Padel Workout on a phone"
              className="relative z-10 w-full h-auto drop-shadow-2xl"
            />
          </div>
        </div>
      </section>

      <section className="py-12 md:py-24 px-6 md:px-12 bg-[#f9f9f9] text-black overflow-hidden">
        <div className="max-w-[1400px] mx-auto">
          <div className="mb-16">
            <div className="inline-block border border-gray-200 rounded-full px-5 py-1.5 text-sm font-medium mb-8 text-gray-600 bg-white">
              Why we built this
            </div>
            <div className="flex flex-col md:flex-row gap-12 justify-between items-start">
              <h2 className="text-4xl md:text-5xl font-medium max-w-2xl leading-tight tracking-tight">
                Elbow pain is the silent reason players scale back padel before they want to.
              </h2>
              <p className="text-gray-600 max-w-md text-lg leading-relaxed">
                Core Padel Workout exists to give racket athletes the same quality of structure they expect for fitness and technique, applied to the stuff that hurts: tendons, load, and return to play. We care about longevity on court, not just a single hard session.
              </p>
            </div>
          </div>

          <div className="w-full h-[400px] md:h-[600px] rounded-3xl overflow-hidden mb-12">
            <img src="/Padel_coach_standing.webp" alt="Coach guiding padel training" className="w-full h-full object-cover object-center" />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl mx-auto text-center">
            {heroStats.map((stat, i) => (
              <div key={i} className="bg-white p-6 rounded-3xl flex flex-col items-center justify-center border border-gray-100">
                <div className="w-12 h-12 bg-[#f9f9f9] rounded-full flex items-center justify-center text-2xl shadow-sm mb-4">
                  {stat.emoji}
                </div>
                <div className="text-lg md:text-xl font-medium mb-2 leading-tight">{stat.value}</div>
                <div className="text-gray-500 text-xs md:text-sm font-medium uppercase tracking-wider">{stat.text}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 md:py-24 bg-white text-black text-center overflow-hidden">
        <div className="max-w-[1400px] mx-auto px-6 md:px-12 mb-16">
          <div className="inline-block border border-gray-200 rounded-full px-5 py-1.5 text-sm font-medium mb-8 text-gray-600">
            Proof from players who were stuck
          </div>
          <h2 className="text-4xl md:text-5xl font-medium tracking-tight max-w-3xl mx-auto">
            You are not dramatic for caring about a sore elbow. You are protecting your season.
          </h2>
        </div>

        <div className="relative flex overflow-x-hidden group">
          <div className="flex gap-6 animate-infinite-scroll w-max px-6">
            {[...testimonials, ...testimonials].map((testimonial, i) => (
              <div
                key={i}
                className="bg-[#f9f9f9] p-8 md:p-10 rounded-3xl flex flex-col justify-between w-[320px] md:w-[400px] shrink-0 text-left border border-gray-100"
              >
                <p className="text-gray-600 leading-relaxed mb-12 text-sm md:text-base">&ldquo;{testimonial.text}&rdquo;</p>
                <div className="flex items-center justify-between mt-auto">
                  <div className="flex items-center gap-4">
                    <img src={testimonial.img} alt="" className="w-12 h-12 rounded-full" />
                    <div>
                      <h4 className="font-medium text-sm md:text-base">{testimonial.name}</h4>
                      <p className="text-xs md:text-sm text-gray-500">{testimonial.role}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-sm font-medium">
                    {testimonial.rating} <Star className="w-4 h-4 fill-[#ffc107] text-[#ffc107]" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="absolute top-0 bottom-0 left-0 w-12 md:w-32 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none"></div>
          <div className="absolute top-0 bottom-0 right-0 w-12 md:w-32 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none"></div>
        </div>
      </section>

      <section id="pricing" className="py-12 md:py-24 px-6 md:px-12 bg-white text-black text-center flex flex-col items-center">
        <div className="max-w-[1400px] mx-auto w-full">
          <div className="inline-block border border-gray-200 rounded-full px-5 py-1.5 text-sm font-medium mb-8 text-gray-600">
            Pricing
          </div>
          <h2 className="text-4xl md:text-5xl font-medium mb-6 tracking-tight">Fix the elbow. Keep the sport.</h2>
          <p className="text-gray-500 text-lg max-w-2xl mx-auto mb-16 leading-relaxed">
            Choose the path that matches how stuck you feel. Single program if you want a focused rehab track. Membership if you want the full training ecosystem once pain is under control.
          </p>

          <div className="flex flex-col md:flex-row gap-6 max-w-4xl mx-auto text-left">
            <div className="flex-1 bg-[#f4f4f4] rounded-[2rem] p-10 flex flex-col">
              <div className="flex justify-between items-start mb-6">
                <h3 className="text-xl font-medium text-gray-600">Elbow Rehab (single)</h3>
                <Star className="w-6 h-6 text-gray-400" />
              </div>
              <div className="mb-2">
                <span className="text-5xl font-medium">€15</span>
                <span className="text-gray-500"> /program</span>
              </div>
              <p className="text-gray-500 mb-8 pb-8 border-b border-gray-200">Own the rehab track. Progress at your pace.</p>

              <div className="mb-6">
                <p className="text-sm font-medium mb-4">Best if you:</p>
                <ul className="space-y-4">
                  <li className="flex items-center gap-3 text-gray-600">
                    <CheckCircle2 className="w-5 h-5 text-black shrink-0" />
                    <span>Want a clear elbow-focused plan without a subscription</span>
                  </li>
                  <li className="flex items-center gap-3 text-gray-600">
                    <CheckCircle2 className="w-5 h-5 text-black shrink-0" />
                    <span>Prefer to add other programs later</span>
                  </li>
                  <li className="flex items-center gap-3 text-gray-600">
                    <CheckCircle2 className="w-5 h-5 text-black shrink-0" />
                    <span>Need video-led sessions you can repeat</span>
                  </li>
                </ul>
              </div>
              <Link
                href="/programs/elbow-rehab"
                className="w-full mt-auto bg-black text-white py-4 rounded-full font-semibold hover:bg-gray-800 transition-colors text-center block"
              >
                Open Elbow Rehab
              </Link>
            </div>

            <div className="flex-1 bg-[#0a0a0a] text-white rounded-[2rem] p-10 flex flex-col relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-[#ccff00] text-black text-xs font-bold px-4 py-1 rounded-bl-xl uppercase tracking-wider">
                Full access
              </div>
              <div className="flex justify-between items-start mb-6">
                <h3 className="text-xl font-medium text-gray-400">Monthly membership</h3>
                <Star className="w-6 h-6 fill-[#ccff00] text-[#ccff00]" />
              </div>
              <div className="mb-2">
                <span className="text-5xl font-medium">€14.99</span>
                <span className="text-gray-400"> /month</span>
              </div>
              <p className="text-gray-400 mb-8 pb-8 border-b border-gray-800">Everything in the library while you are a member</p>

              <div className="mb-6">
                <p className="text-sm font-medium mb-4">Best if you:</p>
                <ul className="space-y-4">
                  <li className="flex items-center gap-3 text-gray-300">
                    <CheckCircle2 className="w-5 h-5 text-[#ccff00] shrink-0" />
                    <span>Want elbow rehab plus strength, agility, and more</span>
                  </li>
                  <li className="flex items-center gap-3 text-gray-300">
                    <CheckCircle2 className="w-5 h-5 text-[#ccff00] shrink-0" />
                    <span>Like rotating programs as your elbow tolerates more</span>
                  </li>
                  <li className="flex items-center gap-3 text-gray-300">
                    <CheckCircle2 className="w-5 h-5 text-[#ccff00] shrink-0" />
                    <span>Prefer cancel-anytime flexibility</span>
                  </li>
                </ul>
              </div>
              <Link
                href="/onboarding/apply"
                className="w-full mt-auto bg-[#ccff00] text-black py-4 rounded-full font-semibold hover:bg-[#b3e600] transition-colors text-center block"
              >
                Apply for membership
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 md:py-32 px-6 md:px-12 bg-[#f9f9f9]">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-medium mb-6 tracking-tight">Questions players ask before they commit</h2>
            <p className="text-gray-500 text-lg">Straight answers about elbow pain, loading, and how Core Padel Workout fits in.</p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className={`border border-gray-200 rounded-2xl overflow-hidden transition-all duration-300 bg-white ${
                  openFaqIndex === index ? "shadow-sm" : "hover:border-gray-300"
                }`}
              >
                <button
                  className="w-full px-6 py-5 flex items-center justify-between text-left focus:outline-none"
                  onClick={() => setOpenFaqIndex(openFaqIndex === index ? null : index)}
                >
                  <span className="font-medium text-lg pr-8">{faq.question}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-gray-400 transition-transform duration-300 shrink-0 ${
                      openFaqIndex === index ? "rotate-180" : ""
                    }`}
                  />
                </button>

                <div
                  className={`px-6 overflow-hidden transition-all duration-300 ease-in-out ${
                    openFaqIndex === index ? "max-h-[560px] pb-6 opacity-100" : "max-h-0 opacity-0"
                  }`}
                >
                  <div className="text-gray-600 whitespace-pre-line leading-relaxed">{faq.answer}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative py-16 md:py-32 px-6 md:px-12 text-white text-center flex flex-col items-center justify-center">
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?q=80&w=2940&auto=format&fit=crop"
            alt="Padel court"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/65"></div>
        </div>
        <div className="relative z-10 max-w-2xl mx-auto">
          <h2 className="text-4xl md:text-6xl font-medium mb-6 tracking-tight">Stop paying for pain with every match.</h2>
          <p className="text-gray-300 text-lg mb-10 max-w-xl mx-auto leading-relaxed">
            Tell us how your elbow behaves, how often you play, and what you have already tried. We will point you to the right starting track so you can train with a plan, not hope.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href="/onboarding/apply"
              className="bg-[#ccff00] text-black px-8 py-3.5 rounded-full font-semibold hover:bg-[#b3e600] transition-colors"
            >
              Start your plan
            </Link>
            <Link
              href="/programs/elbow-rehab"
              className="bg-white text-black px-8 py-3.5 rounded-full font-semibold hover:bg-gray-100 transition-colors"
            >
              Preview Elbow Rehab
            </Link>
          </div>
        </div>
      </section>

      <div
        className={`fixed inset-x-0 bottom-0 z-[120] md:hidden transition-transform duration-300 ${
          showMobileStickyCta && !isMobileMenuOpen ? "translate-y-0" : "translate-y-full"
        }`}
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="w-full border-t border-black/10 bg-white/95 backdrop-blur">
          <Link
            href="/onboarding/apply"
            className="flex w-full items-center justify-center rounded-none bg-[#ccff00] px-5 py-3.5 text-sm font-semibold text-black hover:bg-[#b3e600] transition-colors"
          >
            Start your plan
          </Link>
        </div>
      </div>
    </div>
  );
}
