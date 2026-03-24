"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useState, useTransition } from "react";
import { enrollInPublishedProgram } from "./enroll-actions";

type Props = {
  programSlug: string;
  priceLabel: string;
  /** From server: user already has Pro or enrollment */
  hasAccess?: boolean;
};

export function ProgramEnrollBar({ programSlug, priceLabel, hasAccess = false }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [justEnrolled, setJustEnrolled] = useState(false);

  function onStart() {
    setMessage(null);
    startTransition(async () => {
      const result = await enrollInPublishedProgram(programSlug);
      if ("error" in result) {
        if (result.code === "SIGN_IN_REQUIRED") {
          const next = pathname && pathname.startsWith("/") ? pathname : `/programs/${programSlug}`;
          router.push(`/login?next=${encodeURIComponent(next)}`);
          return;
        }
        setMessage(result.error);
        return;
      }
      setJustEnrolled(true);
      if (result.alreadyEnrolled) {
        setMessage("You're already enrolled — open the training view anytime.");
      } else {
        setMessage("You're in! Continue to your workouts below.");
      }
      router.refresh();
    });
  }

  const takeHref = `/programs/${programSlug}/take`;
  const showWorkouts = hasAccess || justEnrolled;

  return (
    <div className="fixed right-0 bottom-0 left-0 z-50 md:left-1/2">
      {message && (
        <div className="border-t border-emerald-200 bg-emerald-50 px-4 py-2.5 text-center text-sm font-medium text-emerald-900">
          {message}
        </div>
      )}
      <div className="flex items-center justify-between border-t border-gray-100 bg-white p-4 md:p-6">
        <div className="hidden md:block">
          <div className="mb-1 text-sm text-gray-500">One-time payment</div>
          <div className="text-2xl font-medium tabular-nums">{priceLabel}</div>
        </div>
        {showWorkouts ? (
          <Link
            href={takeHref}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-[#ccff00] px-8 py-4 text-lg font-semibold text-black transition-colors hover:bg-[#b3e600] md:w-auto"
          >
            Open workouts
          </Link>
        ) : (
          <button
            type="button"
            disabled={pending}
            onClick={() => onStart()}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-[#ccff00] px-8 py-4 text-lg font-semibold text-black transition-colors hover:bg-[#b3e600] disabled:opacity-60 md:w-auto"
          >
            {pending ? "Starting…" : "Start Program Now"}{" "}
            <span className="ml-2 font-normal opacity-50 md:hidden">
              · {priceLabel !== "—" ? priceLabel : "—"}
            </span>
          </button>
        )}
      </div>
    </div>
  );
}
