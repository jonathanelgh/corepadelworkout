"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Bandage,
  Building2,
  CheckCircle2,
  Dumbbell,
  Flame,
  Home,
  Loader2,
  Play,
  Repeat,
  Search,
  Shuffle,
  Sparkles,
  Timer,
  Trash2,
  Trophy,
  UnfoldVertical,
  X,
  Zap,
  type LucideIcon,
} from "lucide-react";
import type { ProgramCatalogRow } from "@/lib/programs/programs-catalog";
import type {
  ChatHistoryMessage,
  ProgramProposal,
  ProgramProposalSession,
  WorkoutProposalExercise,
} from "@/lib/programs/ai-coach-gemini";
import {
  groupExercisesByPhase,
  SESSION_PHASE_LABELS,
} from "@/lib/programs/session-phase";
import { estimateWorkoutMinutes } from "@/lib/programs/estimate-workout-minutes";
import {
  loadMemberCoachData,
  saveMemberCoachProgram,
  sendMemberCoachMessage,
} from "@/app/member/member-coach-actions";
import { useCoachFormChrome } from "@/components/member/coach-form-chrome";
import { ExerciseVideoButton } from "@/app/programs/exercise-video-button";
import { filterSwapExercises, type SwapExerciseOption } from "@/lib/programs/swap-exercises";

type LocationSlug = "gym" | "home" | "at-the-court";
type StepId =
  | "goal"
  | "injury"
  | "injury-results"
  | "location"
  | "equipment"
  | "movement"
  | "weeks"
  | "sessions"
  | "minutes";

type InjuryArea =
  | "elbow-inner"
  | "elbow-outer"
  | "ankle"
  | "knee"
  | "back-lower"
  | "back-upper"
  | "neck"
  | "hip"
  | "shoulder"
  | "wrist";
type Phase = "form" | "generating" | "overview";

type MovementBlocks = {
  squat: boolean;
  lunge: boolean;
  pushUp: boolean;
  jump: boolean;
};

const GOALS: {
  id: "stamina" | "strength" | "speed" | "flexibility" | "coordination" | "overall";
  title: string;
  subtitle: string;
  icon: LucideIcon;
}[] = [
  { id: "stamina", title: "Stamina", subtitle: "Having trouble playing long?", icon: Flame },
  { id: "strength", title: "Strength", subtitle: "Trouble keeping low?", icon: Dumbbell },
  { id: "speed", title: "Speed", subtitle: "Too late at the net?", icon: Zap },
  { id: "flexibility", title: "Flexibility", subtitle: "Trouble with overheads?", icon: UnfoldVertical },
  { id: "coordination", title: "Coordination", subtitle: "Trouble off the glass?", icon: Shuffle },
  { id: "overall", title: "Overall padel fitness", subtitle: "A balanced plan for the whole game", icon: Trophy },
];

type FocusId = (typeof GOALS)[number]["id"];

const INJURY_GROUPS: { label: string; options: { id: InjuryArea; title: string }[] }[] = [
  {
    label: "Elbow",
    options: [
      { id: "elbow-inner", title: "Inner" },
      { id: "elbow-outer", title: "Outer" },
    ],
  },
  { label: "Ankle", options: [{ id: "ankle", title: "Ankle" }] },
  { label: "Knee", options: [{ id: "knee", title: "Knee" }] },
  {
    label: "Back",
    options: [
      { id: "back-lower", title: "Lower back" },
      { id: "back-upper", title: "Upper back" },
      { id: "neck", title: "Neck" },
    ],
  },
  { label: "Hip", options: [{ id: "hip", title: "Hip" }] },
  { label: "Shoulder", options: [{ id: "shoulder", title: "Shoulder" }] },
  { label: "Wrist", options: [{ id: "wrist", title: "Wrist" }] },
];

function injuryLabel(area: InjuryArea): string {
  for (const group of INJURY_GROUPS) {
    const option = group.options.find((item) => item.id === area);
    if (!option) continue;
    return group.options.length === 1 ? group.label : `${group.label}, ${option.title.toLowerCase()}`;
  }
  return "this area";
}

/** Match a published program title to an injury. Summary text is too broad (warm-ups mention several joints). */
function programMatchesInjury(title: string, area: InjuryArea): boolean {
  if (area === "elbow-inner") return /\b(inner elbow|golfer)/i.test(title);
  if (area === "elbow-outer") return /\belbow\b/i.test(title) && !/\binner\b/i.test(title);
  if (area === "ankle") return /\bankle\b/i.test(title);
  if (area === "knee") return /\bknee\b/i.test(title);
  if (area === "back-lower") return /\b(lower back|lumbar)\b/i.test(title);
  if (area === "back-upper") return /\b(upper back|thoracic)\b/i.test(title);
  if (area === "neck") return /\bneck\b/i.test(title);
  if (area === "hip") return /\bhips?\b/i.test(title);
  if (area === "shoulder") return /\bshoulder\b/i.test(title);
  return /\bwrist\b/i.test(title);
}

const LOCATIONS: { slug: LocationSlug; title: string; subtitle: string; icon: typeof Dumbbell }[] = [
  { slug: "gym", title: "At the gym", subtitle: "Weights, cables, machines", icon: Dumbbell },
  { slug: "home", title: "At home", subtitle: "Bodyweight or the gear you have", icon: Home },
  { slug: "at-the-court", title: "At the court", subtitle: "Before or after you play", icon: Building2 },
];

const WEEK_OPTIONS = [4, 6, 8, 12];
const SESSION_OPTIONS = [2, 3, 4, 5];
const MINUTE_OPTIONS = [20, 30, 45, 60];

const LOCATION_REPLY: Record<LocationSlug, string> = {
  gym: "gym",
  home: "home",
  "at-the-court": "at the court",
};

function stepsFor(location: LocationSlug | "", injury = false): StepId[] {
  if (injury) return ["goal", "injury", "injury-results"];
  const steps: StepId[] = ["goal", "location"];
  if (location === "home") steps.push("equipment");
  steps.push("movement", "weeks", "sessions", "minutes");
  return steps;
}

function buildProgramRequest(input: {
  goals: FocusId[];
  customGoal: string;
  location: LocationSlug;
  equipment: string[];
  bodyweightOnly: boolean;
  movementOk: boolean;
  blocked: MovementBlocks;
  weeks: number;
  sessionsPerWeek: number;
  minutes: number;
}): { history: ChatHistoryMessage[]; userMessage: string } {
  const selected = GOALS.filter((item) => input.goals.includes(item.id));
  const custom = input.customGoal.trim();
  const focus =
    custom ||
    selected.map((item) => `${item.title}: ${item.subtitle.replace(/\?$/, "")}`).join(". ") ||
    "Training";
  const parts = [
    "Build a custom program.",
    `${input.weeks} week program.`,
    `${input.sessionsPerWeek} sessions per week.`,
    `${input.minutes} minutes per session.`,
  ];
  if (input.movementOk) {
    parts.push("Movement: yes to all.");
  } else {
    const limits: string[] = [];
    if (input.blocked.squat) limits.push("can't squat");
    if (input.blocked.lunge) limits.push("can't lunge");
    if (input.blocked.pushUp) limits.push("can't do push-ups");
    if (input.blocked.jump) limits.push("no jumping");
    parts.push(limits.length > 0 ? `Movement limits: ${limits.join(", ")}.` : "Movement: yes to all.");
  }
  if (input.location === "home") {
    parts.push(
      input.bodyweightOnly || input.equipment.length === 0
        ? "Home equipment: bodyweight only."
        : `Home equipment: ${input.equipment.join(", ")}.`
    );
  }
  parts.push(`Focus: ${focus}`);
  return {
    history: [{ role: "user", parts: [{ text: parts.join(" ") }] }],
    userMessage: LOCATION_REPLY[input.location],
  };
}

function formatExerciseMeta(ex: WorkoutProposalExercise): string {
  return [
    ex.sets != null && ex.reps != null && `${ex.sets}×${ex.reps}`,
    ex.duration_seconds != null && ex.duration_seconds > 0 && `${ex.duration_seconds}s`,
    ex.duration_minutes != null && ex.sets == null && `${ex.duration_minutes} min`,
    ex.rest_after_seconds > 0 ? `${ex.rest_after_seconds}s rest` : null,
  ]
    .filter(Boolean)
    .join(" · ");
}

function sessionMinutes(session: ProgramProposalSession): number | null {
  if (session.duration_minutes != null && session.duration_minutes > 0) return session.duration_minutes;
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

function ChoiceRow({
  selected,
  title,
  subtitle,
  icon: Icon,
  onClick,
}: {
  selected: boolean;
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`flex w-full items-center gap-4 rounded-2xl border-2 p-4 text-left transition ${
        selected
          ? "border-[#ccff00] bg-[#ccff00]/10"
          : "border-zinc-300 bg-white hover:border-zinc-400"
      }`}
    >
      {Icon ? (
        <span
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
            selected ? "bg-[#ccff00] text-zinc-950" : "bg-zinc-100 text-zinc-700"
          }`}
        >
          <Icon className="h-6 w-6" />
        </span>
      ) : null}
      <span className="min-w-0">
        <span className="block font-semibold text-zinc-900">{title}</span>
        {subtitle ? <span className="mt-1 block text-sm text-zinc-600">{subtitle}</span> : null}
      </span>
    </button>
  );
}

function InjuryProgramList({ programs }: { programs: ProgramCatalogRow[] }) {
  if (programs.length === 0) {
    return (
      <p className="mt-6 rounded-2xl border border-zinc-200 bg-white px-4 py-5 text-sm leading-relaxed text-zinc-600">
        We don’t have a premade program for this yet.
      </p>
    );
  }
  return (
    <ul className="mt-6 space-y-3">
      {programs.map((program) => (
        <li key={program.id}>
          <Link
            href={`/programs/${program.slug}`}
            className="flex items-start gap-3 rounded-2xl border border-zinc-200 bg-white p-3"
          >
            {program.cover_image_url ? (
              <img
                src={program.cover_image_url}
                alt=""
                className="h-[4.75rem] w-[4.75rem] shrink-0 rounded-2xl object-cover"
              />
            ) : (
              <span className="flex h-[4.75rem] w-[4.75rem] shrink-0 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-400">
                <Dumbbell className="h-5 w-5" />
              </span>
            )}
            <span className="min-w-0">
              <span className="block font-semibold text-zinc-900">{program.title}</span>
              {program.summary ? (
                <span className="mt-1 block text-sm leading-snug text-zinc-600">
                  {program.summary.length > 90 ? `${program.summary.slice(0, 89).trim()}…` : program.summary}
                </span>
              ) : null}
              <span className="mt-1 block text-xs text-zinc-500">
                {[
                  program.weeks != null ? `${program.weeks} weeks` : null,
                  program.minutes != null ? `${program.minutes} min` : null,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function categoryLabel(category: string): string {
  return category.replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
}

function ExerciseThumb({
  title,
  imageUrl,
  videoUrl,
  size = "card",
}: {
  title: string;
  imageUrl: string | null;
  videoUrl: string | null;
  size?: "card" | "row";
}) {
  const image = imageUrl?.trim() || "";
  const video = videoUrl?.trim() || "";
  const frame = (
    <span
      className={`relative block overflow-hidden rounded-2xl bg-zinc-100 ${
        size === "row" ? "h-12 w-12 rounded-xl" : "h-[4.75rem] w-[4.75rem]"
      }`}
    >
      {image ? (
        <img src={image} alt="" className="h-full w-full object-cover" />
      ) : (
        <span className="flex h-full w-full items-center justify-center text-zinc-400">
          <Dumbbell className={size === "row" ? "h-4 w-4" : "h-5 w-5"} />
        </span>
      )}
      {video ? (
        <span className="absolute right-1 bottom-1 flex h-6 w-6 items-center justify-center rounded-full bg-white text-zinc-950 shadow-sm">
          <Play className="h-3 w-3 fill-current" />
        </span>
      ) : null}
    </span>
  );
  if (!video) return frame;
  return (
    <ExerciseVideoButton videoUrl={video} label={title}>
      {frame}
    </ExerciseVideoButton>
  );
}

function ExerciseList({
  exercises,
  mediaById,
  editable,
  onRemove,
  onSwitch,
}: {
  exercises: WorkoutProposalExercise[];
  mediaById: Map<string, SwapExerciseOption>;
  editable: boolean;
  onRemove: (index: number) => void;
  onSwitch: (index: number) => void;
}) {
  const phased = groupExercisesByPhase(
    exercises.map((ex, index) => ({ ...ex, sessionPhase: ex.phase, sourceIndex: index }))
  );
  return (
    <div className="space-y-4">
      {phased.map(({ phase, items }) => (
        <div key={phase}>
          <p className="text-[11px] font-semibold tracking-wide text-zinc-400 uppercase">
            {SESSION_PHASE_LABELS[phase]}
          </p>
          <ul className="mt-2 space-y-2">
            {items.map((ex) => {
              const media = mediaById.get(ex.exercise_id);
              return (
                <li
                  key={`${ex.sourceIndex}-${ex.exercise_id}`}
                  className="rounded-2xl border border-zinc-200 bg-white p-3"
                >
                  <div className="flex gap-3">
                    <ExerciseThumb
                      title={ex.title}
                      imageUrl={media?.imageUrl ?? null}
                      videoUrl={media?.videoUrl ?? null}
                    />
                    <div className="min-w-0 flex-1">
                      {ex.choice_group ? (
                        <p className="text-[11px] font-medium tracking-wide text-zinc-400 uppercase">Or</p>
                      ) : null}
                      <p className="font-semibold leading-snug text-zinc-900">{ex.title}</p>
                      {formatExerciseMeta(ex) ? (
                        <p className="mt-1 text-xs text-zinc-500">{formatExerciseMeta(ex)}</p>
                      ) : null}
                    </div>
                  </div>
                  {editable ? (
                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        onClick={() => onSwitch(ex.sourceIndex)}
                        className="flex-1 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-semibold text-zinc-800"
                      >
                        Switch
                      </button>
                      <button
                        type="button"
                        onClick={() => onRemove(ex.sourceIndex)}
                        disabled={exercises.length <= 1}
                        className="inline-flex flex-1 items-center justify-center gap-1 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-semibold text-red-700 disabled:opacity-40"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Remove
                      </button>
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}

function SwapExerciseModal({
  title,
  category,
  options,
  excludeIds,
  onClose,
  onPick,
}: {
  title: string;
  category: string;
  options: SwapExerciseOption[];
  excludeIds: string[];
  onClose: () => void;
  onPick: (exercise: SwapExerciseOption) => void;
}) {
  const [query, setQuery] = useState("");
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  const matches = filterSwapExercises({
    options,
    sourceCategories: category ? [category] : [],
    query,
    excludeIds,
  });
  const visible = matches.slice(0, 80);

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-zinc-950/50 p-0 sm:items-center sm:p-6">
      <button type="button" className="absolute inset-0 cursor-default" aria-label="Close" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="swap-exercise-title"
        className="relative flex max-h-[min(85dvh,720px)] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl bg-white shadow-xl sm:rounded-3xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-zinc-100 px-5 py-4">
          <div>
            <p id="swap-exercise-title" className="text-lg font-semibold text-zinc-900">
              Switch {title}
            </p>
            <p className="mt-1 text-sm text-zinc-600">
              {category
                ? `Showing ${categoryLabel(category)} exercises.`
                : "This exercise has no category, so the full library is searchable."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-zinc-200 text-zinc-700"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="border-b border-zinc-100 px-5 py-3">
          <label className="relative block">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search exercises"
              className="w-full rounded-xl border-2 border-zinc-300 py-2.5 pr-3 pl-9 text-sm text-zinc-900 outline-none focus:border-[#ccff00]/90"
            />
          </label>
        </div>
        <ul className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
          {options.length === 0 ? (
            <li className="px-2 py-8 text-center text-sm text-zinc-500">Loading exercises…</li>
          ) : visible.length === 0 ? (
            <li className="px-2 py-8 text-center text-sm text-zinc-500">No exercises match that search.</li>
          ) : (
            visible.map((exercise) => (
              <li key={exercise.id}>
                <button
                  type="button"
                  onClick={() => onPick(exercise)}
                  className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left hover:bg-zinc-50"
                >
                  <ExerciseThumb
                    title={exercise.title}
                    imageUrl={exercise.imageUrl}
                    videoUrl={null}
                    size="row"
                  />
                  <span className="font-medium text-zinc-900">{exercise.title}</span>
                </button>
              </li>
            ))
          )}
          {matches.length > visible.length ? (
            <li className="px-3 py-2 text-center text-xs text-zinc-500">Keep typing to narrow the list.</li>
          ) : null}
        </ul>
      </div>
    </div>
  );
}

export function MemberCoachClient({
  hasActivePro,
}: {
  hasActivePro: boolean;
  mobileFullscreen?: boolean;
}) {
  const [catalog, setCatalog] = useState<ProgramCatalogRow[]>([]);
  const [equipmentOptions, setEquipmentOptions] = useState<string[]>([]);
  const [swapExercises, setSwapExercises] = useState<SwapExerciseOption[]>([]);
  const [swapTarget, setSwapTarget] = useState<{
    sessionIndex: number;
    exerciseIndex: number;
    title: string;
    category: string;
  } | null>(null);
  const [loading, setLoading] = useState(hasActivePro);
  const [goals, setGoals] = useState<FocusId[]>([]);
  const [customGoal, setCustomGoal] = useState("");
  const [location, setLocation] = useState<LocationSlug | "">("");
  const [equipment, setEquipment] = useState<string[]>([]);
  const [bodyweightOnly, setBodyweightOnly] = useState(false);
  const [hasInjury, setHasInjury] = useState(false);
  const [injuryArea, setInjuryArea] = useState<InjuryArea | null>(null);
  const [movementOk, setMovementOk] = useState<boolean | null>(null);
  const [blocked, setBlocked] = useState<MovementBlocks>({
    squat: false,
    lunge: false,
    pushUp: false,
    jump: false,
  });
  const [weeks, setWeeks] = useState(8);
  const [sessionsPerWeek, setSessionsPerWeek] = useState(3);
  const [minutes, setMinutes] = useState(45);
  const [stepId, setStepId] = useState<StepId>("goal");
  const [phase, setPhase] = useState<Phase>("form");
  const [proposal, setProposal] = useState<ProgramProposal | null>(null);
  const [openWeeks, setOpenWeeks] = useState<Record<number, boolean>>({ 1: true });
  const [saving, setSaving] = useState(false);
  const [savedHref, setSavedHref] = useState<string | null>(null);
  const [savedTitle, setSavedTitle] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const steps = stepsFor(location, hasInjury);
  const stepIndex = Math.max(0, steps.indexOf(stepId));
  const formChrome = useCoachFormChrome();
  const setFormChrome = formChrome?.setChrome;

  useEffect(() => {
    if (!setFormChrome) return;
    if (phase === "form" && stepId === "injury-results") {
      setFormChrome({
        mode: "overview",
        progress: 100,
        label: "",
        title: injuryArea ? injuryLabel(injuryArea) : "Programs",
        canGoBack: true,
      });
      return;
    }
    if (phase === "overview") {
      setFormChrome({
        mode: "overview",
        progress: 100,
        label: "",
        title: "Your program",
        canGoBack: true,
      });
      return;
    }
    if (phase !== "form") {
      setFormChrome(null);
      return;
    }
    setFormChrome({
      mode: "steps",
      progress: ((stepIndex + 1) / steps.length) * 100,
      label: `${stepIndex + 1}/${steps.length}`,
      title: "",
      canGoBack: stepIndex > 0,
    });
  }, [phase, setFormChrome, stepIndex, steps.length, stepId, injuryArea]);

  useEffect(() => {
    return () => setFormChrome?.(null);
  }, [setFormChrome]);

  useEffect(() => {
    if (!hasActivePro) return;
    void loadMemberCoachData().then((res) => {
      setLoading(false);
      if ("ok" in res && res.ok) {
        setCatalog(res.data.programsCatalog);
        setEquipmentOptions(res.data.equipmentOptions);
        setSwapExercises(res.data.swapExercises);
      } else if ("error" in res) {
        setError(res.error);
      }
    });
  }, [hasActivePro]);

  function canContinue(): boolean {
    if (stepId === "goal") return goals.length > 0 || customGoal.trim().length >= 3;
    if (stepId === "location") return location !== "";
    if (stepId === "equipment") return bodyweightOnly || equipment.length > 0;
    if (stepId === "movement") return movementOk === true || Object.values(blocked).some(Boolean);
    return true;
  }

  function goNext() {
    const next = steps[stepIndex + 1];
    if (next) setStepId(next);
  }

  function advanceFrom(
    current: StepId,
    nextLocation: LocationSlug | "" = location,
    injury = hasInjury
  ) {
    const list = stepsFor(nextLocation, injury);
    const next = list[list.indexOf(current) + 1];
    if (next) setStepId(next);
  }

  function goBack() {
    if (phase !== "form") {
      setPhase("form");
      setError(null);
      setStepId("minutes");
      return;
    }
    const prev = steps[stepIndex - 1];
    if (!prev) return;
    if (stepId === "injury") setHasInjury(false);
    setStepId(prev);
  }

  if (formChrome) formChrome.backRef.current = goBack;

  async function generate() {
    if ((goals.length === 0 && customGoal.trim().length < 3) || !location) return;
    setError(null);
    setSavedHref(null);
    setSavedTitle(null);
    setProposal(null);
    setPhase("generating");
    const request = buildProgramRequest({
      goals,
      customGoal,
      location,
      equipment,
      bodyweightOnly,
      movementOk: movementOk === true,
      blocked,
      weeks,
      sessionsPerWeek,
      minutes,
    });
    const res = await sendMemberCoachMessage({
      history: request.history,
      userMessage: request.userMessage,
      programsCatalog: catalog,
      creationKind: "program",
    });
    if ("error" in res) {
      setError(res.error);
      setPhase("form");
      setStepId("minutes");
      return;
    }
    if (res.type !== "program_proposal") {
      const message =
        res.type === "text"
          ? res.text
          : res.type === "consultation"
            ? res.text
            : "The coach didn't return a program. Try again.";
      setError(message);
      setPhase("form");
      setStepId("minutes");
      return;
    }
    setProposal(res.proposal);
    setOpenWeeks({});
    setPhase("overview");
  }

  async function saveProgram() {
    if (!proposal) return;
    setSaving(true);
    setError(null);
    const res = await saveMemberCoachProgram(proposal, {
      locationSlug: proposal.location_slug || location || undefined,
    });
    setSaving(false);
    if ("error" in res) {
      setError(res.error);
      return;
    }
    setSavedHref(res.playHref);
    setSavedTitle(res.title);
  }

  const swapById = useMemo(
    () => new Map(swapExercises.map((exercise) => [exercise.id, exercise])),
    [swapExercises]
  );

  function editSessionExercise(
    sessionIndex: number,
    exerciseIndex: number,
    next: SwapExerciseOption | null
  ) {
    setProposal((prev) => {
      if (!prev) return prev;
      const sessions = prev.sessions.map((session, index) => {
        if (index !== sessionIndex) return session;
        if (next == null) {
          if (session.exercises.length <= 1) return session;
          return {
            ...session,
            exercises: session.exercises.filter((_, itemIndex) => itemIndex !== exerciseIndex),
          };
        }
        return {
          ...session,
          exercises: session.exercises.map((exercise, itemIndex) =>
            itemIndex === exerciseIndex
              ? { ...exercise, exercise_id: next.id, title: next.title }
              : exercise
          ),
        };
      });
      return { ...prev, sessions };
    });
  }

  if (!hasActivePro) return null;

  if (phase === "generating") {
    const goalLabel =
      customGoal.trim() ||
      GOALS.filter((item) => goals.includes(item.id))
        .map((item) => item.title)
        .join(" and ") ||
      "your goal";
    return (
      <div className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-center justify-center px-2 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-900 text-[#ccff00]">
          <Loader2 className="h-6 w-6 animate-spin" />
        </span>
        <h2 className="mt-5 text-2xl font-semibold text-zinc-900">Building your program</h2>
        <p className="mt-2 text-sm leading-relaxed text-zinc-600">
          The coach is writing every workout for {goalLabel.toLowerCase()}. This usually takes a minute or two.
        </p>
      </div>
    );
  }

  if (phase === "overview" && proposal) {
    const groups = new Map<number, ProgramProposalSession[]>();
    proposal.sessions.forEach((session, index) => {
      const week = weekNumber(session.name, index, proposal.sessions_per_week);
      const list = groups.get(week) ?? [];
      list.push(session);
      groups.set(week, list);
    });
    const weeksList = [...groups.entries()].sort((a, b) => a[0] - b[0]);
    return (
      <div className="mx-auto max-w-3xl space-y-5 pb-8 max-md:-mx-6 max-md:-mt-8">
        <button
          type="button"
          onClick={goBack}
          className="hidden h-11 w-11 items-center justify-center rounded-full border border-zinc-300 bg-white text-zinc-800 md:inline-flex"
          aria-label="Back to questions"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>

        {savedHref ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4">
            <p className="flex items-center gap-2 text-sm font-semibold text-emerald-800">
              <CheckCircle2 className="h-4 w-4" />
              Saved {savedTitle ?? proposal.title}
            </p>
            <Link
              href={savedHref}
              className="mt-3 inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white"
            >
              Start program
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : null}

        <div className="overflow-hidden rounded-3xl border border-zinc-200 bg-white max-md:rounded-none max-md:border-x-0">
          <div className="border-b border-zinc-100 bg-[radial-gradient(ellipse_at_top_left,rgba(204,255,0,0.45),transparent_55%)] px-5 py-6 sm:px-7">
            <p className="hidden text-xs font-semibold tracking-[0.16em] text-zinc-500 uppercase md:block">
              Your program
            </p>
            <h2 className="text-2xl font-semibold text-zinc-900 md:mt-2 sm:text-3xl">{proposal.title}</h2>
            <p className="mt-3 text-sm leading-relaxed text-zinc-600 sm:text-base">{proposal.description}</p>
            <div className="mt-4 flex flex-wrap gap-2 text-xs font-medium text-zinc-700">
              <span className="rounded-full border border-zinc-200 bg-white px-3 py-1">{proposal.duration_weeks} weeks</span>
              <span className="rounded-full border border-zinc-200 bg-white px-3 py-1">{proposal.sessions_per_week}× / week</span>
              <span className="rounded-full border border-zinc-200 bg-white px-3 py-1">{proposal.minutes_per_session ?? minutes} min</span>
              <span className="rounded-full border border-zinc-200 bg-white px-3 py-1">{proposal.sessions.length} workouts</span>
            </div>
            {!savedHref ? (
              <p className="mt-3 text-sm text-zinc-600">
                Every workout is listed below. Remove an exercise, or switch it for another in the same category.
              </p>
            ) : null}
          </div>
          {proposal.body?.trim() && proposal.body.trim() !== proposal.description ? (
            <div className="border-b border-zinc-100 px-5 py-5 sm:px-7">
              <p className="text-xs font-semibold tracking-wide text-zinc-500 uppercase">Summary</p>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-zinc-800">
                {proposal.body.trim()}
              </p>
            </div>
          ) : null}
          <div className="space-y-3 px-5 py-5 sm:px-7">
            {weeksList.map(([week, sessions]) => {
              const open = openWeeks[week] !== false;
              return (
                <section key={week} className="overflow-hidden rounded-2xl border border-zinc-200">
                  <button
                    type="button"
                    onClick={() => setOpenWeeks((prev) => ({ ...prev, [week]: !open }))}
                    className="flex w-full items-center justify-between bg-zinc-50 px-4 py-3 text-left"
                  >
                    <span className="text-sm font-semibold text-zinc-900">
                      Week {week}
                      <span className="ml-2 font-normal text-zinc-500">
                        {sessions.length} workout{sessions.length === 1 ? "" : "s"}
                      </span>
                    </span>
                    <span className="text-xs font-medium text-zinc-500">{open ? "Hide" : "Show"}</span>
                  </button>
                  {open ? (
                    <div className="divide-y divide-zinc-100">
                      {sessions.map((session) => {
                        const sessionIndex = proposal.sessions.indexOf(session);
                        const mins = sessionMinutes(session);
                        return (
                          <article key={`${session.name}-${sessionIndex}`} className="px-4 py-4">
                            <div className="flex flex-wrap items-baseline justify-between gap-2">
                              <h3 className="text-sm font-semibold text-zinc-900">{session.name}</h3>
                              <p className="text-xs text-zinc-500">
                                {[mins != null ? `${mins} min` : null, `${session.exercises.length} exercise${session.exercises.length === 1 ? "" : "s"}`]
                                  .filter(Boolean)
                                  .join(" · ")}
                              </p>
                            </div>
                            {session.description ? (
                              <p className="mt-1 text-sm text-zinc-600">{session.description}</p>
                            ) : null}
                            <div className="mt-3">
                              <ExerciseList
                                exercises={session.exercises}
                                mediaById={swapById}
                                editable={!savedHref}
                                onRemove={(exerciseIndex) =>
                                  editSessionExercise(sessionIndex, exerciseIndex, null)
                                }
                                onSwitch={(exerciseIndex) => {
                                  const exercise = session.exercises[exerciseIndex];
                                  if (!exercise) return;
                                  const category = swapById.get(exercise.exercise_id)?.categories[0] ?? "";
                                  setSwapTarget({
                                    sessionIndex,
                                    exerciseIndex,
                                    title: exercise.title,
                                    category,
                                  });
                                }}
                              />
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

        {error ? (
          <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
        ) : null}

        {!savedHref ? (
          <div className="sticky bottom-0 z-30 border-t border-zinc-200 bg-white/95 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur md:static md:border-0 md:bg-transparent md:px-0 md:py-0 md:backdrop-blur-none">
          <button
            type="button"
            disabled={saving}
            onClick={() => void saveProgram()}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#ccff00] px-6 py-3.5 text-sm font-bold text-zinc-950 md:w-auto"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving…
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Save and start
              </>
            )}
          </button>
          </div>
        ) : null}
        {swapTarget ? (
          <SwapExerciseModal
            title={swapTarget.title}
            category={swapTarget.category}
            options={swapExercises}
            excludeIds={
              proposal.sessions[swapTarget.sessionIndex]?.exercises.map((exercise) => exercise.exercise_id) ??
              []
            }
            onClose={() => setSwapTarget(null)}
            onPick={(exercise) => {
              editSessionExercise(swapTarget.sessionIndex, swapTarget.exerciseIndex, exercise);
              setSwapTarget(null);
            }}
          />
        ) : null}
      </div>
    );
  }

  const progress = ((stepIndex + 1) / steps.length) * 100;

  return (
    <div className={`mx-auto flex w-full max-w-xl flex-col ${stepId === "injury" || stepId === "injury-results" ? "" : "max-md:pb-28"}`}>
      <div className="mb-6 hidden items-center gap-3 md:flex">
        <button
          type="button"
          onClick={goBack}
          disabled={stepIndex === 0}
          className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-zinc-300 bg-white text-zinc-800 disabled:opacity-40"
          aria-label="Previous question"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-zinc-200">
          <div className="h-full rounded-full bg-[#ccff00]" style={{ width: `${progress}%` }} />
        </div>
        <span className="text-xs font-medium text-zinc-500">
          {stepIndex + 1}/{steps.length}
        </span>
      </div>

      {error ? (
        <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      ) : null}

      {stepId === "goal" && (
        <section>
          <h2 className="text-2xl font-semibold text-zinc-900 sm:text-3xl">What do you want to focus on?</h2>
          <p className="mt-2 text-base text-zinc-600">Pick every focus that applies, or write your own.</p>
          <ul className="mt-8 space-y-3">
            {GOALS.map((item) => (
              <li key={item.id}>
                <ChoiceRow
                  selected={goals.includes(item.id) && customGoal.trim().length === 0}
                  title={item.title}
                  subtitle={item.subtitle}
                  icon={item.icon}
                  onClick={() => {
                    setHasInjury(false);
                    setInjuryArea(null);
                    setCustomGoal("");
                    setGoals((prev) =>
                      prev.includes(item.id) ? prev.filter((id) => id !== item.id) : [...prev, item.id]
                    );
                  }}
                />
              </li>
            ))}
            <li>
              <ChoiceRow
                selected={false}
                title="I have an injury"
                subtitle="See programs built for that area"
                icon={Bandage}
                onClick={() => {
                  setHasInjury(true);
                  setGoals([]);
                  setCustomGoal("");
                  advanceFrom("goal", location, true);
                }}
              />
            </li>
          </ul>
          {goals.length > 0 ? (
            <p className="mt-4 text-sm text-zinc-500">Pick every one that applies, then continue.</p>
          ) : null}
          <label className="mt-6 block">
            <span className="mb-2 block text-sm font-medium text-zinc-700">Or describe it yourself</span>
            <textarea
              value={customGoal}
              onChange={(e) => {
                setCustomGoal(e.target.value);
                if (e.target.value.trim()) {
                  setGoals([]);
                  setHasInjury(false);
                }
              }}
              rows={3}
              maxLength={280}
              placeholder="Example: stronger shoulder for overheads, without aggravating my elbow."
              className="w-full resize-y rounded-2xl border-2 border-zinc-300 bg-white px-4 py-3 text-base text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-[#ccff00]/90"
            />
          </label>
        </section>
      )}

      {stepId === "injury" && (
        <section>
          <h2 className="text-2xl font-semibold text-zinc-900 sm:text-3xl">Where does it hurt?</h2>
          <p className="mt-2 text-base text-zinc-600">Pick the area. We’ll show the programs we already have for it.</p>
          <div className="mt-8 space-y-6">
            {INJURY_GROUPS.map((group) => (
              <div key={group.label}>
                {group.options.length > 1 ? (
                  <p className="mb-2 text-sm font-semibold text-zinc-500">{group.label}</p>
                ) : null}
                <ul className="space-y-3">
                  {group.options.map((option) => (
                    <li key={option.id}>
                      <ChoiceRow
                        selected={injuryArea === option.id}
                        title={group.options.length === 1 ? group.label : option.title}
                        icon={Bandage}
                        onClick={() => {
                          setInjuryArea(option.id);
                          advanceFrom("injury");
                        }}
                      />
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}

      {stepId === "injury-results" && injuryArea ? (
        <section>
          <h2 className="hidden text-2xl font-semibold text-zinc-900 md:block sm:text-3xl">{injuryLabel(injuryArea)}</h2>
          <p className="text-base text-zinc-600 md:mt-2">Premade programs for this. Open one to start.</p>
          {loading ? (
            <p className="mt-6 text-sm text-zinc-500">Loading programs…</p>
          ) : (
            <InjuryProgramList
              programs={catalog.filter((program) => programMatchesInjury(program.title, injuryArea))}
            />
          )}
        </section>
      ) : null}

      {stepId === "location" && (
        <section>
          <h2 className="text-2xl font-semibold text-zinc-900 sm:text-3xl">Where will you train?</h2>
          <p className="mt-2 text-base text-zinc-600">Exercises are chosen for this place.</p>
          <ul className="mt-8 space-y-3">
            {LOCATIONS.map((item) => (
              <li key={item.slug}>
                <ChoiceRow
                  selected={location === item.slug}
                  title={item.title}
                  subtitle={item.subtitle}
                  icon={item.icon}
                  onClick={() => {
                    setLocation(item.slug);
                    advanceFrom("location", item.slug);
                  }}
                />
              </li>
            ))}
          </ul>
        </section>
      )}

      {stepId === "equipment" && (
        <section>
          <h2 className="text-2xl font-semibold text-zinc-900 sm:text-3xl">What do you have at home?</h2>
          <p className="mt-2 text-base text-zinc-600">Select everything you can use. Or bodyweight only.</p>
          <div className="mt-8 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                setBodyweightOnly(true);
                setEquipment([]);
                advanceFrom("equipment");
              }}
              className={`rounded-2xl border-2 px-4 py-3 text-sm font-semibold ${
                bodyweightOnly ? "border-[#ccff00] bg-[#ccff00]/20" : "border-zinc-300 bg-white"
              }`}
            >
              Bodyweight only
            </button>
            {equipmentOptions.map((title) => {
              const selected = !bodyweightOnly && equipment.includes(title);
              return (
                <button
                  key={title}
                  type="button"
                  onClick={() => {
                    setBodyweightOnly(false);
                    setEquipment((prev) =>
                      prev.includes(title) ? prev.filter((item) => item !== title) : [...prev, title]
                    );
                  }}
                  className={`rounded-2xl border-2 px-4 py-3 text-sm font-semibold ${
                    selected ? "border-[#ccff00] bg-[#ccff00]/20" : "border-zinc-300 bg-white"
                  }`}
                >
                  {title}
                </button>
              );
            })}
          </div>
          {loading ? <p className="mt-4 text-sm text-zinc-500">Loading equipment…</p> : null}
        </section>
      )}

      {stepId === "movement" && (
        <section>
          <h2 className="text-2xl font-semibold text-zinc-900 sm:text-3xl">Anything we should leave out?</h2>
          <p className="mt-2 text-base text-zinc-600">
            Tap any movement you can&apos;t do right now. The program uses other exercises instead.
          </p>
          <ul className="mt-8 space-y-3">
            <li>
              <ChoiceRow
                selected={movementOk === true}
                title="All of these are fine"
                subtitle="Squats, lunges, push-ups, and jumps"
                icon={Trophy}
                onClick={() => {
                  setMovementOk(true);
                  setBlocked({ squat: false, lunge: false, pushUp: false, jump: false });
                  advanceFrom("movement");
                }}
              />
            </li>
            {(
              [
                ["squat", "Squats", "Skip squat patterns"],
                ["lunge", "Lunges", "Skip lunge patterns"],
                ["pushUp", "Push-ups", "Skip push-ups"],
                ["jump", "Jumping", "Skip jumps"],
              ] as const
            ).map(([key, title, subtitle]) => (
              <li key={key}>
                <ChoiceRow
                  selected={movementOk === false && blocked[key]}
                  title={title}
                  subtitle={subtitle}
                  icon={Bandage}
                  onClick={() => {
                    setMovementOk(false);
                    setBlocked((prev) => ({ ...prev, [key]: !prev[key] }));
                  }}
                />
              </li>
            ))}
          </ul>
          {movementOk === false ? (
            <p className="mt-4 text-sm text-zinc-500">Pick every one that applies, then continue.</p>
          ) : null}
        </section>
      )}

      {stepId === "weeks" && (
        <section>
          <h2 className="text-2xl font-semibold text-zinc-900 sm:text-3xl">How many weeks?</h2>
          <p className="mt-2 text-base text-zinc-600">A block long enough to feel the change.</p>
          <ul className="mt-8 space-y-3">
            {WEEK_OPTIONS.map((value) => (
              <li key={value}>
                <ChoiceRow
                  selected={weeks === value}
                  title={`${value} weeks`}
                  icon={Timer}
                  onClick={() => {
                    setWeeks(value);
                    advanceFrom("weeks");
                  }}
                />
              </li>
            ))}
          </ul>
        </section>
      )}

      {stepId === "sessions" && (
        <section>
          <h2 className="text-2xl font-semibold text-zinc-900 sm:text-3xl">How many sessions a week?</h2>
          <p className="mt-2 text-base text-zinc-600">What you can actually keep.</p>
          <ul className="mt-8 space-y-3">
            {SESSION_OPTIONS.map((value) => (
              <li key={value}>
                <ChoiceRow
                  selected={sessionsPerWeek === value}
                  title={`${value}× per week`}
                  icon={Repeat}
                  onClick={() => {
                    setSessionsPerWeek(value);
                    advanceFrom("sessions");
                  }}
                />
              </li>
            ))}
          </ul>
        </section>
      )}

      {stepId === "minutes" && (
        <section>
          <h2 className="text-2xl font-semibold text-zinc-900 sm:text-3xl">How long is each session?</h2>
          <p className="mt-2 text-base text-zinc-600">Including warm-up and cool-down.</p>
          <ul className="mt-8 space-y-3">
            {MINUTE_OPTIONS.map((value) => (
              <li key={value}>
                <ChoiceRow
                  selected={minutes === value}
                  title={`${value} minutes`}
                  icon={Timer}
                  onClick={() => setMinutes(value)}
                />
              </li>
            ))}
          </ul>
        </section>
      )}

      {stepId === "injury" || stepId === "injury-results" ? null : (
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-zinc-200 bg-white px-6 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:static md:z-auto md:mt-8 md:flex md:justify-end md:border-0 md:bg-transparent md:px-0 md:py-2 md:pb-2">
        {stepId === "minutes" ? (
          <button
            type="button"
            disabled={!canContinue() || loading}
            onClick={() => void generate()}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#ccff00] px-6 py-3.5 text-sm font-bold text-zinc-950 disabled:opacity-40 sm:w-auto"
          >
            <Sparkles className="h-4 w-4" />
            Build my program
          </button>
        ) : (
          <button
            type="button"
            disabled={!canContinue()}
            onClick={goNext}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#ccff00] px-6 py-3.5 text-sm font-bold text-zinc-950 disabled:opacity-40 sm:w-auto"
          >
            Continue
            <ArrowRight className="h-4 w-4" />
          </button>
        )}
      </div>
      )}
    </div>
  );
}
