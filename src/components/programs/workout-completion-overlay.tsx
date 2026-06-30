"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

export function WorkoutCompletionOverlay({
  programTitle,
  sessionName,
  detailHref,
  nextSessionHref,
  nextSessionLabel,
  programComplete,
  isSingleWorkout,
}: {
  programTitle: string;
  sessionName?: string | null;
  detailHref: string;
  nextSessionHref?: string | null;
  nextSessionLabel?: string | null;
  programComplete?: boolean;
  isSingleWorkout?: boolean;
}) {
  const router = useRouter();

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 p-6 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-3xl bg-white p-8 text-center shadow-2xl">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#ccff00] text-3xl">
          {programComplete ? "🏆" : "🎉"}
        </div>
        <h2 className="mt-5 text-2xl font-semibold text-gray-900">
          {isSingleWorkout ? "Workout complete!" : programComplete ? "Program complete!" : "Day complete!"}
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          {isSingleWorkout ? (
            <>
              Nice work finishing{" "}
              <span className="font-medium text-gray-900">{programTitle}</span>. See you on court.
            </>
          ) : programComplete ? (
            <>
              You finished <span className="font-medium text-gray-900">{programTitle}</span>. Great
              work staying consistent.
            </>
          ) : sessionName ? (
            <>
              Nice work finishing{" "}
              <span className="font-medium text-gray-900">{sessionName}</span> in{" "}
              <span className="font-medium text-gray-900">{programTitle}</span>.
            </>
          ) : (
            <>
              Nice work finishing{" "}
              <span className="font-medium text-gray-900">{programTitle}</span>.
            </>
          )}
        </p>

        <div className="mt-8 flex flex-col gap-3">
          {!isSingleWorkout && !programComplete && nextSessionHref && (
            <Link
              href={nextSessionHref}
              className="w-full rounded-xl bg-[#ccff00] py-3.5 text-sm font-semibold text-black transition hover:bg-[#b3e600]"
            >
              {nextSessionLabel ? `Next · ${nextSessionLabel}` : "Next day"}
            </Link>
          )}
          <button
            type="button"
            onClick={() => router.push(detailHref)}
            className={`w-full rounded-xl py-3.5 text-sm font-semibold transition ${
              !programComplete && nextSessionHref && !isSingleWorkout
                ? "border border-gray-200 text-gray-800 hover:bg-gray-50"
                : "bg-[#ccff00] text-black hover:bg-[#b3e600]"
            }`}
          >
            {isSingleWorkout ? "Done" : programComplete ? "View program" : "Back to training plan"}
          </button>
        </div>
      </div>
    </div>
  );
}
