"use client";

import Link from "next/link";

type Props = {
  programSlug: string;
};

export function ProgramTakeFooter({ programSlug }: Props) {
  return (
    <div className="fixed right-0 bottom-0 left-0 z-50 border-t border-gray-100 bg-white p-4 md:left-1/2 md:p-6">
      <div className="mx-auto flex max-w-2xl flex-col items-stretch justify-between gap-3 sm:flex-row sm:items-center">
        <Link
          href={`/programs/${programSlug}`}
          className="text-center text-sm font-medium text-gray-600 hover:text-black sm:text-left"
        >
          Program overview
        </Link>
        <Link
          href="/member/programs"
          className="rounded-full bg-[#ccff00] px-6 py-3 text-center text-sm font-semibold text-black transition-colors hover:bg-[#b3e600]"
        >
          My programs
        </Link>
      </div>
    </div>
  );
}
