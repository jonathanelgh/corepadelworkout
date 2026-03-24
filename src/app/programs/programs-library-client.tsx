"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ProgramsCatalog } from "@/components/programs/programs-catalog";

export type ProgramCard = {
  slug: string;
  title: string;
  description: string;
  image: string;
  categoryName: string | null;
  difficultyName: string | null;
  durationLabel: string;
  price: number | null;
};

type Props = {
  programs: ProgramCard[];
  categoryOptions: string[];
  loadError?: string | null;
};

export function ProgramsLibraryClient({ programs, categoryOptions, loadError }: Props) {
  return (
    <div className="min-h-screen bg-white pb-24 font-sans text-black selection:bg-[#ccff00] selection:text-black">
      <header className="sticky top-0 z-40 border-b border-gray-100 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-[1400px] items-center justify-between px-6 md:px-12">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="-ml-2 rounded-full p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-black"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <span className="hidden font-bold tracking-wider uppercase sm:block">Core Padel Workout</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/" className="hidden text-sm font-medium transition-colors hover:text-[#ccff00] sm:block">
              Home
            </Link>
            <Link href="/programs" className="text-sm font-medium text-gray-400">
              Programs
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1400px] px-6 pt-12 md:px-12 md:pt-20">
        <ProgramsCatalog
          programs={programs}
          categoryOptions={categoryOptions}
          loadError={loadError}
        />
      </main>
    </div>
  );
}
