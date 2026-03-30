"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ProgramsCatalog } from "@/components/programs/programs-catalog";
import type { ProgramCard } from "@/app/programs/programs-library-client";
import { Crown, Library, ShoppingBag } from "lucide-react";

type Tab = "all" | "my";

type Props = {
  allPrograms: ProgramCard[];
  myPrograms: ProgramCard[];
  categoryOptionsAll: string[];
  hasActivePro: boolean;
  loadErrorAll?: string | null;
  loadErrorMy?: string | null;
};

function categoryOptionsFor(programs: ProgramCard[]): string[] {
  const names = [
    ...new Set(programs.flatMap((p) => p.categoryNames).filter((n) => n.length > 0 && n !== "All")),
  ].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
  return ["All", ...names];
}

export function MemberProgramsLibraryClient({
  allPrograms,
  myPrograms,
  categoryOptionsAll,
  hasActivePro,
  loadErrorAll,
  loadErrorMy,
}: Props) {
  const [tab, setTab] = useState<Tab>("all");

  const categoryOptionsMy = useMemo(() => categoryOptionsFor(myPrograms), [myPrograms]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">Programs</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Browse the full library or open programs you&apos;ve purchased.
        </p>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-zinc-200 pb-px">
        <button
          type="button"
          onClick={() => setTab("all")}
          className={`flex items-center gap-2 rounded-t-lg px-4 py-2.5 text-sm font-semibold transition-colors ${
            tab === "all"
              ? "border border-b-0 border-zinc-200 bg-white text-zinc-900"
              : "text-zinc-500 hover:text-zinc-800"
          }`}
        >
          <Library className="h-4 w-4" />
          All programs
        </button>
        <button
          type="button"
          onClick={() => setTab("my")}
          className={`flex items-center gap-2 rounded-t-lg px-4 py-2.5 text-sm font-semibold transition-colors ${
            tab === "my"
              ? "border border-b-0 border-zinc-200 bg-white text-zinc-900"
              : "text-zinc-500 hover:text-zinc-800"
          }`}
        >
          <ShoppingBag className="h-4 w-4" />
          My programs
          {myPrograms.length > 0 && (
            <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-bold text-zinc-600">
              {myPrograms.length}
            </span>
          )}
        </button>
      </div>

      <div className="min-w-0">
        {tab === "all" && (
          <ProgramsCatalog
            programs={allPrograms}
            categoryOptions={categoryOptionsAll}
            loadError={loadErrorAll}
            hideIntro
          />
        )}

        {tab === "my" && (
          <>
            {loadErrorMy && (
              <div className="mb-8 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                Could not load your programs: {loadErrorMy}
              </div>
            )}

            {hasActivePro && myPrograms.length === 0 && !loadErrorMy && (
              <div className="mb-10 flex gap-4 rounded-2xl border border-emerald-200 bg-emerald-50/80 p-5 text-sm text-emerald-900">
                <Crown className="h-5 w-5 shrink-0 text-emerald-700" />
                <div>
                  <p className="font-semibold">Pro includes every program</p>
                  <p className="mt-1 text-emerald-800/90">
                    You don&apos;t have separate &quot;purchased&quot; rows — your subscription unlocks the full
                    library. Use the <strong>All programs</strong> tab to start any course.
                  </p>
                  <button
                    type="button"
                    onClick={() => setTab("all")}
                    className="mt-3 text-sm font-semibold text-emerald-800 underline hover:text-emerald-900"
                  >
                    Go to All programs
                  </button>
                </div>
              </div>
            )}

            {!hasActivePro && myPrograms.length === 0 && !loadErrorMy && (
              <div className="mb-10 rounded-2xl border border-zinc-200 bg-zinc-50 p-6 text-center">
                <ShoppingBag className="mx-auto h-10 w-10 text-zinc-400" />
                <h2 className="mt-4 text-lg font-semibold text-zinc-900">No purchases yet</h2>
                <p className="mx-auto mt-2 max-w-md text-sm text-zinc-600">
                  Programs you buy individually will show up here. Browse the full library and enroll when
                  you&apos;re ready.
                </p>
                <button
                  type="button"
                  onClick={() => setTab("all")}
                  className="mt-5 rounded-full bg-zinc-900 px-6 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800"
                >
                  Browse all programs
                </button>
              </div>
            )}

            {myPrograms.length > 0 && (
              <ProgramsCatalog
                programs={myPrograms}
                categoryOptions={categoryOptionsMy.length > 1 ? categoryOptionsMy : ["All"]}
                loadError={loadErrorMy}
                title="Your programs"
                description="Courses you&apos;ve purchased. Open a card to continue training."
                programHref={(slug) => `/programs/${slug}/take`}
                emptyState={{
                  title: "No programs here",
                  body: "Your purchased programs will appear in this tab.",
                }}
              />
            )}

            {!hasActivePro && myPrograms.length > 0 && (
              <p className="mt-8 text-center text-xs text-zinc-500">
                Missing a purchase?{" "}
                <Link href="/member/upgrade" className="font-medium text-emerald-700 hover:text-emerald-800">
                  Upgrade to Pro
                </Link>{" "}
                for full library access.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
