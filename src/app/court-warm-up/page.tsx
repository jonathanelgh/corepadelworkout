import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, Clock3, Flame, Shield } from "lucide-react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabase/server";
import { fetchProgramExercises } from "@/lib/programs/program-exercises";
import {
  COURT_WARMUP_DEST_PATH,
  COURT_WARMUP_PROGRAM_SLUG,
  type FreeWarmupProgramCard,
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
  title: "Free Padel Warm-ups",
  description:
    "Create a free account and unlock all free padel warm-up programs — three court routines to get match-ready.",
  openGraph: {
    title: "Free Padel Warm-ups · Core Padel",
    description:
      "Unlock every free warm-up in the library. Three court routines to raise heart rate, open mobility, and prep before you play.",
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

async function loadFreeWarmupPrograms(
  supabase: SupabaseClient
): Promise<FreeWarmupProgramCard[]> {
  const { data: category } = await supabase
    .from("categories")
    .select("id")
    .eq("slug", "warm-up")
    .maybeSingle();

  let query = supabase
    .from("programs")
    .select("id, slug, title, description, cover_image_url, minutes_per_session")
    .eq("status", "published")
    .eq("is_free", true)
    .order("title", { ascending: true });

  if (category?.id) {
    const { data: links } = await supabase
      .from("program_categories")
      .select("program_id")
      .eq("category_id", category.id);
    const ids = (links ?? [])
      .map((row) => row.program_id as string)
      .filter(Boolean);
    if (ids.length > 0) {
      query = query.in("id", ids);
    } else {
      query = query.ilike("slug", "%warm%");
    }
  } else {
    query = query.ilike("slug", "%warm%");
  }

  const { data } = await query;
  const rows = data ?? [];

  // Keep the featured court warm-up first when present.
  rows.sort((a, b) => {
    if (a.slug === COURT_WARMUP_PROGRAM_SLUG) return -1;
    if (b.slug === COURT_WARMUP_PROGRAM_SLUG) return 1;
    return String(a.title).localeCompare(String(b.title));
  });

  return rows.map((row) => ({
    id: row.id as string,
    slug: row.slug as string,
    title: row.title as string,
    description: (row.description as string | null) ?? null,
    coverImageUrl: (row.cover_image_url as string | null) ?? null,
    minutesPerSession:
      typeof row.minutes_per_session === "number" ? row.minutes_per_session : null,
  }));
}

export default async function CourtWarmupLandingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isSignedIn = Boolean(user);

  const freeWarmups = await loadFreeWarmupPrograms(supabase);
  const freeCount = freeWarmups.length || 3;

  const featured =
    freeWarmups.find((p) => p.slug === COURT_WARMUP_PROGRAM_SLUG) ?? freeWarmups[0] ?? null;

  const { data: program } = featured
    ? await supabase
        .from("programs")
        .select(
          "id, title, description, body, cover_image_url, minutes_per_session, outcomes, is_free, status"
        )
        .eq("id", featured.id)
        .maybeSingle()
    : await supabase
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

  const programsAnchor = "#free-warmups";

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
                ? programsAnchor
                : `/login?next=${encodeURIComponent(COURT_WARMUP_DEST_PATH)}`
            }
            className="rounded-full border border-white/20 px-4 py-2 text-sm font-medium text-white/90 transition hover:border-white/40 hover:bg-white/5"
          >
            {isSignedIn ? "Free warm-ups" : "Sign in"}
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
                  Free · {freeCount} warm-up programs
                </p>
                <h1 className="mt-4 text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
                  Free padel warm-ups
                </h1>
                <p className="mt-5 max-w-md text-base leading-relaxed text-white/75 sm:text-lg">
                  Create a free account and unlock every free warm-up in the library — {freeCount}{" "}
                  court routines to get match-ready, including dynamic, flow, and resistance-band
                  options.
                </p>
                <div className="mt-8 flex flex-wrap gap-3 text-sm text-white/70">
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/30 px-3 py-1.5 backdrop-blur-sm">
                    <Clock3 className="h-3.5 w-3.5 text-[#ccff00]" />
                    From {minutes} min
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/30 px-3 py-1.5 backdrop-blur-sm">
                    <Flame className="h-3.5 w-3.5 text-[#ccff00]" />
                    {freeCount} free routines
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
                  {isSignedIn ? "Browse free warm-ups" : "Get free warm-ups"}
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
                    <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                      Your free warm-ups are ready
                    </h2>
                    <p className="mt-2 text-sm leading-relaxed text-white/65">
                      You have free access to all {freeCount} warm-up programs — pick one below and
                      start.
                    </p>
                    <a
                      href={programsAnchor}
                      className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-[#ccff00] py-3.5 text-sm font-semibold text-black transition hover:bg-[#b3e600]"
                    >
                      See all free warm-ups
                    </a>
                  </>
                ) : (
                  <>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#ccff00]">
                      Free access
                    </p>
                    <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                      Unlock all free warm-ups
                    </h2>
                    <p className="mt-2 text-sm leading-relaxed text-white/65">
                      Create a free account with email and password — then open every free warm-up
                      program ({freeCount} routines today).
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

        <section
          id="free-warmups"
          className="border-t border-white/8 px-5 py-16 sm:px-8 sm:py-20"
        >
          <div className="mx-auto max-w-6xl">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              All free warm-up programs
            </h2>
            <p className="mt-3 max-w-2xl text-base leading-relaxed text-white/65">
              One free account unlocks the full free warm-up library. Choose the routine that fits
              your day — dynamic, flow, or resistance bands.
            </p>

            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {(freeWarmups.length > 0
                ? freeWarmups
                : [
                    {
                      id: "fallback-1",
                      slug: COURT_WARMUP_PROGRAM_SLUG,
                      title: "Court warm-up dynamic",
                      description,
                      coverImageUrl: cover,
                      minutesPerSession: minutes,
                    },
                  ]
              ).map((item) => {
                const href = `/programs/${item.slug}`;
                const itemCover = item.coverImageUrl?.trim() || FALLBACK_COVER;
                const itemMinutes =
                  item.minutesPerSession && item.minutesPerSession > 0
                    ? item.minutesPerSession
                    : null;
                return (
                  <Link
                    key={item.id}
                    href={isSignedIn ? href : "#get-access"}
                    className="group block overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] transition hover:border-[#ccff00]/40 hover:bg-white/[0.05]"
                  >
                    <div className="relative aspect-[16/10] overflow-hidden">
                      <img
                        src={itemCover}
                        alt=""
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                      <span className="absolute bottom-3 left-3 rounded-full bg-[#ccff00] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-black">
                        Free
                      </span>
                    </div>
                    <div className="p-5">
                      <h3 className="text-lg font-semibold tracking-tight text-white group-hover:text-[#ccff00]">
                        {item.title}
                      </h3>
                      {item.description ? (
                        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-white/60">
                          {item.description}
                        </p>
                      ) : null}
                      {itemMinutes != null ? (
                        <p className="mt-3 text-xs font-medium uppercase tracking-[0.18em] text-white/45">
                          {itemMinutes} min
                        </p>
                      ) : null}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        <section className="border-t border-white/8 px-5 py-16 sm:px-8 sm:py-20">
          <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-2 lg:gap-16">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Why warm up</h2>
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
              <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                Featured: {title}
              </h2>
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
