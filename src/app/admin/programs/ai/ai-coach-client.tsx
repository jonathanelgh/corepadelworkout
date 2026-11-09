"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  CalendarDays,
  Clock,
  Dumbbell,
  ExternalLink,
  Home,
  Loader2,
  MapPin,
  Pencil,
  SlidersHorizontal,
  Sparkles,
  Target,
} from "lucide-react";
import type { ProgramCatalogRow } from "@/lib/programs/programs-catalog";
import {
  TRAINING_LEVEL_OPTIONS,
  type MemberPickerOption,
} from "@/lib/programs/profile-ai-context";
import type {
  ChatHistoryMessage,
  ProgramProposal,
  ProgramProposalSession,
  WorkoutProposal,
  WorkoutProposalExercise,
} from "@/lib/programs/ai-coach-gemini";
import {
  groupExercisesByPhase,
  SESSION_PHASE_LABELS,
} from "@/lib/programs/session-phase";
import { estimateWorkoutMinutes } from "@/lib/programs/estimate-workout-minutes";
import {
  getProgramCoverUrl,
  saveAiCoachWorkout,
  sendAiCoachMessage,
} from "../ai-coach-actions";
import { AiGenerationDebugPanel } from "./ai-generation-debug-panel";
import type { AiGenerationDebugLog } from "@/lib/programs/ai-generation-debug";

type BuildKind = "program" | "workout";
type LocationSlug = "gym" | "home" | "at-the-court";
type Phase = "form" | "generating" | "overview";

type MovementBlocks = {
  squat: boolean;
  lunge: boolean;
  pushUp: boolean;
  jump: boolean;
};

type CoachFormState = {
  kind: BuildKind;
  goal: string;
  location: LocationSlug | "";
  equipment: string[];
  bodyweightOnly: boolean;
  movementOk: boolean;
  blocked: MovementBlocks;
  weeks: number;
  sessionsPerWeek: number;
  minutes: number;
};

type GeneratedWorkout = {
  programId: string;
  slug: string;
  title: string;
  description: string;
  status: "draft" | "published";
  coverPending?: boolean;
  coverImageUrl?: string;
  designRationale?: string;
};

const WEEK_OPTIONS = [4, 6, 8, 12];
const SESSION_OPTIONS = [2, 3, 4, 5];
const PROGRAM_MINUTE_OPTIONS = [20, 30, 45, 60];
const WORKOUT_MINUTE_OPTIONS = [10, 15, 20, 30, 45];

const LOCATION_OPTIONS: { slug: LocationSlug; label: string; hint: string }[] = [
  { slug: "gym", label: "Gym", hint: "Machines, racks, and free weights" },
  { slug: "home", label: "Home", hint: "Only the gear you actually have" },
  { slug: "at-the-court", label: "At the court", hint: "Portable, match-day setup" },
];

const GOAL_PRESETS: { label: string; text: string; kind?: BuildKind }[] = [
  {
    label: "Explosive power",
    text: "More explosive power for smashes and a quicker first step.",
  },
  {
    label: "Court speed",
    text: "Faster court movement, change of direction, and recovery between shots.",
  },
  {
    label: "Shoulder durability",
    text: "Shoulder durability and overhead strength for a heavy match week.",
  },
  {
    label: "Match endurance",
    text: "Match endurance so power still holds up late in long sets.",
  },
  {
    label: "Pre-match activation",
    text: "A short activation so the body feels ready before a match.",
    kind: "workout",
  },
];

const LOCATION_REPLY: Record<LocationSlug, string> = {
  gym: "gym",
  home: "home",
  "at-the-court": "at the court",
};

const EMPTY_FORM: CoachFormState = {
  kind: "program",
  goal: "",
  location: "",
  equipment: [],
  bodyweightOnly: false,
  movementOk: true,
  blocked: { squat: false, lunge: false, pushUp: false, jump: false },
  weeks: 8,
  sessionsPerWeek: 3,
  minutes: 45,
};

function locationLabel(slug: string | undefined): string {
  if (slug === "home") return "Home";
  if (slug === "at-the-court") return "At the court";
  if (slug === "gym") return "Gym";
  return "Any location";
}

function buildCoachRequest(form: CoachFormState): {
  history: ChatHistoryMessage[];
  userMessage: string;
  creationKind: BuildKind;
} {
  const parts: string[] = [];
  if (form.kind === "program") {
    parts.push("Build a custom program.");
    parts.push(`${form.weeks} week program.`);
    parts.push(`${form.sessionsPerWeek} sessions per week.`);
    parts.push(`${form.minutes} minutes per session.`);
    if (form.movementOk) {
      parts.push("Movement: yes to all.");
    } else {
      const limits: string[] = [];
      if (form.blocked.squat) limits.push("can't squat");
      if (form.blocked.lunge) limits.push("can't lunge");
      if (form.blocked.pushUp) limits.push("can't do push-ups");
      if (form.blocked.jump) limits.push("no jumping");
      parts.push(
        limits.length > 0 ? `Movement limits: ${limits.join(", ")}.` : "Movement: yes to all."
      );
    }
  } else {
    parts.push("Build a custom workout.");
    parts.push(`${form.minutes} minutes.`);
  }

  if (form.location === "home") {
    parts.push(
      form.bodyweightOnly || form.equipment.length === 0
        ? "Home equipment: bodyweight only."
        : `Home equipment: ${form.equipment.join(", ")}.`
    );
  }

  parts.push(`Focus: ${form.goal.trim()}`);

  if (!form.location) {
    throw new Error("Choose a training location before building.");
  }

  return {
    history: [{ role: "user", parts: [{ text: parts.join(" ") }] }],
    userMessage: LOCATION_REPLY[form.location],
    creationKind: form.kind,
  };
}

function formError(form: CoachFormState): string | null {
  if (form.goal.trim().length < 8) {
    return "Add a short focus so the coach knows what this plan is for.";
  }
  if (!form.location) return "Choose where the sessions will happen.";
  if (form.location === "home" && !form.bodyweightOnly && form.equipment.length === 0) {
    return "Pick the home equipment, or choose bodyweight only.";
  }
  if (form.kind === "program" && !form.movementOk) {
    const anyLimit = Object.values(form.blocked).some(Boolean);
    if (!anyLimit) return "Mark the movements to avoid, or switch back to all movements fine.";
  }
  return null;
}

function formatExerciseMeta(ex: WorkoutProposalExercise): string {
  return [
    ex.sets != null && ex.reps != null && `${ex.sets}×${ex.reps}`,
    ex.duration_seconds != null && ex.duration_seconds > 0 && `${ex.duration_seconds}s`,
    ex.duration_minutes != null && ex.sets == null && `${ex.duration_minutes} min`,
    ex.rpe ? (ex.rpe.toLowerCase().includes("rpe") ? ex.rpe : `RPE ${ex.rpe}`) : null,
    ex.rest_between_sets_seconds != null && ex.rest_between_sets_seconds > 0
      ? `${ex.rest_between_sets_seconds}s between sets`
      : null,
    ex.rest_after_seconds > 0 ? `${ex.rest_after_seconds}s rest` : null,
  ]
    .filter(Boolean)
    .join(" · ");
}

function sessionMinutes(session: ProgramProposalSession): number | null {
  if (session.duration_minutes != null && session.duration_minutes > 0) {
    return session.duration_minutes;
  }
  if (session.exercises.length === 0) return null;
  return estimateWorkoutMinutes(session.exercises);
}

function weekNumber(name: string, index: number, perWeek: number): number {
  const match = name.match(/week\s*(\d+)/i);
  if (match) {
    const n = Number(match[1]);
    if (n > 0 && n < 100) return n;
  }
  return Math.floor(index / Math.max(1, perWeek)) + 1;
}

function groupSessionsByWeek(proposal: ProgramProposal): { week: number; sessions: ProgramProposalSession[] }[] {
  const groups = new Map<number, ProgramProposalSession[]>();
  proposal.sessions.forEach((session, index) => {
    const week = weekNumber(session.name, index, proposal.sessions_per_week);
    const list = groups.get(week) ?? [];
    list.push(session);
    groups.set(week, list);
  });
  return [...groups.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([week, sessions]) => ({ week, sessions }));
}

function ChoiceCard({
  selected,
  title,
  hint,
  onClick,
}: {
  selected: boolean;
  title: string;
  hint: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`rounded-2xl border px-4 py-3 text-left transition ${
        selected
          ? "border-black bg-white shadow-[0_0_0_1px_#000]"
          : "border-gray-200 bg-white hover:border-gray-300"
      }`}
    >
      <span className="flex items-start justify-between gap-3">
        <span>
          <span className="block text-sm font-semibold text-gray-900">{title}</span>
          <span className="mt-0.5 block text-xs leading-relaxed text-gray-500">{hint}</span>
        </span>
        <span
          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
            selected ? "bg-[#ccff00] text-black" : "border border-gray-200 text-transparent"
          }`}
        >
          <Check className="h-3 w-3" />
        </span>
      </span>
    </button>
  );
}

function Pill({
  selected,
  children,
  onClick,
}: {
  selected: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
        selected
          ? "bg-black text-white"
          : "border border-gray-200 bg-white text-gray-700 hover:border-gray-300"
      }`}
    >
      {children}
    </button>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <h2 className="text-sm font-semibold text-gray-900">{children}</h2>;
}

function ExerciseBlock({ exercises }: { exercises: WorkoutProposalExercise[] }) {
  const phased = groupExercisesByPhase(
    exercises.map((ex) => ({ ...ex, sessionPhase: ex.phase }))
  );
  const rendered = new Set<string>();

  return (
    <div className="space-y-3">
      {phased.map(({ phase, items }) => (
        <div key={phase}>
          <p className="text-[11px] font-semibold tracking-wide text-gray-400 uppercase">
            {SESSION_PHASE_LABELS[phase]}
          </p>
          <ul className="mt-1.5 space-y-1.5">
            {items.map((ex) => {
              if (ex.choice_group) {
                if (rendered.has(ex.choice_group)) return null;
                rendered.add(ex.choice_group);
                const options = items.filter((item) => item.choice_group === ex.choice_group);
                return (
                  <li key={ex.choice_group} className="text-sm text-gray-700">
                    <span className="text-gray-400">Pick one · </span>
                    {options.map((opt, i) => (
                      <span key={opt.exercise_id}>
                        {i > 0 ? "  /  " : ""}
                        <span className="font-medium text-gray-900">{opt.title}</span>
                        <span className="text-gray-500"> ({formatExerciseMeta(opt)})</span>
                      </span>
                    ))}
                  </li>
                );
              }
              return (
                <li key={ex.exercise_id} className="text-sm">
                  <span className="font-medium text-gray-900">{ex.title}</span>
                  {formatExerciseMeta(ex) ? (
                    <span className="text-gray-500"> · {formatExerciseMeta(ex)}</span>
                  ) : null}
                  {ex.note ? <span className="mt-0.5 block text-xs text-gray-500">{ex.note}</span> : null}
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}

function PlanOverview({
  kind,
  proposal,
  workout,
  form,
  saved,
  debugLog,
  openWeeks,
  onToggleWeek,
  onExpandAll,
}: {
  kind: BuildKind;
  proposal: ProgramProposal | null;
  workout: WorkoutProposal | null;
  form: CoachFormState;
  saved: GeneratedWorkout | null;
  debugLog: AiGenerationDebugLog | null;
  openWeeks: Record<number, boolean>;
  onToggleWeek: (week: number, open: boolean) => void;
  onExpandAll: (open: boolean, weeks: number[]) => void;
}) {
  const plan = proposal;
  const single = workout;
  const title = plan?.title ?? single?.title ?? "Your plan";
  const description = plan?.description ?? single?.description ?? "";
  const rationale = (plan?.design_rationale ?? single?.design_rationale)?.trim();
  const body = plan?.body?.trim();
  const weeks = groupSessionsByWeek(
    plan ?? {
      title,
      description,
      duration_weeks: 1,
      sessions_per_week: 1,
      sessions: single
        ? [
            {
              name: single.title,
              description: single.description,
              exercises: single.exercises,
            },
          ]
        : [],
    }
  );
  const sessionCount = plan?.sessions.length ?? (single ? 1 : 0);
  const exerciseCount =
    plan?.sessions.reduce((sum, session) => sum + session.exercises.length, 0) ??
    single?.exercises.length ??
    0;
  const expected =
    plan != null ? plan.duration_weeks * plan.sessions_per_week : sessionCount;
  const location = locationLabel(plan?.location_slug || form.location || undefined);
  const minutes = plan?.minutes_per_session ?? form.minutes;
  const allWeekNumbers = weeks.map((group) => group.week);
  const allOpen = allWeekNumbers.every((week) =>
    week in openWeeks ? openWeeks[week] : week === weeks[0]?.week
  );

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-8">
      {saved && (
        <div className="overflow-hidden rounded-2xl border border-emerald-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start">
            {saved.coverImageUrl ? (
              <img
                src={saved.coverImageUrl}
                alt=""
                className="h-28 w-full rounded-xl object-cover sm:h-24 sm:w-36"
              />
            ) : null}
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-2 text-sm font-semibold text-emerald-800">
                <CheckCircle2 className="h-4 w-4" />
                {saved.status === "published" ? "Published" : "Saved as draft"}
              </p>
              <p className="mt-1 text-sm text-gray-600">
                {saved.status === "published"
                  ? "Members can enroll and start these workouts."
                  : "Members cannot open this yet. Publish it from the editor when it is ready."}
              </p>
              {saved.coverPending && !saved.coverImageUrl ? (
                <p className="mt-2 text-xs text-gray-500">Generating cover image…</p>
              ) : null}
              <div className="mt-3 flex flex-wrap gap-2">
                <Link
                  href={`/admin/programs/${saved.programId}/edit`}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50"
                >
                  <Pencil className="h-4 w-4" />
                  Edit program
                </Link>
                {saved.status === "published" && saved.slug ? (
                  <Link
                    href={`/programs/${saved.slug}`}
                    target="_blank"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50"
                  >
                    <ExternalLink className="h-4 w-4" />
                    View program
                  </Link>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 bg-[radial-gradient(ellipse_at_top_left,rgba(204,255,0,0.35),transparent_55%)] px-6 py-6 sm:px-8">
          <p className="text-xs font-semibold tracking-[0.16em] text-gray-500 uppercase">
            {kind === "program" ? "Program overview" : "Workout overview"}
          </p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">{title}</h2>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-gray-600 sm:text-base">
            {description}
          </p>
          <dl className="mt-5 flex flex-wrap gap-2">
            {kind === "program" && plan ? (
              <Stat icon={<Clock className="h-3.5 w-3.5" />} label={`${plan.duration_weeks} weeks`} />
            ) : null}
            {kind === "program" && plan ? (
              <Stat
                icon={<CalendarDays className="h-3.5 w-3.5" />}
                label={`${plan.sessions_per_week}× / week`}
              />
            ) : null}
            <Stat icon={<Clock className="h-3.5 w-3.5" />} label={`${minutes} min`} />
            <Stat icon={<Dumbbell className="h-3.5 w-3.5" />} label={`${sessionCount} workout${sessionCount === 1 ? "" : "s"}`} />
            <Stat icon={<MapPin className="h-3.5 w-3.5" />} label={location} />
            <Stat label={`${exerciseCount} exercises`} />
          </dl>
          {plan && sessionCount < expected ? (
            <p className="mt-4 text-sm text-amber-800">
              This draft has {sessionCount} workouts. A full {plan.duration_weeks}-week plan at{" "}
              {plan.sessions_per_week} sessions a week would be {expected}.
            </p>
          ) : null}
        </div>

        {rationale ? (
          <div className="border-b border-gray-100 px-6 py-5 sm:px-8">
            <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase">Coach summary</p>
            <p className="mt-2 max-w-3xl whitespace-pre-wrap text-sm leading-relaxed text-gray-800">
              {rationale}
            </p>
          </div>
        ) : null}

        {body && body !== description ? (
          <div className="border-b border-gray-100 px-6 py-5 sm:px-8">
            <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase">About this plan</p>
            <p className="mt-2 max-w-3xl whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
              {body}
            </p>
          </div>
        ) : null}

        <div className="px-6 py-6 sm:px-8">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-gray-900">
              {kind === "program" ? "The plan" : "The workout"}
            </h3>
            {kind === "program" && allWeekNumbers.length > 1 ? (
              <button
                type="button"
                onClick={() => onExpandAll(!allOpen, allWeekNumbers)}
                className="text-xs font-medium text-gray-500 hover:text-gray-900"
              >
                {allOpen ? "Collapse weeks" : "Expand all weeks"}
              </button>
            ) : null}
          </div>

          <div className="mt-4 space-y-4">
            {weeks.map((group) => {
              const weekOpen =
                kind === "workout"
                  ? true
                  : group.week in openWeeks
                    ? openWeeks[group.week]
                    : group.week === weeks[0]?.week;
              return (
                <section key={group.week} className="overflow-hidden rounded-2xl border border-gray-200">
                  {kind === "program" ? (
                    <button
                      type="button"
                      onClick={() => onToggleWeek(group.week, !weekOpen)}
                      className="flex w-full items-center justify-between gap-3 bg-gray-50 px-4 py-3 text-left"
                    >
                      <span>
                        <span className="block text-sm font-semibold text-gray-900">Week {group.week}</span>
                        <span className="text-xs text-gray-500">
                          {group.sessions.length} workout{group.sessions.length === 1 ? "" : "s"}
                        </span>
                      </span>
                      <span className="text-xs font-medium text-gray-500">{weekOpen ? "Hide" : "Show"}</span>
                    </button>
                  ) : null}
                  {weekOpen ? (
                    <div className="divide-y divide-gray-100">
                      {group.sessions.map((session, index) => {
                        const mins = sessionMinutes(session);
                        return (
                          <article key={`${session.name}-${index}`} className="px-4 py-4">
                            <div className="flex flex-wrap items-baseline justify-between gap-2">
                              <h4 className="text-sm font-semibold text-gray-900">{session.name}</h4>
                              <p className="text-xs text-gray-500">
                                {[
                                  mins != null ? `${mins} min` : null,
                                  `${session.exercises.length} exercises`,
                                ]
                                  .filter(Boolean)
                                  .join(" · ")}
                              </p>
                            </div>
                            {session.description ? (
                              <p className="mt-1 text-sm leading-relaxed text-gray-600">
                                {session.description}
                              </p>
                            ) : null}
                            <div className="mt-3">
                              <ExerciseBlock exercises={session.exercises} />
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  ) : null}
                </section>
              );
            })}
          </div>
        </div>
      </div>

      {debugLog ? <AiGenerationDebugPanel log={debugLog} /> : null}
    </div>
  );
}

function Stat({ icon, label }: { icon?: ReactNode; label: string }) {
  return (
    <div className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-medium text-gray-700">
      {icon}
      {label}
    </div>
  );
}

export function AiCoachClient({
  initialCatalog,
  members,
  equipmentOptions,
}: {
  initialCatalog: ProgramCatalogRow[];
  members: MemberPickerOption[];
  equipmentOptions: string[];
}) {
  const [catalog] = useState(initialCatalog);
  const [targetUserId, setTargetUserId] = useState("");
  const [trainingLevel, setTrainingLevel] = useState("");
  const [form, setForm] = useState<CoachFormState>(EMPTY_FORM);
  const [equipmentQuery, setEquipmentQuery] = useState("");
  const [phase, setPhase] = useState<Phase>("form");
  const [program, setProgram] = useState<ProgramProposal | null>(null);
  const [workout, setWorkout] = useState<WorkoutProposal | null>(null);
  const [debugLog, setDebugLog] = useState<AiGenerationDebugLog | null>(null);
  const [saved, setSaved] = useState<GeneratedWorkout | null>(null);
  const [openWeeks, setOpenWeeks] = useState<Record<number, boolean>>({ 1: true });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollerRef.current?.scrollTo({ top: 0 });
  }, [phase]);

  const filteredEquipment = useMemo(() => {
    const q = equipmentQuery.trim().toLowerCase();
    if (!q) return equipmentOptions;
    return equipmentOptions.filter((title) => title.toLowerCase().includes(q));
  }, [equipmentOptions, equipmentQuery]);

  const minuteOptions = form.kind === "program" ? PROGRAM_MINUTE_OPTIONS : WORKOUT_MINUTE_OPTIONS;

  function patch(partial: Partial<CoachFormState>) {
    setForm((prev) => ({ ...prev, ...partial }));
  }

  function toggleEquipment(title: string) {
    setForm((prev) => {
      const selected = prev.equipment.includes(title);
      return {
        ...prev,
        bodyweightOnly: false,
        equipment: selected
          ? prev.equipment.filter((item) => item !== title)
          : [...prev.equipment, title],
      };
    });
  }

  async function handleBuild() {
    const problem = formError(form);
    if (problem) {
      setError(problem);
      return;
    }
    if (!form.location) return;

    setError(null);
    setSaved(null);
    setProgram(null);
    setWorkout(null);
    setDebugLog(null);
    setPhase("generating");

    const request = buildCoachRequest(form);
    const res = await sendAiCoachMessage({
      history: request.history,
      userMessage: request.userMessage,
      programsCatalog: catalog,
      targetUserId: targetUserId || null,
      trainingLevel: trainingLevel || null,
      creationKind: request.creationKind,
    });

    if ("error" in res) {
      setError(res.error);
      setPhase("form");
      return;
    }

    if (res.type === "program_proposal") {
      setProgram(res.proposal);
      setWorkout(null);
      setDebugLog(res.debugLog);
      setOpenWeeks({ 1: true });
      setPhase("overview");
      return;
    }

    if (res.type === "workout_proposal") {
      setWorkout(res.proposal);
      setProgram(null);
      setDebugLog(res.debugLog);
      setPhase("overview");
      return;
    }

    const fallback =
      res.type === "consultation"
        ? res.text
        : res.type === "text"
          ? res.text
          : res.type === "recommend_programs"
            ? res.introText
            : "The coach did not return a plan. Adjust the form and try again.";
    setError(fallback);
    setPhase("form");
  }

  async function pollCover(programId: string, attempt = 0) {
    if (attempt > 12) return;
    await new Promise((r) => setTimeout(r, 4000));
    const res = await getProgramCoverUrl(programId);
    if ("error" in res) return;
    if (res.imageUrl) {
      setSaved((prev) =>
        prev?.programId === programId
          ? { ...prev, coverImageUrl: res.imageUrl!, coverPending: false }
          : prev
      );
      return;
    }
    void pollCover(programId, attempt + 1);
  }

  async function handleSaveProgram(publish: boolean) {
    if (!program) return;
    setSaving(true);
    setError(null);
    try {
      const payload = JSON.parse(JSON.stringify(program)) as ProgramProposal;
      const response = await fetch("/api/admin/ai-coach/save-program", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          proposal: payload,
          publish,
          generateCover: true,
          trainingLevel: trainingLevel || null,
        }),
      });

      let res: {
        ok?: true;
        error?: string;
        programId?: string;
        slug?: string;
        title?: string;
        description?: string;
        sessionCount?: number;
        coverPending?: boolean;
        status?: "draft" | "published";
      };
      try {
        res = (await response.json()) as typeof res;
      } catch {
        setError(
          `Save failed (HTTP ${response.status}). The server returned a non-JSON response — check the terminal log.`
        );
        return;
      }

      if (!response.ok || res.error || !res.ok || !res.programId) {
        setError(res.error || `Could not save program (HTTP ${response.status}).`);
        return;
      }

      setSaved({
        programId: res.programId,
        slug: res.slug ?? "",
        title: res.title ?? program.title,
        description: res.description ?? program.description,
        status: res.status ?? (publish ? "published" : "draft"),
        coverPending: Boolean(res.coverPending),
        designRationale: program.design_rationale?.trim() || undefined,
      });
      if (res.coverPending) void pollCover(res.programId);
      scrollerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      const message =
        e instanceof Error && e.message.trim()
          ? e.message
          : "Could not save the program. Check your connection and try again.";
      setError(message);
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveWorkout(publish: boolean) {
    if (!workout) return;
    setSaving(true);
    setError(null);
    const res = await saveAiCoachWorkout(workout, {
      publish,
      generateCover: true,
      trainingLevel: trainingLevel || null,
    });
    setSaving(false);
    if ("error" in res) {
      setError(res.error);
      return;
    }
    setSaved({
      programId: res.programId,
      slug: res.slug,
      title: res.title,
      description: res.description,
      status: res.status,
      coverPending: res.coverPending,
      designRationale: workout.design_rationale?.trim() || undefined,
    });
    if (res.coverPending) void pollCover(res.programId);
    scrollerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }

  const blockedCount = Object.values(form.blocked).filter(Boolean).length;

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-gray-50">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-gray-200 bg-white px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/programs"
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Programs
          </Link>
          <span className="text-gray-300">/</span>
          <h1 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
            <Sparkles className="h-5 w-5 text-[#9dcc00]" />
            AI Coach
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-sm">
            <span className="whitespace-nowrap text-gray-500">Training level</span>
            <select
              value={trainingLevel}
              onChange={(e) => setTrainingLevel(e.target.value)}
              className="rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-black"
            >
              <option value="">
                {targetUserId ? "Auto — from member onboarding" : "Auto — not set"}
              </option>
              {TRAINING_LEVEL_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm">
            <span className="whitespace-nowrap text-gray-500">Personalize for</span>
            <select
              value={targetUserId}
              onChange={(e) => setTargetUserId(e.target.value)}
              className="max-w-52 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-black"
            >
              <option value="">No member (generic)</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                  {m.email ? ` (${m.email})` : ""}
                </option>
              ))}
            </select>
          </label>
          <p className="hidden text-xs text-gray-500 lg:block">
            {catalog.length} published program{catalog.length === 1 ? "" : "s"} in catalog
          </p>
          <Link
            href="/admin/programs/ai/prompts"
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Edit prompts
          </Link>
        </div>
      </div>

      <div ref={scrollerRef} className="min-h-0 flex-1 overflow-y-auto px-4 py-6 sm:px-8">
        {phase === "form" && (
          <div className="mx-auto max-w-3xl">
            <div className="mb-6">
              <p className="text-xs font-semibold tracking-[0.16em] text-gray-500 uppercase">AI Coach</p>
              <h2 className="mt-1 text-2xl font-bold tracking-tight text-gray-900">Build a plan</h2>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-gray-600">
                Fill this in once. The coach writes the program, then you get the full plan —
                summary, weeks, and every workout — before anything is saved.
              </p>
            </div>

            {error ? (
              <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                {error}
              </div>
            ) : null}

            <div className="space-y-8 rounded-3xl border border-gray-200 bg-white p-5 shadow-sm sm:p-7">
              <section className="space-y-3">
                <SectionLabel>What should this be?</SectionLabel>
                <div className="grid gap-3 sm:grid-cols-2">
                  <ChoiceCard
                    selected={form.kind === "program"}
                    title="Multi-week program"
                    hint="A full block with several workouts each week."
                    onClick={() => patch({ kind: "program", minutes: form.kind === "workout" ? 45 : form.minutes })}
                  />
                  <ChoiceCard
                    selected={form.kind === "workout"}
                    title="Single workout"
                    hint="One session — activation, recovery, or a focused day."
                    onClick={() =>
                      patch({
                        kind: "workout",
                        minutes: PROGRAM_MINUTE_OPTIONS.includes(form.minutes) ? 20 : form.minutes,
                      })
                    }
                  />
                </div>
              </section>

              <section className="space-y-3">
                <SectionLabel>What is the focus?</SectionLabel>
                <div className="flex flex-wrap gap-2">
                  {GOAL_PRESETS.map((preset) => {
                    const selected = form.goal === preset.text;
                    return (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() =>
                          patch({
                            goal: preset.text,
                            kind: preset.kind ?? form.kind,
                            minutes:
                              preset.kind === "workout"
                                ? 20
                                : form.kind === "workout" && !preset.kind
                                  ? form.minutes
                                  : form.minutes,
                          })
                        }
                        className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                          selected
                            ? "bg-black text-white"
                            : "border border-gray-200 bg-gray-50 text-gray-700 hover:border-gray-300"
                        }`}
                      >
                        {preset.label}
                      </button>
                    );
                  })}
                </div>
                <textarea
                  value={form.goal}
                  onChange={(e) => patch({ goal: e.target.value })}
                  rows={3}
                  placeholder="Example: build shoulder durability and first-step speed for an intermediate player who competes twice a week."
                  className="w-full resize-y rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm leading-relaxed text-gray-900 placeholder:text-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-black"
                />
              </section>

              <section className="space-y-3">
                <SectionLabel>Where will they train?</SectionLabel>
                <div className="grid gap-3 sm:grid-cols-3">
                  {LOCATION_OPTIONS.map((loc) => (
                    <ChoiceCard
                      key={loc.slug}
                      selected={form.location === loc.slug}
                      title={loc.label}
                      hint={loc.hint}
                      onClick={() => patch({ location: loc.slug })}
                    />
                  ))}
                </div>
              </section>

              {form.location === "home" ? (
                <section className="space-y-3">
                  <SectionLabel>What equipment is at home?</SectionLabel>
                  <div className="flex flex-wrap items-center gap-2">
                    <Pill
                      selected={form.bodyweightOnly}
                      onClick={() => patch({ bodyweightOnly: true, equipment: [] })}
                    >
                      Bodyweight only
                    </Pill>
                    {equipmentOptions.length > 8 ? (
                      <input
                        value={equipmentQuery}
                        onChange={(e) => setEquipmentQuery(e.target.value)}
                        placeholder="Search equipment"
                        className="min-w-40 flex-1 rounded-full border border-gray-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                      />
                    ) : null}
                  </div>
                  <div className="flex max-h-48 flex-wrap gap-2 overflow-y-auto">
                    {filteredEquipment.map((title) => (
                      <Pill
                        key={title}
                        selected={!form.bodyweightOnly && form.equipment.includes(title)}
                        onClick={() => toggleEquipment(title)}
                      >
                        {title}
                      </Pill>
                    ))}
                    {filteredEquipment.length === 0 ? (
                      <p className="text-sm text-gray-500">No equipment matches that search.</p>
                    ) : null}
                  </div>
                </section>
              ) : null}

              {form.kind === "program" ? (
                <section className="space-y-3">
                  <SectionLabel>Any movements to avoid?</SectionLabel>
                  <div className="flex flex-wrap gap-2">
                    <Pill selected={form.movementOk} onClick={() => patch({ movementOk: true })}>
                      All movements feel fine
                    </Pill>
                    <Pill
                      selected={!form.movementOk}
                      onClick={() => patch({ movementOk: false })}
                    >
                      There are limits{!form.movementOk && blockedCount > 0 ? ` (${blockedCount})` : ""}
                    </Pill>
                  </div>
                  {!form.movementOk ? (
                    <div className="flex flex-wrap gap-2">
                      {(
                        [
                          ["squat", "Can't squat"],
                          ["lunge", "Can't lunge"],
                          ["pushUp", "Can't do push-ups"],
                          ["jump", "No jumping"],
                        ] as const
                      ).map(([key, label]) => (
                        <Pill
                          key={key}
                          selected={form.blocked[key]}
                          onClick={() =>
                            patch({
                              blocked: { ...form.blocked, [key]: !form.blocked[key] },
                            })
                          }
                        >
                          {label}
                        </Pill>
                      ))}
                    </div>
                  ) : null}
                </section>
              ) : null}

              <section className="space-y-4">
                <SectionLabel>{form.kind === "program" ? "Schedule" : "How long?"}</SectionLabel>
                {form.kind === "program" ? (
                  <>
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-gray-500">Length</p>
                      <div className="flex flex-wrap gap-2">
                        {WEEK_OPTIONS.map((weeks) => (
                          <Pill
                            key={weeks}
                            selected={form.weeks === weeks}
                            onClick={() => patch({ weeks })}
                          >
                            {weeks} weeks
                          </Pill>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-gray-500">Sessions each week</p>
                      <div className="flex flex-wrap gap-2">
                        {SESSION_OPTIONS.map((sessionsPerWeek) => (
                          <Pill
                            key={sessionsPerWeek}
                            selected={form.sessionsPerWeek === sessionsPerWeek}
                            onClick={() => patch({ sessionsPerWeek })}
                          >
                            {sessionsPerWeek}× / week
                          </Pill>
                        ))}
                      </div>
                    </div>
                  </>
                ) : null}
                <div className="space-y-2">
                  <p className="text-xs font-medium text-gray-500">
                    {form.kind === "program" ? "Minutes per session" : "Session length"}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {minuteOptions.map((minutes) => (
                      <Pill
                        key={minutes}
                        selected={form.minutes === minutes}
                        onClick={() => patch({ minutes })}
                      >
                        {minutes} min
                      </Pill>
                    ))}
                  </div>
                </div>
              </section>

              <div className="flex flex-col gap-3 border-t border-gray-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
                <p className="flex items-start gap-2 text-xs leading-relaxed text-gray-500">
                  <Target className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  Uses published exercises only. Nothing is saved until you review the plan.
                </p>
                <button
                  type="button"
                  onClick={() => void handleBuild()}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#ccff00] px-5 py-3 text-sm font-semibold text-black transition hover:bg-[#b3e600]"
                >
                  <Sparkles className="h-4 w-4" />
                  {form.kind === "program" ? "Build program" : "Build workout"}
                </button>
              </div>
            </div>
          </div>
        )}

        {phase === "generating" && (
          <div className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-center justify-center text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-black text-[#ccff00]">
              <Loader2 className="h-6 w-6 animate-spin" />
            </span>
            <h2 className="mt-5 text-xl font-bold tracking-tight text-gray-900">
              {form.kind === "program" ? "Writing the program" : "Writing the workout"}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-gray-600">
              The coach is picking exercises and laying out every session. This often takes a minute
              or two.
            </p>
            <ul className="mt-6 space-y-1 text-sm text-gray-500">
              <li>{form.goal.trim()}</li>
              <li>
                {locationLabel(form.location)}
                {form.kind === "program"
                  ? ` · ${form.weeks} weeks · ${form.sessionsPerWeek}× / week · ${form.minutes} min`
                  : ` · ${form.minutes} min`}
              </li>
              {form.location === "home" ? (
                <li className="inline-flex items-center justify-center gap-1.5">
                  <Home className="h-3.5 w-3.5" />
                  {form.bodyweightOnly ? "Bodyweight only" : form.equipment.join(", ")}
                </li>
              ) : null}
            </ul>
          </div>
        )}

        {phase === "overview" && (
          <PlanOverview
            kind={form.kind}
            proposal={program}
            workout={workout}
            form={form}
            saved={saved}
            debugLog={debugLog}
            openWeeks={openWeeks}
            onToggleWeek={(week, open) =>
              setOpenWeeks((prev) => ({ ...prev, [week]: open }))
            }
            onExpandAll={(open, weeks) => {
              const next: Record<number, boolean> = {};
              for (const week of weeks) next[week] = open;
              setOpenWeeks(next);
            }}
          />
        )}
      </div>

      {phase === "overview" && (
        <div className="shrink-0 border-t border-gray-200 bg-white px-4 py-3 sm:px-8">
          <div className="mx-auto flex max-w-5xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={() => {
                setError(null);
                setPhase("form");
              }}
              className="text-sm font-medium text-gray-600 hover:text-gray-900"
            >
              Adjust answers
            </button>
            <div className="flex flex-col gap-2 sm:items-end">
              {error ? <p className="text-sm text-red-700">{error}</p> : null}
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={saving || (!program && !workout)}
                  onClick={() =>
                    void (program ? handleSaveProgram(false) : handleSaveWorkout(false))
                  }
                  className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-800 hover:bg-gray-50 disabled:opacity-60"
                >
                  Save as draft
                </button>
                <button
                  type="button"
                  disabled={saving || (!program && !workout)}
                  onClick={() =>
                    void (program ? handleSaveProgram(true) : handleSaveWorkout(true))
                  }
                  className="inline-flex items-center gap-2 rounded-xl bg-black px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-60"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving…
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Publish
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
