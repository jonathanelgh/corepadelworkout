"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

export function BackButton({
  fallbackHref,
  className,
  children,
  ariaLabel = "Go back",
}: {
  fallbackHref: string;
  className?: string;
  children: ReactNode;
  ariaLabel?: string;
}) {
  const router = useRouter();

  function handleBack() {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }
    router.push(fallbackHref);
  }

  return (
    <button type="button" onClick={handleBack} className={className} aria-label={ariaLabel}>
      {children}
    </button>
  );
}
