"use client";

import { useRouter } from "next/navigation";

export function WorkoutCompletionOverlay({
  programTitle,
  detailHref,
}: {
  programTitle: string;
  detailHref: string;
}) {
  const router = useRouter();

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 p-6 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-3xl bg-white p-8 text-center shadow-2xl">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#ccff00] text-3xl">
          🎉
        </div>
        <h2 className="mt-5 text-2xl font-semibold text-gray-900">Workout complete!</h2>
        <p className="mt-2 text-sm text-gray-600">
          Nice work finishing <span className="font-medium text-gray-900">{programTitle}</span>.
        </p>
        <button
          type="button"
          onClick={() => router.push(detailHref)}
          className="mt-8 w-full rounded-xl bg-[#ccff00] py-3.5 text-sm font-semibold text-black transition hover:bg-[#b3e600]"
        >
          Done
        </button>
      </div>
    </div>
  );
}
