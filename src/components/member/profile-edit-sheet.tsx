"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, X } from "lucide-react";
import { updateMemberProfile } from "@/app/member/profile-actions";
import type { MemberHubProfile } from "@/lib/member/load-member-hub-data";
import {
  PRIMARY_GOAL_LABELS,
  type OnboardingEnvironment,
  type OnboardingGoal,
  type OnboardingLevel,
  type PainKey,
} from "@/lib/member/onboarding";

const LEVELS: { id: OnboardingLevel; title: string; subtitle: string }[] = [
  { id: "beginner", title: "Beginner", subtitle: "Learning the basics · 0–1× a week" },
  { id: "intermediate", title: "Intermediate", subtitle: "Sustained rallies · 2–3× a week" },
  { id: "advanced", title: "Advanced / Pro", subtitle: "Tournament play · 4+ sessions a week" },
];

const PAINS: { id: PainKey; label: string; hint: string }[] = [
  { id: "padel_elbow", label: "Padel elbow", hint: "Lateral epicondylitis" },
  { id: "jumpers_knee", label: "Jumper's knee", hint: "Patellar tendonitis" },
  { id: "lower_back", label: "Lower back", hint: "Stiffness & tightness" },
  { id: "plantar_fasciitis", label: "Heel pain", hint: "Plantar fasciitis" },
  { id: "none", label: "None of these", hint: "General strength focus" },
];

const GOALS: { id: OnboardingGoal; title: string }[] = (
  Object.entries(PRIMARY_GOAL_LABELS) as [OnboardingGoal, string][]
).map(([id, title]) => ({ id, title }));

const ENVIRONMENTS: { id: OnboardingEnvironment; title: string }[] = [
  { id: "gym", title: "At the gym" },
  { id: "home", title: "At home" },
  { id: "club", title: "At the club" },
];

function initialFormState(profile: MemberHubProfile) {
  return {
    name: profile.full_name?.trim() ?? "",
    level: profile.level,
    pains: [...profile.pains],
    goal: profile.goal,
    environments: [...profile.environments],
  };
}

export function ProfileEditSheet({
  open,
  profile,
  onClose,
}: {
  open: boolean;
  profile: MemberHubProfile;
  onClose: () => void;
}) {
  const router = useRouter();
  const [name, setName] = useState(profile.full_name?.trim() ?? "");
  const [level, setLevel] = useState<OnboardingLevel | null>(profile.level);
  const [pains, setPains] = useState<PainKey[]>(profile.pains);
  const [goal, setGoal] = useState<OnboardingGoal | null>(profile.goal);
  const [environments, setEnvironments] = useState<OnboardingEnvironment[]>(profile.environments);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const next = initialFormState(profile);
    setName(next.name);
    setLevel(next.level);
    setPains(next.pains);
    setGoal(next.goal);
    setEnvironments(next.environments);
    setError(null);
  }, [open, profile]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !submitting) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, submitting, onClose]);

  const togglePain = useCallback((p: PainKey) => {
    if (p === "none") {
      setPains(["none"]);
      return;
    }
    setPains((prev) => {
      const withoutNone = prev.filter((x) => x !== "none");
      if (withoutNone.includes(p)) {
        return withoutNone.filter((x) => x !== p);
      }
      return [...withoutNone, p];
    });
  }, []);

  const canSave =
    name.trim().length >= 1 &&
    level !== null &&
    pains.length > 0 &&
    goal !== null &&
    environments.length > 0;

  async function handleSave() {
    if (!level || !goal || !canSave) return;
    setSubmitting(true);
    setError(null);
    const res = await updateMemberProfile({
      displayName: name.trim(),
      level,
      pains,
      goal,
      environments,
    });
    setSubmitting(false);
    if (!res.ok) {
      setError(res.message);
      return;
    }
    onClose();
    router.refresh();
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[120]" role="presentation">
      <button
        type="button"
        className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
        aria-label="Close profile editor"
        onClick={() => {
          if (!submitting) onClose();
        }}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="profile-edit-title"
        className="absolute inset-x-0 bottom-0 flex max-h-[92dvh] flex-col rounded-t-3xl border border-zinc-200 bg-white shadow-2xl sm:inset-auto sm:left-1/2 sm:top-1/2 sm:max-h-[min(85vh,720px)] sm:w-full sm:max-w-lg sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-zinc-100 px-5 py-4">
          <div>
            <h2 id="profile-edit-title" className="text-lg font-semibold text-zinc-900">
              Edit profile
            </h2>
            <p className="mt-0.5 text-sm text-zinc-500">Update your training preferences</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-zinc-200 text-zinc-600 transition hover:bg-zinc-50 disabled:opacity-50"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
          <div className="space-y-6">
            <label className="block">
              <span className="text-sm font-medium text-zinc-700">Name</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={80}
                className="mt-1.5 w-full rounded-xl border border-zinc-300 px-4 py-3 text-zinc-900 outline-none focus:border-[#ccff00]/80 focus:ring-2 focus:ring-[#ccff00]/30"
              />
            </label>

            <div>
              <span className="text-sm font-medium text-zinc-700">Email</span>
              <p className="mt-1.5 rounded-xl border border-zinc-100 bg-zinc-50 px-4 py-3 text-sm text-zinc-600">
                {profile.email ?? "—"}
              </p>
            </div>

            <fieldset>
              <legend className="text-sm font-medium text-zinc-700">Padel level</legend>
              <ul className="mt-2 space-y-2">
                {LEVELS.map((item) => {
                  const selected = level === item.id;
                  return (
                    <li key={item.id}>
                      <button
                        type="button"
                        onClick={() => setLevel(item.id)}
                        className={`w-full rounded-xl border-2 px-4 py-3 text-left transition ${
                          selected
                            ? "border-[#ccff00] bg-[#ccff00]/10"
                            : "border-zinc-200 bg-white hover:border-zinc-300"
                        }`}
                      >
                        <span className="block text-sm font-semibold text-zinc-900">{item.title}</span>
                        <span className="mt-0.5 block text-xs text-zinc-500">{item.subtitle}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </fieldset>

            <fieldset>
              <legend className="text-sm font-medium text-zinc-700">Padel pains / focus</legend>
              <ul className="mt-2 flex flex-wrap gap-2">
                {PAINS.map(({ id, label, hint }) => {
                  const on = pains.includes(id);
                  return (
                    <li key={id}>
                      <button
                        type="button"
                        onClick={() => togglePain(id)}
                        className={`rounded-xl border-2 px-3 py-2 text-left transition ${
                          on
                            ? "border-[#ccff00] bg-[#ccff00]/15 text-zinc-900"
                            : "border-zinc-200 bg-white text-zinc-800 hover:border-zinc-300"
                        }`}
                      >
                        <span className="block text-sm font-semibold">{label}</span>
                        <span className="mt-0.5 block text-xs text-zinc-500">{hint}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </fieldset>

            <fieldset>
              <legend className="text-sm font-medium text-zinc-700">Top priority</legend>
              <ul className="mt-2 grid gap-2 sm:grid-cols-2">
                {GOALS.map(({ id, title }) => {
                  const selected = goal === id;
                  return (
                    <li key={id}>
                      <button
                        type="button"
                        onClick={() => setGoal(id)}
                        className={`w-full rounded-xl border-2 px-3 py-2.5 text-left text-sm font-semibold transition ${
                          selected
                            ? "border-emerald-400 bg-emerald-50 text-zinc-900"
                            : "border-zinc-200 bg-white text-zinc-800 hover:border-zinc-300"
                        }`}
                      >
                        {title}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </fieldset>

            <fieldset>
              <legend className="text-sm font-medium text-zinc-700">Where you usually train</legend>
              <ul className="mt-2 space-y-2">
                {ENVIRONMENTS.map(({ id, title }) => {
                  const selected = environments.includes(id);
                  return (
                    <li key={id}>
                      <button
                        type="button"
                        onClick={() =>
                          setEnvironments((prev) =>
                            prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id],
                          )
                        }
                        className={`w-full rounded-xl border-2 px-4 py-3 text-left text-sm font-semibold transition ${
                          selected
                            ? "border-[#ccff00] bg-[#ccff00]/10 text-zinc-900"
                            : "border-zinc-200 bg-white text-zinc-800 hover:border-zinc-300"
                        }`}
                      >
                        {title}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </fieldset>
          </div>

          {error && (
            <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </p>
          )}
        </div>

        <div
          className="shrink-0 border-t border-zinc-100 px-5 py-4"
          style={{ paddingBottom: "max(16px, env(safe-area-inset-bottom))" }}
        >
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={!canSave || submitting}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#ccff00] py-3.5 text-sm font-bold text-zinc-950 transition hover:bg-[#b8e600] disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving…
              </>
            ) : (
              "Save changes"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
