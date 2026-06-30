"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { cancelProgramTraining } from "@/app/programs/program-progress-actions";

export function CancelProgramButton({
  programSlug,
  className,
}: {
  programSlug: string;
  className?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onCancel() {
    const confirmed = window.confirm(
      "Cancel this program? Your progress and training log will be cleared. You can start the program again anytime."
    );
    if (!confirmed) return;

    setError(null);
    startTransition(async () => {
      const result = await cancelProgramTraining(programSlug);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      router.push(result.redirectHref);
      router.refresh();
    });
  }

  return (
    <div className="text-center">
      {error && <p className="mb-2 text-sm text-red-600">{error}</p>}
      <button
        type="button"
        disabled={pending}
        onClick={onCancel}
        className={
          className ??
          "text-sm font-medium text-red-600 transition hover:text-red-700 disabled:opacity-60"
        }
      >
        {pending ? "Cancelling…" : "Cancel program"}
      </button>
    </div>
  );
}
