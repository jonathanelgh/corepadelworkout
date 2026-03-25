"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import {
  PENDING_ONBOARDING_STORAGE_KEY,
  type PendingOnboardingV1,
} from "@/lib/member/pending-onboarding";
import { completeOnboarding } from "../actions";

export default function OnboardingApplyPage() {
  const router = useRouter();
  const [message, setMessage] = useState("Finishing your setup…");

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/onboarding?error=session");
        return;
      }

      const raw = typeof window !== "undefined" ? localStorage.getItem(PENDING_ONBOARDING_STORAGE_KEY) : null;
      if (!raw) {
        router.replace("/member");
        router.refresh();
        return;
      }

      let parsed: PendingOnboardingV1;
      try {
        parsed = JSON.parse(raw) as PendingOnboardingV1;
      } catch {
        localStorage.removeItem(PENDING_ONBOARDING_STORAGE_KEY);
        router.replace("/member");
        router.refresh();
        return;
      }

      if (parsed.v !== 1) {
        localStorage.removeItem(PENDING_ONBOARDING_STORAGE_KEY);
        router.replace("/member");
        router.refresh();
        return;
      }

      const res = await completeOnboarding({
        displayName: parsed.displayName,
        level: parsed.level,
        pains: parsed.pains,
        goal: parsed.goal,
        environments: parsed.environments,
        signupEmail: parsed.signupEmail,
      });

      if (cancelled) return;

      localStorage.removeItem(PENDING_ONBOARDING_STORAGE_KEY);

      if (!res.ok) {
        setMessage(res.message);
        return;
      }

      router.replace("/member");
      router.refresh();
    })();

    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <div className="mx-auto flex min-h-[50vh] max-w-md flex-col justify-center px-4 py-12 text-center">
      <p className="text-base text-zinc-700">{message}</p>
      {message !== "Finishing your setup…" && (
        <Link href="/onboarding" className="mt-6 text-sm font-medium text-emerald-700 hover:text-emerald-800">
          Back to onboarding
        </Link>
      )}
    </div>
  );
}
