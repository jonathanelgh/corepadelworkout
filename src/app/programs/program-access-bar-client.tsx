"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useState, useTransition } from "react";
import { enrollInPublishedProgram } from "./enroll-actions";
import { SubscribeButton } from "@/components/billing/subscribe-button";

type Props = {
  programSlug: string;
  playHref: string;
  isFree: boolean;
  hasAccess: boolean;
  isSignedIn: boolean;
  minsLabel: string | null;
  kcalLabel: string | null;
};

export function ProgramAccessBarClient({
  programSlug,
  playHref,
  isFree,
  hasAccess,
  isSignedIn,
  minsLabel,
  kcalLabel,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function onStartFree() {
    setMessage(null);
    startTransition(async () => {
      const result = await enrollInPublishedProgram(programSlug);
      if ("error" in result) {
        if (result.code === "SIGN_IN_REQUIRED") {
          const next = pathname?.startsWith("/") ? pathname : `/programs/${programSlug}`;
          router.push(`/login?next=${encodeURIComponent(next)}`);
          return;
        }
        setMessage(result.error);
        return;
      }
      router.push(playHref);
      router.refresh();
    });
  }

  return (
    <div className="fixed right-0 bottom-0 left-0 z-50 md:left-1/2">
      {message && (
        <div className="border-t border-amber-200 bg-amber-50 px-4 py-2.5 text-center text-sm font-medium text-amber-900">
          {message}
        </div>
      )}
      <div className="flex items-center justify-between border-t border-gray-100 bg-white p-4 md:p-6">
        <div className="hidden text-sm text-gray-500 md:block">
          {isFree && <div className="mb-1 font-medium text-emerald-700">Free program</div>}
          {minsLabel && <div>{minsLabel}</div>}
          {kcalLabel && <div className="text-xs text-gray-400">{kcalLabel}</div>}
        </div>

        {hasAccess ? (
          <Link
            href={playHref}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-[#ccff00] px-8 py-4 text-lg font-semibold text-black transition-colors hover:bg-[#b3e600] md:w-auto"
          >
            {isFree ? "Start free workout" : "Start now"}
          </Link>
        ) : isFree && !isSignedIn ? (
          <Link
            href={`/login?next=${encodeURIComponent(`/programs/${programSlug}`)}`}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-[#ccff00] px-8 py-4 text-lg font-semibold text-black transition-colors hover:bg-[#b3e600] md:w-auto"
          >
            Sign in to start
          </Link>
        ) : isFree ? (
          <button
            type="button"
            disabled={pending}
            onClick={() => onStartFree()}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-[#ccff00] px-8 py-4 text-lg font-semibold text-black transition-colors hover:bg-[#b3e600] disabled:opacity-60 md:w-auto"
          >
            {pending ? "Starting…" : "Start free workout"}
          </button>
        ) : (
          <div className="flex w-full flex-col items-stretch gap-2 md:w-auto md:items-end">
            <SubscribeButton className="flex w-full items-center justify-center gap-2 rounded-full bg-[#ccff00] px-8 py-4 text-lg font-semibold text-black transition-colors hover:bg-[#b3e600] disabled:opacity-60 md:w-auto">
              Unlock with Pro
            </SubscribeButton>
            <p className="text-center text-xs text-gray-500 md:text-right">
              Or{" "}
              <Link href="/member/upgrade" className="font-medium text-gray-700 underline">
                view membership
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
