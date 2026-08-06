import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, Clock3, Flame, Shield } from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import { fetchProgramExercises } from "@/lib/programs/program-exercises";
import {
  COURT_WARMUP_DEST_PATH,
  COURT_WARMUP_PROGRAM_SLUG,
} from "@/lib/programs/court-warmup-funnel";
import { CourtWarmupSignUpForm } from "./signup-form";

export const dynamic = "force-dynamic";

const FALLBACK_COVER = "/padel_player_footwork.webp";

const FALLBACK_OUTCOMES = [
  "Less chance of injury",
  "Full body warm-up",
  "Activated nervous system for faster reactions",
  "Better recovery after the match/training",
];

export const metadata: Metadata = {
  title: "Free Court Warm-up",
  description:
    "Start your padel match ready — free 7-minute dynamic court warm-up. Create an account with email and password to unlock it instantly.",
  openGraph: {
    title: "Free Court Warm-up · Core Padel",
    description:
      "A free 7-minute dynamic court warm-up to raise heart rate, open up mobility, and prep your nervous system before you play.",
    url: "/court-warm-up",
  },
};

function normalizeOutcomes(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v
    .filter((x): x is string => typeof x === "string")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

export default async function CourtWarmupLandingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isSignedIn = Boolean(user);

  const { data: program } = await supabase
    .from("programs")
    .select(
      "id, title, description, body, cover_image_url, minutes_per_session, outcomes, is_free, status"
    )
    .eq("slug", COURT_WARMUP_PROGRAM_SLUG)
    .eq("status", "published")
    .maybeSingle();

  const title = (program?.title as string | undefined) || "Court warm-up dynamic";
  const description =
    (program?.description as string | null | undefined)?.trim() ||
    "Start your padel match or training with a full body warm-up.";
  const body =
    (program?.body as string | null | undefined)?.trim() ||
    "Prepare your body for fast movements, explosive actions, and injury-free performance with this dynamic court warm-up.";
  const cover = (program?.cover_image_url as string | null | undefined)?.trim() || FALLBACK_COVER;
  const minutes =
    typeof program?.minutes_per_session === "number" && program.minutes_per_session > 0
      ? program.minutes_per_session
      : 7;
  const outcomes = normalizeOutcomes(program?.outcomes).length
    ? normalizeOutcomes(program?.outcomes)
    : FALLBACK_OUTCOMES;

  const exercises =
    program?.id != null ? await fetchProgramExercises(supabase, program.id as string) : [];

  return (
    <div className="min-h-dvh bg-[#070807] text-white">
      <header className="absolute inset-x-0 top-0 z-20">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
          <Link href="/" className="text-sm font-bold uppercase tracking-[0.22em]">
            Core<span className="text-[#ccff00]">Padel</span>
          </Link>
          <Link
            href={
              isSignedIn
                ? COURT_WARMUP_DEST_PATH
                : `/login?next=${encodeURIComponent(COURT_WARMUP_DEST_PATH)}`
            }
            className="rounded-full border border-white/20 px-4 py-2 text-sm font-medium text-white/90 transition hover:border-white/40 hover:bg-white/5"
          >
            {isSignedIn ? "Open warm-up" : "Sign in"}
          </Link>
        </div>
      </header>

      <main>
        <section className="relative min-h-[100svh] overflow-hidden">
          <img
            src={cover}
            alt=""
            className="absolute inset-0 h-full w-full object-cover object-center"
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(180deg, rgba(7,8,7,0.55) 0%, rgba(7,8,7,0.35) 35%, rgba(7,8,7,0.82) 72%, #070807 100%), radial-gradient(ellipse 70% 50% at 70% 20%, rgba(204,255,0,0.18), transparent)",
            }}
          />

          <div className="relative z-10 mx-auto flex min-h-[100svh] max-w-6xl flex-col justify-end px-5 pb-16 pt-28 sm:px-8 sm:pb-20 lg:justify-center lg:pb-24">
            <div className="grid items-end gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:gap-14">
              <div className="max-w-xl">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#ccff00]">
                  Free · {minutes} min · On court
                </p>
                <h1 className="mt-4 text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
                  {title}
                </h1>
                <p className="mt-5 max-w-md text-base leading-relaxed text-white/75 sm:text-lg">
                  {description}
                </p>
                <div className="mt-8 flex flex-wrap gap-3 text-sm text-white/70">
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/30 px-3 py-1.5 backdrop-blur-sm">
                    <Clock3 className="h-3.5 w-3.5 text-[#ccff00]" />
                    {minutes} minutes
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/30 px-3 py-1.5 backdrop-blur-sm">
                    <Flame className="h-3.5 w-3.5 text-[#ccff00]" />
                    Dynamic activation
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/30 px-3 py-1.5 backdrop-blur-sm">
                    <Shield className="h-3.5 w-3.5 text-[#ccff00]" />
                    Injury prep
                  </span>
                </div>
                <a
                  href="#get-access"
                  className="mt-10 inline-flex rounded-full bg-[#ccff00] px-7 py-3.5 text-sm font-semibold text-black transition hover:bg-[#b3e600] lg:hidden"
                >
                  {isSignedIn ? "Start warm-up" : "Start free warm-up"}
                </a>
              </div>

              <div
                id="get-access"
                className="rounded-3xl border border-white/12 bg-black/55 p-6 shadow-[0_30px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:p-8"
              >
                {isSignedIn ? (
                  <>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#ccff00]">
                      You&apos;re signed in
                    </p>
                    <h2 className="mt-2 text-2xl font-semibold tracking-tight">Start the warm-up</h2>
                    <p className="mt-2 text-sm leading-relaxed text-white/65">
                      This routine is completely free — open it and start warming up.
                    </p>
                    <Link
                      href={COURT_WARMUP_DEST_PATH}
                      className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-[#ccff00] py-3.5 text-sm font-semibold text-black transition hover:bg-[#b3e600]"
                    >
                      Open warm-up
                    </Link>
                  </>
                ) : (
                  <>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#ccff00]">
                      Free access
                    </p>
                    <h2 className="mt-2 text-2xl font-semibold tracking-tight">Get the warm-up free</h2>
                    <p className="mt-2 text-sm leading-relaxed text-white/65">
                      Create a free account with email and password — then start the warm-up right away.
                    </p>
                    <div className="mt-6">
                      <CourtWarmupSignUpForm />
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="border-t border-white/8 px-5 py-16 sm:px-8 sm:py-20">
          <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-2 lg:gap-16">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Why this routine</h2>
              <p className="mt-4 text-base leading-relaxed text-white/65">{body}</p>
              <ul className="mt-8 space-y-3">
                {outcomes.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-white/85">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#ccff00]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">What&apos;s inside</h2>
              <p className="mt-4 text-sm text-white/55">
                Guided exercises you can run on court before a match or training.
              </p>
              <ol className="mt-6 divide-y divide-white/10 rounded-2xl border border-white/10 bg-white/[0.03]">
                {(exercises.length > 0
                  ? exercises.map((ex) => ex.title)
                  : [
                      "Run up and down on court",
                      "Marching Skips",
                      "Dynamic Hamstring Stretch",
                      "Arm Wall Slides",
                      "Shoulder Internal and External Rotation",
                      "Dynamic Half-Kneeling Hip and Hamstring Stretch",
                      "Padel Footwork: Split Step to Groundstroke and Bandeja",
                    ]
                ).map((name, index) => (
                  <li key={name} className="flex items-center gap-4 px-4 py-3.5 text-sm sm:px-5">
                    <span className="w-6 shrink-0 font-mono text-xs text-[#ccff00]/80">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="text-white/90">{name}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/8 px-5 py-8 text-center text-xs text-white/40 sm:px-8">
        <Link href="/" className="hover:text-white/70">
          ← Back to Core Padel
        </Link>
      </footer>
    </div>
  );
}
