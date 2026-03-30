"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Search, Filter, Clock, Target } from "lucide-react";
import type { ProgramCard } from "@/app/programs/programs-library-client";

export { type ProgramCard };

function formatPriceEur(price: number | null): string | null {
  if (price == null) return null;
  try {
    return new Intl.NumberFormat("en-IE", {
      style: "currency",
      currency: "EUR",
    }).format(Number(price));
  } catch {
    return `€${Number(price).toFixed(2)}`;
  }
}

type Props = {
  programs: ProgramCard[];
  categoryOptions: string[];
  loadError?: string | null;
  title?: string;
  description?: string;
  /** When true, omit the large title + description block (e.g. member /programs “all” tab). */
  hideIntro?: boolean;
  programHref?: (slug: string) => string;
  emptyState?: { title: string; body: string };
};

export function ProgramsCatalog({
  programs,
  categoryOptions,
  loadError,
  title = "The Program Library",
  description =
    "Find the perfect training program to elevate your padel game. From raw power to injury prevention, we've got you covered.",
  programHref = (slug) => `/programs/${slug}`,
  hideIntro = false,
  emptyState,
}: Props) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  const filteredPrograms = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return programs.filter((program) => {
      const matchesSearch =
        !q ||
        program.title.toLowerCase().includes(q) ||
        program.description.toLowerCase().includes(q);
      const matchesCategory =
        activeCategory === "All" || program.categoryNames.includes(activeCategory);
      return matchesSearch && matchesCategory;
    });
  }, [programs, searchQuery, activeCategory]);

  const hasAnyPrograms = programs.length > 0;
  const defaultEmpty = {
    title: "No programs yet",
    body: "Published programs will appear here. Check back soon.",
  };
  const noResultsEmpty = {
    title: "No programs found",
    body: "We couldn't find any programs matching your search. Try adjusting your filters or search term.",
  };

  return (
    <>
      {loadError && (
        <div className="mb-8 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Could not load programs: {loadError}
        </div>
      )}

      {!hideIntro && (
        <div className="mb-12 max-w-2xl">
          <h1 className="mb-4 text-4xl font-medium tracking-tight md:text-5xl lg:text-6xl">{title}</h1>
          <p className="text-lg leading-relaxed text-gray-500">{description}</p>
        </div>
      )}

      <div className="mb-12 flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
        <div className="hide-scrollbar flex w-full items-center gap-2 overflow-x-auto pb-2 md:w-auto md:pb-0">
          <div className="mr-2 flex shrink-0 items-center gap-2 text-gray-400">
            <Filter className="h-4 w-4" />
            <span className="text-sm font-medium">Filter:</span>
          </div>
          {categoryOptions.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setActiveCategory(category)}
              className={`whitespace-nowrap rounded-full px-5 py-2 text-sm font-medium transition-colors ${
                activeCategory === category
                  ? "bg-black text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        <div className="relative w-full shrink-0 md:w-72">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="search"
            placeholder="Search programs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-full border border-gray-200 bg-gray-50 py-3 pr-4 pl-11 text-sm transition-all focus:border-transparent focus:ring-2 focus:ring-[#ccff00] focus:outline-none"
          />
        </div>
      </div>

      <div className="mb-8 text-sm font-medium text-gray-500">
        Showing {filteredPrograms.length} {filteredPrograms.length === 1 ? "program" : "programs"}
      </div>

      {!hasAnyPrograms && !loadError ? (
        <div className="rounded-[2rem] border border-dashed border-gray-200 bg-gray-50 py-24 text-center">
          <h3 className="mb-2 text-xl font-medium">{emptyState?.title ?? defaultEmpty.title}</h3>
          <p className="mx-auto max-w-md text-gray-500">{emptyState?.body ?? defaultEmpty.body}</p>
        </div>
      ) : filteredPrograms.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8 lg:grid-cols-3">
          {filteredPrograms.map((program) => {
            const priceStr = formatPriceEur(program.price);
            const categoryBadge =
              program.categoryNames.length > 0 ? program.categoryNames.join(" · ") : (program.categoryName ?? "Program");
            const levelLabel = program.difficultyName ?? "All levels";
            return (
              <Link
                href={programHref(program.slug)}
                key={program.slug}
                className="group flex flex-col overflow-hidden rounded-[2rem] border border-gray-100 bg-white transition-all duration-300 hover:shadow-2xl hover:shadow-black/5"
              >
                <div className="relative h-64 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={program.image}
                    alt={program.title}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent opacity-60" />
                  <div className="absolute top-4 left-4 flex max-w-[calc(100%-5rem)] gap-2">
                    <span className="line-clamp-2 rounded-full bg-white/90 px-3 py-1.5 text-left text-xs font-bold tracking-wider text-black uppercase backdrop-blur-sm">
                      {categoryBadge}
                    </span>
                  </div>
                  {priceStr && (
                    <div className="absolute top-4 right-4">
                      <div className="rounded-full bg-black/50 px-3 py-1.5 text-xs font-semibold text-white tabular-nums backdrop-blur-md">
                        {priceStr}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex flex-grow flex-col p-6 md:p-8">
                  <h3 className="mb-3 text-2xl font-medium transition-colors group-hover:text-gray-600">
                    {program.title}
                  </h3>
                  <p className="mb-6 line-clamp-4 flex-grow text-sm leading-relaxed text-gray-500">
                    {program.description}
                  </p>

                  <div className="mb-8 flex items-center gap-4 border-b border-gray-100 pb-6 text-sm text-gray-400">
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-4 w-4 shrink-0" />
                      <span>{program.durationLabel}</span>
                    </div>
                    <div className="h-1 w-1 shrink-0 rounded-full bg-gray-300" />
                    <div className="flex min-w-0 items-center gap-1.5">
                      <Target className="h-4 w-4 shrink-0" />
                      <span className="truncate">{levelLabel}</span>
                    </div>
                  </div>

                  <div className="mt-auto flex items-center justify-between">
                    <span className="font-semibold text-black transition-colors group-hover:text-gray-600">
                      View Program
                    </span>
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-50 transition-colors group-hover:bg-[#ccff00]">
                      <ArrowRight className="h-5 w-5 text-black" />
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="rounded-[2rem] border border-dashed border-gray-200 bg-gray-50 py-24 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm">
            <Search className="h-6 w-6 text-gray-400" />
          </div>
          <h3 className="mb-2 text-xl font-medium">{noResultsEmpty.title}</h3>
          <p className="mx-auto max-w-md text-gray-500">{noResultsEmpty.body}</p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery("");
              setActiveCategory("All");
            }}
            className="mt-6 rounded-full border border-gray-200 px-6 py-2.5 text-sm font-semibold transition-colors hover:bg-gray-100"
          >
            Clear all filters
          </button>
        </div>
      )}
    </>
  );
}
