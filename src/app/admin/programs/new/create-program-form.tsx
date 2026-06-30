"use client";

import { useMemo, useState } from "react";
import type { ExercisePrescriptionType } from "@/lib/programs/program-exercises";
import {
  allowedProgramPrescriptionTypes,
  clampProgramPrescriptionType,
  defaultProgramPrescriptionType,
  type ExerciseProgramPrescriptionMode,
} from "@/lib/exercises/program-prescription-mode";
import type { AiProgramFormDraft } from "@/lib/programs/map-ai-program-draft";
import type { SessionPhase } from "@/lib/programs/session-phase";
import type { ProgramFormat } from "@/lib/programs/program-format";
import { AiProgramGeneratorModal } from "@/components/admin/ai-program-generator-modal";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  GripVertical,
  Image as ImageIcon,
  Info,
  ListOrdered,
  Music,
  Plus,
  Copy,
  Save,
  Sparkles,
  Settings,
  Trash2,
  UploadCloud,
  Video,
} from "lucide-react";
import { createProgram, updateProgram } from "../actions";
import { createClient } from "@/utils/supabase/client";
import { STORAGE_BUCKETS } from "@/utils/supabase/storage";
import { ExerciseSearchCombobox, type ExerciseOption } from "./exercise-search-combobox";
import { ExerciseVideoThumbnail } from "@/components/admin/exercise-video-thumbnail";
import type { MemberPickerOption } from "@/lib/programs/profile-ai-context";

const TABS = [
  { id: "basic", label: "Basic Info", icon: Info },
  { id: "media", label: "Media", icon: ImageIcon },
  { id: "curriculum", label: "Curriculum", icon: ListOrdered },
  { id: "settings", label: "Pricing & Settings", icon: Settings },
];

type CategoryOption = { id: string; name: string; slug: string };
type DifficultyOption = { id: string; name: string; slug: string };
type LocationOption = { id: string; name: string; slug: string };

export type ExerciseDurationUnit = "sec" | "min";

const PRESCRIPTION_OPTIONS: { id: ExercisePrescriptionType; label: string; hint: string }[] = [
  {
    id: "sets_reps",
    label: "Sets & reps",
    hint: "Go at your own pace — no timer.",
  },
  {
    id: "time",
    label: "Time",
    hint: "Single timed work period.",
  },
  {
    id: "timed_intervals",
    label: "Timed sets + rest",
    hint: "Repeat work and rest (e.g. 20s on, 20s off × 5).",
  },
];

function exerciseProgramMode(
  exercises: ExerciseOption[],
  exerciseId: string
): ExerciseProgramPrescriptionMode {
  return exercises.find((e) => e.id === exerciseId)?.programPrescriptionMode ?? "all";
}

function prescriptionOptionsForMode(mode: ExerciseProgramPrescriptionMode) {
  const allowed = new Set(allowedProgramPrescriptionTypes(mode));
  return PRESCRIPTION_OPTIONS.filter((opt) => allowed.has(opt.id));
}

export type SessionExerciseEntry = {
  key: string;
  exerciseId: string;
  sessionPhase: SessionPhase;
  choiceGroup: string;
  prescriptionType: ExercisePrescriptionType;
  /** Work time value; unit chosen separately */
  durationValue: string;
  durationUnit: ExerciseDurationUnit;
  sets: string;
  reps: string;
  /** Seconds of rest between timed rounds */
  restBetweenSetsSeconds: string;
  /** Seconds of pause after this exercise before the next; empty = none */
  restAfterSeconds: string;
  /** Optional coach note shown during the workout */
  note: string;
};

export type SessionBlock = {
  key: string;
  name: string;
  description: string;
  /** Plain input value; empty = no duration stored */
  durationMinutes: string;
  exercises: SessionExerciseEntry[];
};

export type TrackBlock = {
  key: string;
  locationId: string;
  sessions: SessionBlock[];
  /** Day counts per week; when omitted, derived from frequency on first render */
  weekSizes?: number[];
};

export type ProgramFormInitialValues = {
  title: string;
  description: string;
  body: string;
  categoryIds: string[];
  difficultyLevelId: string;
  coverImageUrl: string;
  promoVideoUrl: string;
  songUrl: string;
  isFree: boolean;
  status: "draft" | "published";
  durationWeeks: string;
  sessionsPerWeek: string;
  minutesPerSession: string;
  programFormat: ProgramFormat;
  outcomes: string[];
  tracks: TrackBlock[];
};

type OutcomeLine = { key: string; text: string };

function newSession(dayIndex: number): SessionBlock {
  return {
    key: crypto.randomUUID(),
    name: dayIndex <= 1 ? "Day 1" : `Day ${dayIndex}`,
    description: "",
    durationMinutes: "",
    exercises: [],
  };
}

function pickCompoundKey(trackKey: string, sessionKey: string) {
  return `${trackKey}|${sessionKey}`;
}

function cloneSessionBlock(src: SessionBlock, name: string): SessionBlock {
  return {
    key: crypto.randomUUID(),
    name,
    description: src.description,
    durationMinutes: src.durationMinutes,
    exercises: src.exercises.map((e) => ({
      key: crypto.randomUUID(),
      exerciseId: e.exerciseId,
      sessionPhase: e.sessionPhase,
      choiceGroup: e.choiceGroup,
      prescriptionType: e.prescriptionType,
      durationValue: e.durationValue,
      durationUnit: e.durationUnit,
      sets: e.sets,
      reps: e.reps,
      restBetweenSetsSeconds: e.restBetweenSetsSeconds,
      restAfterSeconds: e.restAfterSeconds,
      note: e.note,
    })),
  };
}

function effectiveSessionsPerWeek(raw: string, sessionCount: number): number {
  const n = Number.parseInt(raw.trim(), 10);
  if (Number.isFinite(n) && n > 0) return n;
  return Math.max(1, sessionCount);
}

function defaultSessionsPerWeekForNewWeek(raw: string): number {
  const n = Number.parseInt(raw.trim(), 10);
  if (Number.isFinite(n) && n > 0) return n;
  return 3;
}

function resolveWeekSizes(track: TrackBlock, sessionsPerWeekRaw: string): number[] {
  if (track.weekSizes?.length) {
    const total = track.weekSizes.reduce((sum, n) => sum + n, 0);
    if (total === track.sessions.length) return track.weekSizes;
  }
  const perWeek = effectiveSessionsPerWeek(sessionsPerWeekRaw, track.sessions.length);
  const sizes: number[] = [];
  for (let i = 0; i < track.sessions.length; i += perWeek) {
    sizes.push(Math.min(perWeek, track.sessions.length - i));
  }
  return sizes.length > 0 ? sizes : [Math.max(1, track.sessions.length)];
}

function sessionIndexToWeek(weekSizes: number[], index: number): number {
  let acc = 0;
  for (let wi = 0; wi < weekSizes.length; wi++) {
    acc += weekSizes[wi]!;
    if (index < acc) return wi;
  }
  return Math.max(0, weekSizes.length - 1);
}

function groupSessionsByWeekSizes(
  sessions: SessionBlock[],
  weekSizes: number[]
): { weekIndex: number; items: { session: SessionBlock; globalIndex: number }[] }[] {
  const weeks: { weekIndex: number; items: { session: SessionBlock; globalIndex: number }[] }[] = [];
  let i = 0;
  for (let wi = 0; wi < weekSizes.length; wi++) {
    const size = weekSizes[wi]!;
    const chunk = sessions.slice(i, i + size);
    if (chunk.length === 0) continue;
    weeks.push({
      weekIndex: weeks.length,
      items: chunk.map((session, j) => ({ session, globalIndex: i + j })),
    });
    i += size;
  }
  return weeks;
}

function groupSessionsByWeek(
  sessions: SessionBlock[],
  sessionsPerWeekRaw: string
): { weekIndex: number; items: { session: SessionBlock; globalIndex: number }[] }[] {
  return groupSessionsByWeekSizes(sessions, resolveWeekSizes({ key: "", locationId: "", sessions }, sessionsPerWeekRaw));
}

function deriveDuplicatedSessionName(srcName: string, dayNumber: number, weekNumber: number): string {
  const trimmed = srcName.trim();
  if (/^day\s+\d+/i.test(trimmed)) {
    return trimmed.replace(/^day\s+\d+/i, `Day ${dayNumber}`);
  }
  if (trimmed) return `${trimmed} (week ${weekNumber})`;
  return `Day ${dayNumber}`;
}

function weekSectionKey(trackKey: string, weekIndex: number) {
  return `${trackKey}|week-${weekIndex}`;
}

function sessionSectionKey(trackKey: string, sessionKey: string) {
  return `${trackKey}|session-${sessionKey}`;
}

function extFromFile(file: File, fallback: string) {
  const n = file.name.split(".").pop();
  if (n && n.length <= 5) return n.toLowerCase();
  if (file.type === "image/jpeg") return "jpg";
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";
  if (file.type === "image/gif") return "gif";
  if (file.type === "video/mp4") return "mp4";
  if (file.type === "video/webm") return "webm";
  if (file.type === "video/quicktime") return "mov";
  if (file.type === "audio/mpeg" || file.type === "audio/mp3") return "mp3";
  return fallback;
}

export function CreateProgramForm({
  categories,
  difficulties,
  exercises,
  locations,
  defaultLocationId,
  loadError,
  programId,
  initial,
  members = [],
}: {
  categories: CategoryOption[];
  difficulties: DifficultyOption[];
  exercises: ExerciseOption[];
  locations: LocationOption[];
  defaultLocationId: string;
  loadError?: string | null;
  members?: MemberPickerOption[];
  /** When set, form submits as update and fields are pre-filled */
  programId?: string;
  initial?: ProgramFormInitialValues | null;
}) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("basic");
  const [error, setError] = useState<string | null>(null);
  const [aiNotice, setAiNotice] = useState<string | null>(null);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [pending, setPending] = useState(false);

  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [promoVideoFile, setPromoVideoFile] = useState<File | null>(null);
  const [songFile, setSongFile] = useState<File | null>(null);
  const [coverDragging, setCoverDragging] = useState(false);
  const [promoVideoDragging, setPromoVideoDragging] = useState(false);
  const [songDragging, setSongDragging] = useState(false);

  const [tracks, setTracks] = useState<TrackBlock[]>(() =>
    initial?.tracks?.length
      ? initial.tracks
      : [
          {
            key: crypto.randomUUID(),
            locationId: defaultLocationId,
            sessions: [newSession(1)],
            weekSizes: [1],
          },
        ]
  );
  const [sessionPicks, setSessionPicks] = useState<Record<string, string>>({});
  const [outcomeLines, setOutcomeLines] = useState<OutcomeLine[]>(() =>
    initial?.outcomes?.length
      ? initial.outcomes.map((text) => ({ key: crypto.randomUUID(), text }))
      : [{ key: crypto.randomUUID(), text: "" }]
  );
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>(() => initial?.categoryIds ?? []);
  const [sessionsPerWeek, setSessionsPerWeek] = useState(initial?.sessionsPerWeek ?? "");
  const [programFormat, setProgramFormat] = useState<ProgramFormat>(
    initial?.programFormat ?? "training_plan"
  );
  const [collapsedWeeks, setCollapsedWeeks] = useState<Set<string>>(() => new Set());
  const [collapsedSessions, setCollapsedSessions] = useState<Set<string>>(() => new Set());
  const [activeLocationTabKey, setActiveLocationTabKey] = useState<string | null>(null);
  const [draggingExercise, setDraggingExercise] = useState<{
    trackKey: string;
    sessionKey: string;
    index: number;
  } | null>(null);
  const [dropExerciseTarget, setDropExerciseTarget] = useState<{
    sessionKey: string;
    index: number;
  } | null>(null);

  function toggleWeekCollapsed(weekKey: string) {
    setCollapsedWeeks((prev) => {
      const next = new Set(prev);
      if (next.has(weekKey)) next.delete(weekKey);
      else next.add(weekKey);
      return next;
    });
  }

  function toggleSessionCollapsed(sessionKey: string) {
    setCollapsedSessions((prev) => {
      const next = new Set(prev);
      if (next.has(sessionKey)) next.delete(sessionKey);
      else next.add(sessionKey);
      return next;
    });
  }

  function toggleCategory(id: string) {
    setSelectedCategoryIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function setFieldValue(id: string, value: string) {
    const el = document.getElementById(id) as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null;
    if (el) el.value = value;
  }

  function applyAiDraft(draft: AiProgramFormDraft, warnings: string[]) {
    setFieldValue("title", draft.title);
    setFieldValue("description", draft.description);
    setFieldValue("body", draft.body);
    setFieldValue("difficulty_level_id", draft.difficultyLevelId);
    setFieldValue("duration_weeks", draft.durationWeeks);
    setFieldValue("sessions_per_week", draft.sessionsPerWeek);
    setSessionsPerWeek(draft.sessionsPerWeek);
    setFieldValue("minutes_per_session", draft.minutesPerSession);
    setSelectedCategoryIds(draft.categoryIds);
    setOutcomeLines(
      draft.outcomes.length > 0
        ? draft.outcomes.map((text) => ({ key: crypto.randomUUID(), text }))
        : [{ key: crypto.randomUUID(), text: "" }]
    );

    const newTracks: TrackBlock[] = draft.tracks.map((tr) => ({
      key: crypto.randomUUID(),
      locationId: tr.locationId,
      ...(tr.weekSizes?.length ? { weekSizes: tr.weekSizes } : {}),
      sessions: tr.sessions.map((s, i) => ({
        key: crypto.randomUUID(),
        name: s.name.trim() || `Day ${i + 1}`,
        description: s.description,
        durationMinutes: s.durationMinutes,
        exercises: s.exercises.map((ex) => {
          const mode = exerciseProgramMode(exercises, ex.exerciseId);
          return {
            key: crypto.randomUUID(),
            exerciseId: ex.exerciseId,
            sessionPhase: ex.sessionPhase,
            choiceGroup: ex.choiceGroup,
            prescriptionType: clampProgramPrescriptionType(mode, ex.prescriptionType),
            durationValue: ex.durationValue,
            durationUnit: ex.durationUnit,
            sets: ex.sets,
            reps: ex.reps,
            restBetweenSetsSeconds: ex.restBetweenSetsSeconds,
            restAfterSeconds: ex.restAfterSeconds,
            note: ex.note ?? "",
          };
        }),
      })),
    }));

    setTracks(newTracks);
    setSessionPicks({});
    setActiveLocationTabKey(newTracks[0]?.key ?? null);
    setActiveTab("curriculum");

    const sessionCount = newTracks.reduce((n, t) => n + t.sessions.length, 0);
    const exerciseCount = newTracks.reduce(
      (n, t) => n + t.sessions.reduce((m, s) => m + s.exercises.length, 0),
      0
    );
    let notice = `AI draft applied: ${sessionCount} session${sessionCount === 1 ? "" : "s"}, ${exerciseCount} exercise slots. Review and edit before saving.`;
    if (warnings.length > 0) {
      notice += ` ${warnings.length} adjustment${warnings.length === 1 ? "" : "s"}: ${warnings.slice(0, 3).join(" ")}${warnings.length > 3 ? "…" : ""}`;
    }
    setAiNotice(notice);
    setError(null);
  }

  const effectiveLocationTabKey =
    activeLocationTabKey != null && tracks.some((t) => t.key === activeLocationTabKey)
      ? activeLocationTabKey
      : (tracks[0]?.key ?? "");

  const activeTrack = tracks.find((t) => t.key === effectiveLocationTabKey) ?? tracks[0];
  const trackExerciseOptions = useMemo(() => {
    const locId = activeTrack?.locationId;
    if (!locId) return [];
    return exercises.filter((ex) => ex.location_ids.includes(locId));
  }, [exercises, activeTrack?.locationId]);
  const activeTrackIndex =
    activeTrack != null ? tracks.findIndex((t) => t.key === activeTrack.key) : 0;
  const locationIdsUsedElsewhere = activeTrack
    ? new Set(
        tracks
          .filter((x) => x.key !== activeTrack.key)
          .map((x) => x.locationId)
          .filter(Boolean)
      )
    : new Set<string>();

  const applyCoverFile = (file: File | undefined) => {
    if (!file || !file.type.startsWith("image/")) return;
    setCoverFile(file);
  };

  const applyPromoVideoFile = (file: File | undefined) => {
    if (!file || !file.type.startsWith("video/")) return;
    setPromoVideoFile(file);
  };

  const applySongFile = (file: File | undefined) => {
    if (!file) return;
    const okType = file.type === "audio/mpeg" || file.type === "audio/mp3" || file.type === "";
    const okName = file.name.toLowerCase().endsWith(".mp3");
    if (!okType && !okName) return;
    setSongFile(file);
  };

  async function uploadToProgramsBucket(file: File, kind: "cover" | "promo" | "song"): Promise<string> {
    const supabase = createClient();
    const folder = crypto.randomUUID();
    const ext = extFromFile(
      file,
      kind === "cover" ? "jpg" : kind === "song" ? "mp3" : "mp4"
    );
    const path = `${folder}/${kind}.${ext}`;
    const { error: upErr } = await supabase.storage.from(STORAGE_BUCKETS.programs).upload(path, file, {
      upsert: false,
    });
    if (upErr) throw new Error(upErr.message);
    const { data } = supabase.storage.from(STORAGE_BUCKETS.programs).getPublicUrl(path);
    return data.publicUrl;
  }

  function addTrack() {
    const used = new Set(tracks.map((t) => t.locationId).filter(Boolean));
    const nextLoc = locations.find((l) => !used.has(l.id))?.id ?? "";
    const newKey = crypto.randomUUID();
    setTracks((prev) => [
      ...prev,
      { key: newKey, locationId: nextLoc, sessions: [newSession(1)], weekSizes: [1] },
    ]);
    setActiveLocationTabKey(newKey);
  }

  function removeTrack(trackKey: string) {
    setTracks((prev) => (prev.length <= 1 ? prev : prev.filter((t) => t.key !== trackKey)));
    setSessionPicks((p) => {
      const next = { ...p };
      for (const k of Object.keys(next)) {
        if (k.startsWith(`${trackKey}|`)) delete next[k];
      }
      return next;
    });
  }

  function moveTrack(trackKey: string, dir: -1 | 1) {
    setTracks((prev) => {
      const i = prev.findIndex((t) => t.key === trackKey);
      if (i < 0) return prev;
      const j = i + dir;
      if (j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  }

  function setTrackLocation(trackKey: string, locationId: string) {
    setTracks((prev) =>
      prev.map((t) => {
        if (t.key !== trackKey) return t;
        const changed = t.locationId !== locationId;
        return {
          ...t,
          locationId,
          sessions: changed
            ? t.sessions.map((s) => ({ ...s, exercises: [] }))
            : t.sessions,
        };
      })
    );
    setSessionPicks((p) => {
      const next = { ...p };
      for (const k of Object.keys(next)) {
        if (k.startsWith(`${trackKey}|`)) delete next[k];
      }
      return next;
    });
  }

  function addSessionToTrack(trackKey: string) {
    setTracks((prev) =>
      prev.map((t) => {
        if (t.key !== trackKey) return t;
        const sizes = resolveWeekSizes(t, sessionsPerWeek);
        const n = t.sessions.length + 1;
        const lastWeek = sizes.length - 1;
        const newSizes = [...sizes];
        newSizes[lastWeek] = (newSizes[lastWeek] ?? 0) + 1;
        return {
          ...t,
          weekSizes: newSizes,
          sessions: [...t.sessions, newSession(n)],
        };
      })
    );
  }

  function addWeekToTrack(trackKey: string) {
    setTracks((prev) =>
      prev.map((t) => {
        if (t.key !== trackKey) return t;
        const sizes = resolveWeekSizes(t, sessionsPerWeek);
        const count = defaultSessionsPerWeekForNewWeek(sessionsPerWeek);
        const startDay = t.sessions.length + 1;
        const newSessions = Array.from({ length: count }, (_, i) => newSession(startDay + i));
        return {
          ...t,
          weekSizes: [...sizes, count],
          sessions: [...t.sessions, ...newSessions],
        };
      })
    );
  }

  function addDayToWeek(trackKey: string, weekIndex: number) {
    setTracks((prev) =>
      prev.map((t) => {
        if (t.key !== trackKey) return t;
        const sizes = resolveWeekSizes(t, sessionsPerWeek);
        if (weekIndex < 0 || weekIndex >= sizes.length) return t;
        const start = sizes.slice(0, weekIndex).reduce((sum, n) => sum + n, 0);
        const insertAt = start + sizes[weekIndex]!;
        const newSizes = [...sizes];
        newSizes[weekIndex] = (newSizes[weekIndex] ?? 0) + 1;
        return {
          ...t,
          weekSizes: newSizes,
          sessions: [
            ...t.sessions.slice(0, insertAt),
            newSession(insertAt + 1),
            ...t.sessions.slice(insertAt),
          ],
        };
      })
    );
  }

  function removeSessionFromTrack(trackKey: string, sessionKey: string) {
    setTracks((prev) =>
      prev.map((t) => {
        if (t.key !== trackKey) return t;
        if (t.sessions.length <= 1) return t;
        const idx = t.sessions.findIndex((s) => s.key === sessionKey);
        if (idx < 0) return t;
        const sizes = resolveWeekSizes(t, sessionsPerWeek);
        const weekIndex = sessionIndexToWeek(sizes, idx);
        const newSizes = [...sizes];
        newSizes[weekIndex] = (newSizes[weekIndex] ?? 1) - 1;
        if (newSizes[weekIndex]! <= 0) newSizes.splice(weekIndex, 1);
        return {
          ...t,
          weekSizes: newSizes,
          sessions: t.sessions.filter((s) => s.key !== sessionKey),
        };
      })
    );
    setSessionPicks((p) => {
      const next = { ...p };
      delete next[pickCompoundKey(trackKey, sessionKey)];
      return next;
    });
  }

  function moveSessionInTrack(trackKey: string, sessionKey: string, dir: -1 | 1) {
    setTracks((prev) =>
      prev.map((t) => {
        if (t.key !== trackKey) return t;
        const i = t.sessions.findIndex((s) => s.key === sessionKey);
        if (i < 0) return t;
        const j = i + dir;
        if (j < 0 || j >= t.sessions.length) return t;
        const sessions = [...t.sessions];
        [sessions[i], sessions[j]] = [sessions[j], sessions[i]];
        return { ...t, sessions };
      })
    );
  }

  function duplicateSessionInTrack(trackKey: string, sessionKey: string) {
    setTracks((prev) =>
      prev.map((t) => {
        if (t.key !== trackKey) return t;
        const i = t.sessions.findIndex((s) => s.key === sessionKey);
        if (i < 0) return t;
        const src = t.sessions[i];
        const copyName = src.name.trim()
          ? `${src.name.trim()} (copy)`
          : `Session ${t.sessions.length + 1}`;
        const duplicated = cloneSessionBlock(src, copyName);
        const sessions = [...t.sessions.slice(0, i + 1), duplicated, ...t.sessions.slice(i + 1)];
        return { ...t, sessions };
      })
    );
  }

  function duplicateWeekInTrack(trackKey: string, weekIndex: number) {
    setTracks((prev) =>
      prev.map((t) => {
        if (t.key !== trackKey) return t;
        const sizes = resolveWeekSizes(t, sessionsPerWeek);
        if (weekIndex < 0 || weekIndex >= sizes.length) return t;
        const start = sizes.slice(0, weekIndex).reduce((sum, n) => sum + n, 0);
        const weekSize = sizes[weekIndex]!;
        const weekSessions = t.sessions.slice(start, start + weekSize);
        if (weekSessions.length === 0) return t;

        const newWeekNumber = sizes.length + 1;
        const duplicated = weekSessions.map((src, dayInWeek) => {
          const dayNumber = t.sessions.length + dayInWeek + 1;
          return cloneSessionBlock(src, deriveDuplicatedSessionName(src.name, dayNumber, newWeekNumber));
        });

        return {
          ...t,
          weekSizes: [...sizes, weekSize],
          sessions: [...t.sessions, ...duplicated],
        };
      })
    );
  }

  function setSessionName(trackKey: string, sessionKey: string, name: string) {
    setTracks((prev) =>
      prev.map((t) => {
        if (t.key !== trackKey) return t;
        return {
          ...t,
          sessions: t.sessions.map((s) => (s.key === sessionKey ? { ...s, name } : s)),
        };
      })
    );
  }

  function setSessionDescription(trackKey: string, sessionKey: string, description: string) {
    setTracks((prev) =>
      prev.map((t) => {
        if (t.key !== trackKey) return t;
        return {
          ...t,
          sessions: t.sessions.map((s) => (s.key === sessionKey ? { ...s, description } : s)),
        };
      })
    );
  }

  function setSessionDurationMinutes(trackKey: string, sessionKey: string, durationMinutes: string) {
    if (durationMinutes !== "" && !/^\d*$/.test(durationMinutes)) return;
    setTracks((prev) =>
      prev.map((t) => {
        if (t.key !== trackKey) return t;
        return {
          ...t,
          sessions: t.sessions.map((s) =>
            s.key === sessionKey ? { ...s, durationMinutes } : s
          ),
        };
      })
    );
  }

  function addExerciseToSession(trackKey: string, sessionKey: string) {
    const pk = pickCompoundKey(trackKey, sessionKey);
    const pick = sessionPicks[pk] ?? "";
    if (!pick) return;
    setTracks((prev) =>
      prev.map((t) => {
        if (t.key !== trackKey) return t;
        return {
          ...t,
          sessions: t.sessions.map((s) => {
            if (s.key !== sessionKey) return s;
            if (s.exercises.some((e) => e.exerciseId === pick)) return s;
            const mode = exerciseProgramMode(exercises, pick);
            return {
              ...s,
              exercises: [
                ...s.exercises,
                {
                  key: crypto.randomUUID(),
                  exerciseId: pick,
                  sessionPhase: "main",
                  choiceGroup: "",
                  prescriptionType: defaultProgramPrescriptionType(mode),
                  durationValue: "",
                  durationUnit: "sec",
                  sets: "",
                  reps: "",
                  restBetweenSetsSeconds: "",
                  restAfterSeconds: "",
                  note: "",
                },
              ],
            };
          }),
        };
      })
    );
    setSessionPicks((p) => ({ ...p, [pk]: "" }));
  }

  function removeExerciseFromSession(trackKey: string, sessionKey: string, index: number) {
    setTracks((prev) =>
      prev.map((t) => {
        if (t.key !== trackKey) return t;
        return {
          ...t,
          sessions: t.sessions.map((s) => {
            if (s.key !== sessionKey) return s;
            return { ...s, exercises: s.exercises.filter((_, i) => i !== index) };
          }),
        };
      })
    );
  }

  function reorderExerciseInSession(
    trackKey: string,
    sessionKey: string,
    fromIndex: number,
    toIndex: number
  ) {
    if (fromIndex === toIndex) return;
    setTracks((prev) =>
      prev.map((t) => {
        if (t.key !== trackKey) return t;
        return {
          ...t,
          sessions: t.sessions.map((s) => {
            if (s.key !== sessionKey) return s;
            const list = [...s.exercises];
            const [item] = list.splice(fromIndex, 1);
            if (!item) return s;
            list.splice(toIndex, 0, item);
            return { ...s, exercises: list };
          }),
        };
      })
    );
  }

  function moveExerciseInSession(trackKey: string, sessionKey: string, index: number, dir: -1 | 1) {
    setTracks((prev) =>
      prev.map((t) => {
        if (t.key !== trackKey) return t;
        return {
          ...t,
          sessions: t.sessions.map((s) => {
            if (s.key !== sessionKey) return s;
            const list = [...s.exercises];
            const j = index + dir;
            if (j < 0 || j >= list.length) return s;
            [list[index], list[j]] = [list[j], list[index]];
            return { ...s, exercises: list };
          }),
        };
      })
    );
  }

  function setSessionExercisePrescriptionType(
    trackKey: string,
    sessionKey: string,
    entryKey: string,
    prescriptionType: ExercisePrescriptionType
  ) {
    setTracks((prev) =>
      prev.map((t) => {
        if (t.key !== trackKey) return t;
        return {
          ...t,
          sessions: t.sessions.map((s) => {
            if (s.key !== sessionKey) return s;
            return {
              ...s,
              exercises: s.exercises.map((e) =>
                e.key === entryKey ? { ...e, prescriptionType } : e
              ),
            };
          }),
        };
      })
    );
  }

  function setSessionExerciseNote(
    trackKey: string,
    sessionKey: string,
    entryKey: string,
    note: string
  ) {
    setTracks((prev) =>
      prev.map((t) => {
        if (t.key !== trackKey) return t;
        return {
          ...t,
          sessions: t.sessions.map((s) => {
            if (s.key !== sessionKey) return s;
            return {
              ...s,
              exercises: s.exercises.map((e) => (e.key === entryKey ? { ...e, note } : e)),
            };
          }),
        };
      })
    );
  }

  function setSessionExerciseNumericField(
    trackKey: string,
    sessionKey: string,
    entryKey: string,
    field: "durationValue" | "sets" | "reps" | "restBetweenSetsSeconds" | "restAfterSeconds",
    value: string
  ) {
    if (value !== "" && !/^\d*$/.test(value)) return;
    setTracks((prev) =>
      prev.map((t) => {
        if (t.key !== trackKey) return t;
        return {
          ...t,
          sessions: t.sessions.map((s) => {
            if (s.key !== sessionKey) return s;
            return {
              ...s,
              exercises: s.exercises.map((e) =>
                e.key === entryKey ? { ...e, [field]: value } : e
              ),
            };
          }),
        };
      })
    );
  }

  function convertDurationValue(value: string, from: ExerciseDurationUnit, to: ExerciseDurationUnit): string {
    if (value.trim() === "" || from === to) return value;
    const n = Number.parseInt(value.trim(), 10);
    if (!Number.isFinite(n) || n < 0) return value;
    if (from === "sec" && to === "min") {
      return String(Math.max(1, Math.round(n / 60)));
    }
    return String(n * 60);
  }

  function setSessionExerciseDurationUnit(
    trackKey: string,
    sessionKey: string,
    entryKey: string,
    unit: ExerciseDurationUnit
  ) {
    setTracks((prev) =>
      prev.map((t) => {
        if (t.key !== trackKey) return t;
        return {
          ...t,
          sessions: t.sessions.map((s) => {
            if (s.key !== sessionKey) return s;
            return {
              ...s,
              exercises: s.exercises.map((e) => {
                if (e.key !== entryKey) return e;
                if (e.durationUnit === unit) return e;
                return {
                  ...e,
                  durationUnit: unit,
                  durationValue: convertDurationValue(e.durationValue, e.durationUnit, unit),
                };
              }),
            };
          }),
        };
      })
    );
  }

  const exerciseTitle = (id: string) => exercises.find((e) => e.id === id)?.title ?? id;

  function addOutcomeLine() {
    setOutcomeLines((prev) => [...prev, { key: crypto.randomUUID(), text: "" }]);
  }

  function removeOutcomeLine(key: string) {
    setOutcomeLines((prev) => (prev.length <= 1 ? prev : prev.filter((o) => o.key !== key)));
  }

  function setOutcomeLineText(key: string, text: string) {
    setOutcomeLines((prev) => prev.map((o) => (o.key === key ? { ...o, text } : o)));
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const form = e.currentTarget;

    try {
      let cover_image_url = ((form.elements.namedItem("cover_image_url") as HTMLInputElement)?.value ?? "").trim();
      let promo_video_url = ((form.elements.namedItem("promo_video_url") as HTMLInputElement)?.value ?? "").trim();
      let song_url = ((form.elements.namedItem("song_url") as HTMLInputElement)?.value ?? "").trim();

      if (coverFile) {
        cover_image_url = await uploadToProgramsBucket(coverFile, "cover");
      }
      if (promoVideoFile) {
        promo_video_url = await uploadToProgramsBucket(promoVideoFile, "promo");
      }
      if (songFile) {
        song_url = await uploadToProgramsBucket(songFile, "song");
      }

      if (tracks.length > 0) {
        for (const t of tracks) {
          if (!t.locationId) {
            setError("Select a location for each workout place (Gym, Home, etc.).");
            setPending(false);
            return;
          }
        }
      }

      const fd = new FormData(form);
      fd.set("cover_image_url", cover_image_url);
      fd.set("promo_video_url", promo_video_url);
      fd.set("song_url", song_url);
      for (const cid of selectedCategoryIds) {
        fd.append("category_ids", cid);
      }
      fd.set("program_format", programFormat);
      const curriculumPayload = tracks.map((tr) => {
        const sessionList =
          programFormat === "single_workout" ? tr.sessions.slice(0, 1) : tr.sessions;
        const week_sizes =
          programFormat === "training_plan"
            ? resolveWeekSizes(tr, sessionsPerWeek)
            : undefined;
        return {
          location_id: tr.locationId,
          ...(week_sizes?.length ? { week_sizes } : {}),
          sessions: sessionList.map(({ name, description, durationMinutes, exercises: sessionExercises }) => {
          let duration_minutes: number | null = null;
          if (durationMinutes.trim() !== "") {
            const n = Number.parseInt(durationMinutes, 10);
            if (Number.isFinite(n) && n >= 0) duration_minutes = n;
          }
          const exerciseRows = sessionExercises.map((e) => {
            const prescriptionType = clampProgramPrescriptionType(
              exerciseProgramMode(exercises, e.exerciseId),
              e.prescriptionType
            );
            let duration_seconds: number | null = null;
            let duration_minutes: number | null = null;
            let sets: number | null = null;
            let reps: number | null = null;
            let rest_between_sets_seconds: number | null = null;

            if (prescriptionType === "time" || prescriptionType === "timed_intervals") {
              if (e.durationValue.trim() !== "") {
                const n = Number.parseInt(e.durationValue, 10);
                if (Number.isFinite(n) && n >= 0) {
                  if (e.durationUnit === "sec") duration_seconds = n;
                  else duration_minutes = n;
                }
              }
            }

            if (prescriptionType === "sets_reps") {
              if (e.sets.trim() !== "") {
                const n = Number.parseInt(e.sets, 10);
                if (Number.isFinite(n) && n >= 0) sets = n;
              }
              if (e.reps.trim() !== "") {
                const n = Number.parseInt(e.reps, 10);
                if (Number.isFinite(n) && n >= 0) reps = n;
              }
            }

            if (prescriptionType === "timed_intervals") {
              if (e.sets.trim() !== "") {
                const n = Number.parseInt(e.sets, 10);
                if (Number.isFinite(n) && n > 0) sets = n;
              }
              if (e.restBetweenSetsSeconds.trim() !== "") {
                const n = Number.parseInt(e.restBetweenSetsSeconds, 10);
                if (Number.isFinite(n) && n > 0) rest_between_sets_seconds = n;
              }
            }

            let rest_after_seconds: number | null = null;
            if (e.restAfterSeconds.trim() !== "") {
              const n = Number.parseInt(e.restAfterSeconds, 10);
              if (Number.isFinite(n) && n >= 0) rest_after_seconds = n;
            }
            const note = e.note.trim() || null;
            return {
              exercise_id: e.exerciseId,
              duration_seconds,
              duration_minutes,
              sets,
              reps,
              rest_between_sets_seconds,
              rest_after_seconds,
              session_phase: e.sessionPhase,
              choice_group: e.choiceGroup.trim() || null,
              note,
            };
          });
          return {
            name,
            description: description.trim() || null,
            duration_minutes,
            exercises: exerciseRows,
          };
        }),
        };
      });
      fd.set("curriculum_json", JSON.stringify(curriculumPayload));
      const outcomesPayload = outcomeLines.map((o) => o.text.trim()).filter(Boolean);
      fd.set("outcomes_json", JSON.stringify(outcomesPayload));

      if (programId) {
        fd.set("program_id", programId);
      }

      const mediaUrls = { cover_image_url, promo_video_url, song_url };
      const result = programId
        ? await updateProgram(fd, mediaUrls)
        : await createProgram(fd, mediaUrls);
      if ("error" in result) {
        setError(result.error);
      } else {
        router.push("/admin/programs");
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-gray-50 min-h-0">
      <div className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6 lg:px-8 shrink-0 z-10">
        <div className="flex items-center gap-4 min-w-0">
          <Link
            href="/admin/programs"
            className="p-1.5 -ml-1.5 text-gray-400 hover:text-black hover:bg-gray-100 rounded-md transition-colors shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="h-4 w-px bg-gray-200 shrink-0" />
          <h1 className="text-lg font-semibold text-gray-900 truncate">
            {programId ? "Edit program" : "Create New Program"}
          </h1>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setAiModalOpen(true)}
            disabled={exercises.length === 0 || locations.length === 0}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            title={
              exercises.length === 0
                ? "Add exercises to the library first"
                : "Generate program with AI from your exercise library"
            }
          >
            <Sparkles className="w-4 h-4" />
            <span className="hidden sm:inline">AI builder</span>
          </button>
          <button
            type="button"
            disabled
            className="hidden sm:flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-400 bg-white border border-gray-200 rounded-lg cursor-not-allowed"
            title="Coming soon"
          >
            <Save className="w-4 h-4" />
            Save Draft
          </button>
          <button
            type="submit"
            form="create-program-form"
            disabled={pending}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-black rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-60"
          >
            <Check className="w-4 h-4" />
            {pending ? "Saving…" : programId ? "Save changes" : "Save program"}
          </button>
        </div>
      </div>

      <div className="shrink-0 bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-6 lg:px-8">
          <nav
            className="flex gap-1 sm:gap-2 overflow-x-auto -mb-px"
            role="tablist"
            aria-label="Program form sections"
          >
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex shrink-0 items-center gap-2 border-b-2 px-1 py-3 text-sm font-medium transition-colors sm:px-2 ${
                    isActive
                      ? "border-black text-gray-900"
                      : "border-transparent text-gray-500 hover:text-gray-900"
                  }`}
                >
                  <tab.icon className={`h-4 w-4 ${isActive ? "text-black" : "text-gray-400"}`} />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-auto">
        <form id="create-program-form" onSubmit={onSubmit} className="max-w-5xl mx-auto p-6 lg:p-8">
          {programId && <input type="hidden" name="program_id" value={programId} />}
          {loadError && (
            <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              {loadError}
            </div>
          )}
          {aiNotice && (
            <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 flex items-start justify-between gap-3">
              <span>{aiNotice}</span>
              <button
                type="button"
                onClick={() => setAiNotice(null)}
                className="shrink-0 text-emerald-700 hover:text-emerald-900 text-xs font-medium"
              >
                Dismiss
              </button>
            </div>
          )}
          {error && (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {error}
            </div>
          )}

          <div className={activeTab === "basic" ? "space-y-6" : "hidden"}>
            <div className="bg-white rounded-xl border border-gray-200 p-6 lg:p-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">General information</h2>

              <div className="space-y-5">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Program title <span className="text-red-600">*</span>
                  </label>
                  <input
                    id="title"
                    name="title"
                    required
                    defaultValue={initial?.title ?? ""}
                    placeholder="e.g. Ultimate smash power"
                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                  />
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Short description
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    rows={3}
                    defaultValue={initial?.description ?? ""}
                    placeholder="A brief summary for program cards…"
                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent resize-none"
                  />
                  <p className="mt-1.5 text-xs text-gray-500">Shown on the program card in the library.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="md:col-span-2">
                    <p className="block text-sm font-medium text-gray-700 mb-2">Categories</p>
                    <p className="text-xs text-gray-500 mb-3">Select one or more. Shown on program cards and filters.</p>
                    <div className="flex flex-wrap gap-2">
                      {categories.map((c) => {
                        const on = selectedCategoryIds.includes(c.id);
                        return (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => toggleCategory(c.id)}
                            className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                              on
                                ? "border-black bg-black text-white"
                                : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                            }`}
                          >
                            {c.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div>
                    <label htmlFor="difficulty_level_id" className="block text-sm font-medium text-gray-700 mb-1.5">
                      Difficulty level
                    </label>
                    <div className="relative">
                      <select
                        id="difficulty_level_id"
                        name="difficulty_level_id"
                        className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent appearance-none"
                        defaultValue={initial?.difficultyLevelId ?? ""}
                      >
                        <option value="">Select level…</option>
                        {difficulties.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.name}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                </div>

                <div className="pt-1">
                  <p className="text-sm font-medium text-gray-900 mb-3">Program type</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {(
                      [
                        {
                          id: "training_plan" as const,
                          title: "Training plan",
                          desc: "Multi-week schedule with days to complete in order",
                        },
                        {
                          id: "single_workout" as const,
                          title: "Single workout",
                          desc: "One-off routine (e.g. pre-match warm-up)",
                        },
                      ] as const
                    ).map((opt) => {
                      const selected = programFormat === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setProgramFormat(opt.id)}
                          className={`rounded-xl border-2 p-4 text-left transition ${
                            selected
                              ? "border-black bg-gray-50"
                              : "border-gray-200 bg-white hover:border-gray-300"
                          }`}
                        >
                          <span className="block text-sm font-semibold text-gray-900">{opt.title}</span>
                          <span className="mt-1 block text-xs text-gray-500">{opt.desc}</span>
                        </button>
                      );
                    })}
                  </div>
                  <input type="hidden" name="program_format" value={programFormat} />
                </div>

                {programFormat === "training_plan" && (
                <div className="pt-1">
                  <p className="text-sm font-medium text-gray-900 mb-3">Schedule</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                    <div>
                      <label htmlFor="duration_weeks" className="block text-sm font-medium text-gray-700 mb-1.5">
                        Duration
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          id="duration_weeks"
                          name="duration_weeks"
                          type="number"
                          min={0}
                          step={1}
                          defaultValue={initial?.durationWeeks ?? ""}
                          placeholder="e.g. 4"
                          className="min-w-0 flex-1 px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                        />
                        <span className="shrink-0 text-sm text-gray-500 tabular-nums">Weeks</span>
                      </div>
                    </div>
                    <div>
                      <label htmlFor="sessions_per_week" className="block text-sm font-medium text-gray-700 mb-1.5">
                        Frequency
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          id="sessions_per_week"
                          name="sessions_per_week"
                          type="number"
                          min={0}
                          step={1}
                          value={sessionsPerWeek}
                          onChange={(e) => setSessionsPerWeek(e.target.value)}
                          placeholder="e.g. 3"
                          className="min-w-0 flex-1 px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                        />
                        <span className="shrink-0 text-sm text-gray-500 tabular-nums">/ week</span>
                      </div>
                    </div>
                    <div>
                      <label htmlFor="minutes_per_session" className="block text-sm font-medium text-gray-700 mb-1.5">
                        Per session
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          id="minutes_per_session"
                          name="minutes_per_session"
                          type="number"
                          min={0}
                          step={1}
                          defaultValue={initial?.minutesPerSession ?? ""}
                          placeholder="e.g. 45"
                          className="min-w-0 flex-1 px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                        />
                        <span className="shrink-0 text-sm text-gray-500 tabular-nums">mins</span>
                      </div>
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-gray-500">
                    Optional summary for program cards; session lengths in the curriculum can still vary.
                  </p>
                </div>
                )}

                {programFormat === "single_workout" && (
                  <div className="pt-1">
                    <label htmlFor="minutes_per_session_single" className="block text-sm font-medium text-gray-700 mb-1.5">
                      Duration
                    </label>
                    <div className="flex items-center gap-2 max-w-xs">
                      <input
                        id="minutes_per_session_single"
                        name="minutes_per_session"
                        type="number"
                        min={0}
                        step={1}
                        defaultValue={initial?.minutesPerSession ?? ""}
                        placeholder="e.g. 7"
                        className="min-w-0 flex-1 px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                      />
                      <span className="shrink-0 text-sm text-gray-500 tabular-nums">mins</span>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    What you&apos;ll achieve
                  </label>
                  <p className="text-xs text-gray-500 mb-3">
                    Short bullet points for the program page (checklist with icons).
                  </p>
                  <ul className="space-y-2">
                    {outcomeLines.map((line) => (
                      <li key={line.key} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={line.text}
                          onChange={(e) => setOutcomeLineText(line.key, e.target.value)}
                          placeholder="e.g. Increase racket head speed by up to 25%"
                          className="min-w-0 flex-1 px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => removeOutcomeLine(line.key)}
                          disabled={outcomeLines.length <= 1}
                          className="shrink-0 p-2 text-gray-400 hover:text-red-600 rounded-lg disabled:opacity-30 disabled:pointer-events-none"
                          aria-label="Remove outcome line"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    onClick={addOutcomeLine}
                    className="mt-3 flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-black"
                  >
                    <Plus className="w-4 h-4" />
                    Add bullet
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6 lg:p-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Detailed content</h2>
              <div>
                <label htmlFor="body" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Full description
                </label>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-gray-50 border-b border-gray-200 px-3 py-2 flex items-center gap-2">
                    <div className="w-6 h-6 bg-gray-200 rounded" />
                    <div className="w-6 h-6 bg-gray-200 rounded" />
                    <div className="w-6 h-6 bg-gray-200 rounded" />
                    <div className="w-px h-4 bg-gray-300 mx-1" />
                    <div className="w-6 h-6 bg-gray-200 rounded" />
                  </div>
                  <textarea
                    id="body"
                    name="body"
                    rows={8}
                    defaultValue={initial?.body ?? ""}
                    placeholder="Long-form sales / detail page content…"
                    className="w-full px-4 py-3 bg-white text-sm focus:outline-none resize-y"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setActiveTab("media")}
                className="bg-black text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
              >
                Continue to Media
              </button>
            </div>
          </div>

          <div className={activeTab === "media" ? "space-y-6" : "hidden"}>
            <div className="bg-white rounded-xl border border-gray-200 p-6 lg:p-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Program images</h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Cover image</label>
                <input
                  id="program-cover-upload"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="sr-only"
                  onChange={(e) => applyCoverFile(e.target.files?.[0])}
                />
                <label
                  htmlFor="program-cover-upload"
                  onDragEnter={(e) => {
                    e.preventDefault();
                    setCoverDragging(true);
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = "copy";
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    if (!e.currentTarget.contains(e.relatedTarget as Node)) setCoverDragging(false);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    setCoverDragging(false);
                    applyCoverFile(e.dataTransfer.files?.[0]);
                  }}
                  className={`border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center text-center transition-colors cursor-pointer group ${
                    coverDragging ? "border-black bg-gray-100" : "border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <UploadCloud className="w-6 h-6 text-gray-500" />
                  </div>
                  <p className="text-sm font-medium text-gray-900 mb-1">Click to upload or drag and drop</p>
                  <p className="text-xs text-gray-500">PNG, JPG, WebP, or GIF</p>
                </label>
                {coverFile && (
                  <div className="mt-3 flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
                    <span className="truncate text-sm font-medium text-gray-900">{coverFile.name}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setCoverFile(null);
                        const el = document.getElementById("program-cover-upload") as HTMLInputElement | null;
                        if (el) el.value = "";
                      }}
                      className="shrink-0 text-sm font-medium text-red-600 hover:text-red-700"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>

              <div className="relative flex items-center gap-4 my-8">
                <div className="h-px flex-1 bg-gray-200" />
                <span className="text-xs font-medium uppercase tracking-wider text-gray-400">or</span>
                <div className="h-px flex-1 bg-gray-200" />
              </div>

              <div>
                <label htmlFor="cover_image_url" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Cover image URL
                </label>
                <input
                  id="cover_image_url"
                  name="cover_image_url"
                  type="url"
                  defaultValue={initial?.coverImageUrl ?? ""}
                  placeholder="https://…"
                  className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6 lg:p-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Promo video</h2>
              <p className="text-sm text-gray-500 mb-6">
                Upload a file, or paste a link (Vimeo, YouTube, or direct MP4).
              </p>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Upload video file</label>
                <input
                  id="promo-video-upload"
                  type="file"
                  accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov"
                  className="sr-only"
                  onChange={(e) => applyPromoVideoFile(e.target.files?.[0])}
                />
                <label
                  htmlFor="promo-video-upload"
                  onDragEnter={(e) => {
                    e.preventDefault();
                    setPromoVideoDragging(true);
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = "copy";
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    if (!e.currentTarget.contains(e.relatedTarget as Node)) setPromoVideoDragging(false);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    setPromoVideoDragging(false);
                    applyPromoVideoFile(e.dataTransfer.files?.[0]);
                  }}
                  className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center transition-colors cursor-pointer group ${
                    promoVideoDragging ? "border-black bg-gray-100" : "border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                    <Video className="w-6 h-6 text-gray-600" />
                  </div>
                  <p className="text-sm font-medium text-gray-900 mb-1">Click to upload or drag and drop</p>
                  <p className="text-xs text-gray-500">MP4, WebM, or MOV</p>
                </label>
                {promoVideoFile && (
                  <div className="mt-3 flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
                    <div className="min-w-0 flex items-center gap-2">
                      <Video className="h-4 w-4 shrink-0 text-gray-500" />
                      <span className="truncate text-sm font-medium text-gray-900">{promoVideoFile.name}</span>
                      <span className="shrink-0 text-xs text-gray-500">
                        ({(promoVideoFile.size / (1024 * 1024)).toFixed(1)} MB)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setPromoVideoFile(null);
                        const input = document.getElementById("promo-video-upload") as HTMLInputElement | null;
                        if (input) input.value = "";
                      }}
                      className="shrink-0 text-sm font-medium text-red-600 hover:text-red-700"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>

              <div className="relative flex items-center gap-4 my-8">
                <div className="h-px flex-1 bg-gray-200" />
                <span className="text-xs font-medium uppercase tracking-wider text-gray-400">or</span>
                <div className="h-px flex-1 bg-gray-200" />
              </div>

              <div>
                <label htmlFor="promo_video_url" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Video URL
                </label>
                <input
                  id="promo_video_url"
                  name="promo_video_url"
                  type="url"
                  defaultValue={initial?.promoVideoUrl ?? ""}
                  placeholder="https://…"
                  className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6 lg:p-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Program music</h2>
              <p className="text-sm text-gray-500 mb-6">
                Optional MP3 soundtrack for this program (upload or paste a direct link).
              </p>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Upload MP3</label>
                <input
                  id="program-song-upload"
                  type="file"
                  accept="audio/mpeg,.mp3,audio/mp3"
                  className="sr-only"
                  onChange={(e) => applySongFile(e.target.files?.[0])}
                />
                <label
                  htmlFor="program-song-upload"
                  onDragEnter={(e) => {
                    e.preventDefault();
                    setSongDragging(true);
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = "copy";
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    if (!e.currentTarget.contains(e.relatedTarget as Node)) setSongDragging(false);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    setSongDragging(false);
                    applySongFile(e.dataTransfer.files?.[0]);
                  }}
                  className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center transition-colors cursor-pointer group ${
                    songDragging ? "border-black bg-gray-100" : "border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                    <Music className="w-6 h-6 text-gray-600" />
                  </div>
                  <p className="text-sm font-medium text-gray-900 mb-1">Click to upload or drag and drop</p>
                  <p className="text-xs text-gray-500">MP3</p>
                </label>
                {songFile && (
                  <div className="mt-3 flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
                    <div className="min-w-0 flex items-center gap-2">
                      <Music className="h-4 w-4 shrink-0 text-gray-500" />
                      <span className="truncate text-sm font-medium text-gray-900">{songFile.name}</span>
                      <span className="shrink-0 text-xs text-gray-500">
                        ({(songFile.size / (1024 * 1024)).toFixed(1)} MB)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSongFile(null);
                        const input = document.getElementById("program-song-upload") as HTMLInputElement | null;
                        if (input) input.value = "";
                      }}
                      className="shrink-0 text-sm font-medium text-red-600 hover:text-red-700"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>

              <div className="relative flex items-center gap-4 my-8">
                <div className="h-px flex-1 bg-gray-200" />
                <span className="text-xs font-medium uppercase tracking-wider text-gray-400">or</span>
                <div className="h-px flex-1 bg-gray-200" />
              </div>

              <div>
                <label htmlFor="song_url" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Audio URL
                </label>
                <input
                  id="song_url"
                  name="song_url"
                  type="url"
                  defaultValue={initial?.songUrl ?? ""}
                  placeholder="https://…"
                  className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div className="flex justify-between gap-4">
              <button
                type="button"
                onClick={() => setActiveTab("basic")}
                className="px-6 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("curriculum")}
                className="bg-black text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
              >
                Continue to curriculum
              </button>
            </div>
          </div>

          <div className={activeTab === "curriculum" ? "space-y-6" : "hidden"}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Workout by location</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Add a block per place members can train (e.g. Gym vs Home). Each location has its own sessions
                  and exercises—members pick where they work out and follow that track. Set{" "}
                  <strong className="font-medium text-gray-700">Frequency</strong> on the Basic tab to group
                  sessions into weeks and duplicate whole weeks at once. Drag exercises by the grip handle to
                  reorder.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAiModalOpen(true)}
                disabled={exercises.length === 0 || locations.length === 0}
                className="flex shrink-0 items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-900 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Sparkles className="h-4 w-4" />
                Generate with AI
              </button>
            </div>

            {locations.length === 0 && (
              <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
                No locations in the database. Add locations in Supabase (or run migrations) before building a
                curriculum.
              </p>
            )}

            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-4 border-b border-gray-200">
              <nav
                className="flex min-w-0 flex-1 gap-1 overflow-x-auto -mb-px"
                role="tablist"
                aria-label="Workout locations"
              >
                {tracks.map((track, ti) => {
                  const isActive = track.key === effectiveLocationTabKey;
                  const locName = track.locationId
                    ? locations.find((l) => l.id === track.locationId)?.name
                    : null;
                  const label = locName ?? `Place ${ti + 1}`;
                  return (
                    <button
                      key={track.key}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      onClick={() => setActiveLocationTabKey(track.key)}
                      className={`shrink-0 border-b-2 px-3 py-2.5 text-sm font-medium transition-colors sm:px-4 ${
                        isActive
                          ? "border-black text-gray-900"
                          : "border-transparent text-gray-500 hover:text-gray-900"
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </nav>
              <button
                type="button"
                onClick={addTrack}
                disabled={locations.length === 0}
                className="flex shrink-0 items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed sm:mb-0.5"
              >
                <Plus className="w-4 h-4" />
                Add location
              </button>
            </div>

            {activeTrack && (
              <div className="rounded-xl border-2 border-gray-200 bg-gray-50/30 overflow-visible">
                <div className="p-4 border-b border-gray-200 bg-white flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                  <div className="flex-1 min-w-0 space-y-2">
                    <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Workout place
                    </span>
                    <div className="relative max-w-md">
                      <label className="sr-only" htmlFor={`track-loc-${activeTrack.key}`}>
                        Location
                      </label>
                      <select
                        id={`track-loc-${activeTrack.key}`}
                        value={activeTrack.locationId}
                        onChange={(e) => setTrackLocation(activeTrack.key, e.target.value)}
                        className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-black appearance-none"
                      >
                        <option value="">Select location…</option>
                        {locations.map((loc) => (
                          <option
                            key={loc.id}
                            value={loc.id}
                            disabled={locationIdsUsedElsewhere.has(loc.id)}
                          >
                            {loc.name}
                            {locationIdsUsedElsewhere.has(loc.id) ? " (used)" : ""}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => moveTrack(activeTrack.key, -1)}
                      disabled={activeTrackIndex === 0}
                      className="px-2 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded disabled:opacity-30"
                    >
                      Location up
                    </button>
                    <button
                      type="button"
                      onClick={() => moveTrack(activeTrack.key, 1)}
                      disabled={activeTrackIndex === tracks.length - 1}
                      className="px-2 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded disabled:opacity-30"
                    >
                      Location down
                    </button>
                    <button
                      type="button"
                      onClick={() => removeTrack(activeTrack.key)}
                      disabled={tracks.length <= 1}
                      className="p-1.5 text-gray-400 hover:text-red-600 rounded disabled:opacity-30"
                      title="Remove this location from program"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="p-4 sm:p-6 space-y-6">
                  {(programFormat === "training_plan"
                    ? groupSessionsByWeekSizes(
                        activeTrack.sessions,
                        resolveWeekSizes(activeTrack, sessionsPerWeek)
                      )
                    : [
                        {
                          weekIndex: 0,
                          items: activeTrack.sessions.map((session, globalIndex) => ({
                            session,
                            globalIndex,
                          })),
                        },
                      ]
                  ).map((week) => {
                    const weekKey = weekSectionKey(activeTrack.key, week.weekIndex);
                    const isWeekCollapsed = collapsedWeeks.has(weekKey);
                    return (
                    <div key={`week-${activeTrack.key}-${week.weekIndex}`} className="space-y-4">
                      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-2.5">
                        <button
                          type="button"
                          onClick={() => toggleWeekCollapsed(weekKey)}
                          className="flex min-w-0 flex-1 items-center gap-2 text-left"
                          aria-expanded={!isWeekCollapsed}
                        >
                          <ChevronDown
                            className={`h-4 w-4 shrink-0 text-gray-500 transition-transform duration-200 ${
                              isWeekCollapsed ? "-rotate-90" : ""
                            }`}
                          />
                          <p className="text-sm font-semibold text-gray-800">
                            {programFormat === "training_plan" ? `Week ${week.weekIndex + 1}` : "Workout"}
                            <span className="ml-2 font-normal text-gray-500">
                              {week.items.length}{" "}
                              {programFormat === "training_plan"
                                ? `day${week.items.length === 1 ? "" : "s"}`
                                : `session${week.items.length === 1 ? "" : "s"}`}
                            </span>
                          </p>
                        </button>
                        {programFormat === "training_plan" && (
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => addDayToWeek(activeTrack.key, week.weekIndex)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100"
                            title="Add a day to this week"
                          >
                            <Plus className="h-3.5 w-3.5" />
                            Add day
                          </button>
                          <button
                            type="button"
                            onClick={() => duplicateWeekInTrack(activeTrack.key, week.weekIndex)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100"
                            title="Duplicate all sessions in this week"
                          >
                            <Copy className="h-3.5 w-3.5" />
                            Duplicate week
                          </button>
                        </div>
                        )}
                      </div>

                      {!isWeekCollapsed &&
                      week.items.map(({ session, globalIndex: si }) => {
                    const sessionCollapseKey = sessionSectionKey(activeTrack.key, session.key);
                    const isSessionCollapsed = collapsedSessions.has(sessionCollapseKey);
                    return (
                    <div
                      key={session.key}
                      className="bg-white rounded-xl border border-gray-200 overflow-visible shadow-sm"
                    >
                      <div className="p-4 border-b border-gray-200 bg-gray-50/50 flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <button
                            type="button"
                            onClick={() => toggleSessionCollapsed(sessionCollapseKey)}
                            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100"
                            aria-expanded={!isSessionCollapsed}
                            aria-label={isSessionCollapsed ? "Expand session" : "Collapse session"}
                          >
                            <ChevronDown
                              className={`h-4 w-4 transition-transform duration-200 ${
                                isSessionCollapsed ? "-rotate-90" : ""
                              }`}
                            />
                          </button>
                          <GripVertical className="w-4 h-4 text-gray-400 shrink-0" />
                          <label className="sr-only" htmlFor={`session-name-${activeTrack.key}-${session.key}`}>
                            Session name
                          </label>
                          <input
                            id={`session-name-${activeTrack.key}-${session.key}`}
                            type="text"
                            value={session.name}
                            onChange={(e) => setSessionName(activeTrack.key, session.key, e.target.value)}
                            placeholder="e.g. Day 1: Upper body"
                            className="flex-1 min-w-0 px-3 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-black"
                          />
                          {isSessionCollapsed && (
                            <span className="hidden shrink-0 text-xs text-gray-500 sm:inline">
                              {session.exercises.length} exercise
                              {session.exercises.length === 1 ? "" : "s"}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => duplicateSessionInTrack(activeTrack.key, session.key)}
                            className="inline-flex items-center gap-1.5 px-2 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100 rounded border border-gray-200 bg-white"
                            title="Duplicate this session (same exercises and settings)"
                          >
                            <Copy className="w-3.5 h-3.5" />
                            Duplicate
                          </button>
                          <button
                            type="button"
                            onClick={() => moveSessionInTrack(activeTrack.key, session.key, -1)}
                            disabled={si === 0}
                            className="px-2 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded disabled:opacity-30"
                          >
                            Session up
                          </button>
                          <button
                            type="button"
                            onClick={() => moveSessionInTrack(activeTrack.key, session.key, 1)}
                            disabled={si === activeTrack.sessions.length - 1}
                            className="px-2 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded disabled:opacity-30"
                          >
                            Session down
                          </button>
                          <button
                            type="button"
                            onClick={() => removeSessionFromTrack(activeTrack.key, session.key)}
                            disabled={activeTrack.sessions.length <= 1}
                            className="p-1.5 text-gray-400 hover:text-red-600 rounded disabled:opacity-30"
                            title="Remove session"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {!isSessionCollapsed && (
                      <div className="p-6 space-y-4">
                        <div className="grid gap-4 lg:grid-cols-[1fr_140px] lg:items-start">
                          <div>
                            <label
                              htmlFor={`session-desc-${activeTrack.key}-${session.key}`}
                              className="block text-sm font-medium text-gray-700 mb-1.5"
                            >
                              Session description
                            </label>
                            <textarea
                              id={`session-desc-${activeTrack.key}-${session.key}`}
                              value={session.description}
                              onChange={(e) =>
                                setSessionDescription(activeTrack.key, session.key, e.target.value)
                              }
                              placeholder="Focus, equipment, or what this block covers…"
                              rows={3}
                              className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-black resize-y min-h-20"
                            />
                          </div>
                          <div>
                            <label
                              htmlFor={`session-duration-${activeTrack.key}-${session.key}`}
                              className="block text-sm font-medium text-gray-700 mb-1.5"
                            >
                              Duration (minutes)
                            </label>
                            <input
                              id={`session-duration-${activeTrack.key}-${session.key}`}
                              type="text"
                              inputMode="numeric"
                              pattern="[0-9]*"
                              value={session.durationMinutes}
                              onChange={(e) =>
                                setSessionDurationMinutes(activeTrack.key, session.key, e.target.value)
                              }
                              placeholder="e.g. 45"
                              className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-black"
                            />
                            <p className="mt-1.5 text-xs text-gray-500">Optional.</p>
                          </div>
                        </div>

                        {exercises.length === 0 ? (
                          <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
                            No exercises in the library yet. Create exercises first.
                          </p>
                        ) : (
                          <>
                            <div className="flex flex-col sm:flex-row gap-3 sm:items-start">
                              <ExerciseSearchCombobox
                                exercises={trackExerciseOptions}
                                value={sessionPicks[pickCompoundKey(activeTrack.key, session.key)] ?? ""}
                                onChange={(id) =>
                                  setSessionPicks((p) => ({
                                    ...p,
                                    [pickCompoundKey(activeTrack.key, session.key)]: id,
                                  }))
                                }
                                excludeIds={session.exercises.map((e) => e.exerciseId)}
                                disabled={!activeTrack.locationId}
                                placeholder={
                                  activeTrack.locationId
                                    ? "Search and select an exercise…"
                                    : "Select a location first…"
                                }
                              />
                              <button
                                type="button"
                                onClick={() => addExerciseToSession(activeTrack.key, session.key)}
                                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800 shrink-0"
                              >
                                <Plus className="w-4 h-4" />
                                Add to session
                              </button>
                            </div>

                            <ul
                              className="space-y-3"
                              onDragOver={(e) => {
                                if (!draggingExercise || draggingExercise.sessionKey !== session.key) return;
                                e.preventDefault();
                              }}
                              onDrop={(e) => {
                                e.preventDefault();
                                if (
                                  !draggingExercise ||
                                  draggingExercise.trackKey !== activeTrack.key ||
                                  draggingExercise.sessionKey !== session.key
                                ) {
                                  return;
                                }
                                reorderExerciseInSession(
                                  activeTrack.key,
                                  session.key,
                                  draggingExercise.index,
                                  session.exercises.length - 1
                                );
                                setDraggingExercise(null);
                                setDropExerciseTarget(null);
                              }}
                            >
                              {session.exercises.map((entry, index) => {
                                const exerciseMeta = exercises.find((e) => e.id === entry.exerciseId);
                                const programMode = exerciseProgramMode(exercises, entry.exerciseId);
                                const prescriptionOptions = prescriptionOptionsForMode(programMode);
                                const activeType = clampProgramPrescriptionType(
                                  programMode,
                                  entry.prescriptionType
                                );

                                return (
                                <li
                                  key={entry.key}
                                  onDragOver={(e) => {
                                    if (
                                      !draggingExercise ||
                                      draggingExercise.trackKey !== activeTrack.key ||
                                      draggingExercise.sessionKey !== session.key
                                    ) {
                                      return;
                                    }
                                    e.preventDefault();
                                    setDropExerciseTarget({ sessionKey: session.key, index });
                                  }}
                                  onDrop={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    if (
                                      !draggingExercise ||
                                      draggingExercise.trackKey !== activeTrack.key ||
                                      draggingExercise.sessionKey !== session.key
                                    ) {
                                      return;
                                    }
                                    reorderExerciseInSession(
                                      activeTrack.key,
                                      session.key,
                                      draggingExercise.index,
                                      index
                                    );
                                    setDraggingExercise(null);
                                    setDropExerciseTarget(null);
                                  }}
                                  className={`border rounded-lg bg-white p-3 sm:p-4 transition-shadow ${
                                    draggingExercise?.sessionKey === session.key &&
                                    draggingExercise.index === index
                                      ? "opacity-50 border-gray-200"
                                      : dropExerciseTarget?.sessionKey === session.key &&
                                          dropExerciseTarget.index === index
                                        ? "border-black ring-1 ring-black shadow-sm"
                                        : "border-gray-200"
                                  }`}
                                >
                                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                    <div className="flex items-start gap-3 min-w-0">
                                      <div
                                        draggable
                                        onDragStart={(e) => {
                                          e.dataTransfer.effectAllowed = "move";
                                          setDraggingExercise({
                                            trackKey: activeTrack.key,
                                            sessionKey: session.key,
                                            index,
                                          });
                                        }}
                                        onDragEnd={() => {
                                          setDraggingExercise(null);
                                          setDropExerciseTarget(null);
                                        }}
                                        className="mt-0.5 shrink-0 cursor-grab text-gray-400 active:cursor-grabbing"
                                        title="Drag to reorder"
                                      >
                                        <GripVertical className="h-4 w-4" />
                                      </div>
                                      <ExerciseVideoThumbnail
                                        title={exerciseMeta?.title ?? exerciseTitle(entry.exerciseId)}
                                        imageUrl={exerciseMeta?.image_url}
                                        videoUrl={exerciseMeta?.video_url}
                                      />
                                      <div className="min-w-0 flex-1">
                                        <p className="text-sm font-medium text-gray-900 truncate">
                                          {exerciseTitle(entry.exerciseId)}
                                        </p>
                                        <div className="mt-3">
                                          <label
                                            htmlFor={`ex-note-${entry.key}`}
                                            className="mb-1 block text-[10px] font-medium uppercase tracking-wide text-gray-500"
                                          >
                                            Coach note
                                          </label>
                                          <textarea
                                            id={`ex-note-${entry.key}`}
                                            value={entry.note}
                                            onChange={(e) =>
                                              setSessionExerciseNote(
                                                activeTrack.key,
                                                session.key,
                                                entry.key,
                                                e.target.value
                                              )
                                            }
                                            rows={2}
                                            placeholder="Optional note for the athlete (e.g. focus on form, tempo, or setup)"
                                            className="w-full resize-y rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-black"
                                          />
                                        </div>
                                        <p className="mt-2 text-xs text-gray-500">
                                          Choose how this exercise runs in the workout player. Rest after applies
                                          before the next exercise.
                                        </p>
                                        {prescriptionOptions.length === 1 ? (
                                          <p className="mt-3 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-sm text-gray-700">
                                            This exercise only supports{" "}
                                            <span className="font-medium">{prescriptionOptions[0]!.label}</span> in
                                            programs.
                                          </p>
                                        ) : (
                                          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                                            {prescriptionOptions.map((opt) => (
                                              <label
                                                key={opt.id}
                                                className={`flex min-w-0 flex-1 cursor-pointer flex-col rounded-lg border px-3 py-2.5 transition ${
                                                  activeType === opt.id
                                                    ? "border-black bg-gray-50 ring-1 ring-black"
                                                    : "border-gray-200 bg-white hover:border-gray-300"
                                                }`}
                                              >
                                                <span className="flex items-center gap-2">
                                                  <input
                                                    type="radio"
                                                    name={`prescription-${entry.key}`}
                                                    checked={activeType === opt.id}
                                                    onChange={() =>
                                                      setSessionExercisePrescriptionType(
                                                        activeTrack.key,
                                                        session.key,
                                                        entry.key,
                                                        opt.id
                                                      )
                                                    }
                                                    className="h-4 w-4 border-gray-300 text-black focus:ring-black"
                                                  />
                                                  <span className="text-sm font-medium text-gray-900">{opt.label}</span>
                                                </span>
                                                <span className="mt-1 pl-6 text-xs text-gray-500">{opt.hint}</span>
                                              </label>
                                            ))}
                                          </div>
                                        )}

                                        {activeType === "sets_reps" && (
                                          <div className="mt-3 grid grid-cols-2 gap-2 sm:max-w-md">
                                            <div>
                                              <label
                                                className="block text-[10px] font-medium uppercase tracking-wide text-gray-500 mb-1"
                                                htmlFor={`ex-sets-${entry.key}`}
                                              >
                                                Sets
                                              </label>
                                              <input
                                                id={`ex-sets-${entry.key}`}
                                                type="text"
                                                inputMode="numeric"
                                                pattern="[0-9]*"
                                                value={entry.sets}
                                                onChange={(e) =>
                                                  setSessionExerciseNumericField(
                                                    activeTrack.key,
                                                    session.key,
                                                    entry.key,
                                                    "sets",
                                                    e.target.value
                                                  )
                                                }
                                                placeholder="—"
                                                className="w-full px-2 py-1.5 border border-gray-200 rounded-md text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-black"
                                              />
                                            </div>
                                            <div>
                                              <label
                                                className="block text-[10px] font-medium uppercase tracking-wide text-gray-500 mb-1"
                                                htmlFor={`ex-reps-${entry.key}`}
                                              >
                                                Reps
                                              </label>
                                              <input
                                                id={`ex-reps-${entry.key}`}
                                                type="text"
                                                inputMode="numeric"
                                                pattern="[0-9]*"
                                                value={entry.reps}
                                                onChange={(e) =>
                                                  setSessionExerciseNumericField(
                                                    activeTrack.key,
                                                    session.key,
                                                    entry.key,
                                                    "reps",
                                                    e.target.value
                                                  )
                                                }
                                                placeholder="—"
                                                className="w-full px-2 py-1.5 border border-gray-200 rounded-md text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-black"
                                              />
                                            </div>
                                          </div>
                                        )}

                                        {activeType === "time" && (
                                          <div className="mt-3 max-w-xs">
                                            <label
                                              className="block text-[10px] font-medium uppercase tracking-wide text-gray-500 mb-1"
                                              htmlFor={`ex-dur-${entry.key}`}
                                            >
                                              Duration
                                            </label>
                                            <div className="flex gap-1">
                                              <input
                                                id={`ex-dur-${entry.key}`}
                                                type="text"
                                                inputMode="numeric"
                                                pattern="[0-9]*"
                                                value={entry.durationValue}
                                                onChange={(e) =>
                                                  setSessionExerciseNumericField(
                                                    activeTrack.key,
                                                    session.key,
                                                    entry.key,
                                                    "durationValue",
                                                    e.target.value
                                                  )
                                                }
                                                placeholder="—"
                                                className="min-w-0 flex-1 px-2 py-1.5 border border-gray-200 rounded-md text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-black"
                                              />
                                              <select
                                                value={entry.durationUnit}
                                                onChange={(e) =>
                                                  setSessionExerciseDurationUnit(
                                                    activeTrack.key,
                                                    session.key,
                                                    entry.key,
                                                    e.target.value as ExerciseDurationUnit
                                                  )
                                                }
                                                className="shrink-0 rounded-md border border-gray-200 bg-white px-2 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-black"
                                                aria-label="Duration unit"
                                              >
                                                <option value="sec">Sec</option>
                                                <option value="min">Min</option>
                                              </select>
                                            </div>
                                          </div>
                                        )}

                                        {activeType === "timed_intervals" && (
                                          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 sm:max-w-xl">
                                            <div>
                                              <label
                                                className="block text-[10px] font-medium uppercase tracking-wide text-gray-500 mb-1"
                                                htmlFor={`ex-dur-${entry.key}`}
                                              >
                                                Work
                                              </label>
                                              <div className="flex gap-1">
                                                <input
                                                  id={`ex-dur-${entry.key}`}
                                                  type="text"
                                                  inputMode="numeric"
                                                  pattern="[0-9]*"
                                                  value={entry.durationValue}
                                                  onChange={(e) =>
                                                    setSessionExerciseNumericField(
                                                      activeTrack.key,
                                                      session.key,
                                                      entry.key,
                                                      "durationValue",
                                                      e.target.value
                                                    )
                                                  }
                                                  placeholder="20"
                                                  className="min-w-0 flex-1 px-2 py-1.5 border border-gray-200 rounded-md text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-black"
                                                />
                                                <select
                                                  value={entry.durationUnit}
                                                  onChange={(e) =>
                                                    setSessionExerciseDurationUnit(
                                                      activeTrack.key,
                                                      session.key,
                                                      entry.key,
                                                      e.target.value as ExerciseDurationUnit
                                                    )
                                                  }
                                                  className="shrink-0 rounded-md border border-gray-200 bg-white px-2 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-black"
                                                  aria-label="Work duration unit"
                                                >
                                                  <option value="sec">Sec</option>
                                                  <option value="min">Min</option>
                                                </select>
                                              </div>
                                            </div>
                                            <div>
                                              <label
                                                className="block text-[10px] font-medium uppercase tracking-wide text-gray-500 mb-1"
                                                htmlFor={`ex-rest-between-${entry.key}`}
                                              >
                                                Rest (sec)
                                              </label>
                                              <input
                                                id={`ex-rest-between-${entry.key}`}
                                                type="text"
                                                inputMode="numeric"
                                                pattern="[0-9]*"
                                                value={entry.restBetweenSetsSeconds}
                                                onChange={(e) =>
                                                  setSessionExerciseNumericField(
                                                    activeTrack.key,
                                                    session.key,
                                                    entry.key,
                                                    "restBetweenSetsSeconds",
                                                    e.target.value
                                                  )
                                                }
                                                placeholder="20"
                                                className="w-full px-2 py-1.5 border border-gray-200 rounded-md text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-black"
                                              />
                                            </div>
                                            <div>
                                              <label
                                                className="block text-[10px] font-medium uppercase tracking-wide text-gray-500 mb-1"
                                                htmlFor={`ex-sets-${entry.key}`}
                                              >
                                                Rounds
                                              </label>
                                              <input
                                                id={`ex-sets-${entry.key}`}
                                                type="text"
                                                inputMode="numeric"
                                                pattern="[0-9]*"
                                                value={entry.sets}
                                                onChange={(e) =>
                                                  setSessionExerciseNumericField(
                                                    activeTrack.key,
                                                    session.key,
                                                    entry.key,
                                                    "sets",
                                                    e.target.value
                                                  )
                                                }
                                                placeholder="5"
                                                className="w-full px-2 py-1.5 border border-gray-200 rounded-md text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-black"
                                              />
                                            </div>
                                          </div>
                                        )}

                                        <div className="mt-3 max-w-xs">
                                          <label
                                            className="block text-[10px] font-medium uppercase tracking-wide text-gray-500 mb-1"
                                            htmlFor={`ex-rest-${entry.key}`}
                                          >
                                            Rest after (sec)
                                          </label>
                                          <input
                                            id={`ex-rest-${entry.key}`}
                                            type="text"
                                            inputMode="numeric"
                                            pattern="[0-9]*"
                                            value={entry.restAfterSeconds}
                                            onChange={(e) =>
                                              setSessionExerciseNumericField(
                                                activeTrack.key,
                                                session.key,
                                                entry.key,
                                                "restAfterSeconds",
                                                e.target.value
                                              )
                                            }
                                            placeholder="—"
                                            className="w-full px-2 py-1.5 border border-gray-200 rounded-md text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-black"
                                          />
                                        </div>
                                      </div>
                                    </div>
                                    <div className="flex items-center justify-end gap-1 shrink-0 sm:flex-col sm:items-end sm:pt-1">
                                      <div className="flex gap-1">
                                        <button
                                          type="button"
                                          onClick={() =>
                                            moveExerciseInSession(
                                              activeTrack.key,
                                              session.key,
                                              index,
                                              -1
                                            )
                                          }
                                          disabled={index === 0}
                                          className="px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded disabled:opacity-30"
                                        >
                                          Up
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() =>
                                            moveExerciseInSession(
                                              activeTrack.key,
                                              session.key,
                                              index,
                                              1
                                            )
                                          }
                                          disabled={index === session.exercises.length - 1}
                                          className="px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded disabled:opacity-30"
                                        >
                                          Down
                                        </button>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          removeExerciseFromSession(
                                            activeTrack.key,
                                            session.key,
                                            index
                                          )
                                        }
                                        className="p-1.5 text-gray-400 hover:text-red-600 rounded"
                                        aria-label="Remove"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </div>
                                </li>
                                );
                              })}
                            </ul>
                          </>
                        )}
                      </div>
                      )}
                    </div>
                      );
                      })}
                    </div>
                  );
                  })}

                  {programFormat === "training_plan" ? (
                    <button
                      type="button"
                      onClick={() => addWeekToTrack(activeTrack.key)}
                      className="w-full py-3 border-2 border-dashed border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:text-black hover:border-gray-300 hover:bg-white transition-all flex items-center justify-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Add week
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => addSessionToTrack(activeTrack.key)}
                      className="w-full py-3 border-2 border-dashed border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:text-black hover:border-gray-300 hover:bg-white transition-all flex items-center justify-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Add session to this location
                    </button>
                  )}
                </div>
              </div>
            )}

            <div className="flex justify-between gap-4">
              <button
                type="button"
                onClick={() => setActiveTab("media")}
                className="px-6 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("settings")}
                className="bg-black text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
              >
                Continue to settings
              </button>
            </div>
          </div>

          <div className={activeTab === "settings" ? "space-y-6" : "hidden"}>
            <div className="bg-white rounded-xl border border-gray-200 p-6 lg:p-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Access</h2>

              <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4">
                <input
                  type="checkbox"
                  name="is_free"
                  value="1"
                  defaultChecked={initial?.isFree ?? false}
                  className="mt-1 h-4 w-4 rounded border-gray-300"
                />
                <span>
                  <span className="block text-sm font-medium text-gray-900">Free program</span>
                  <span className="mt-1 block text-xs text-gray-500">
                    Available to all signed-in members without Pro. Other programs require an active Pro
                    subscription.
                  </span>
                </span>
              </label>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6 lg:p-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Visibility</h2>

              <div className="space-y-4">
                <label className="flex items-start gap-3 p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <input
                    type="radio"
                    name="status"
                    value="published"
                    className="mt-1 w-4 h-4 text-black focus:ring-black border-gray-300"
                    defaultChecked={initial ? initial.status === "published" : true}
                  />
                  <div>
                    <div className="font-medium text-gray-900">Published</div>
                    <div className="text-sm text-gray-500">Visible to users when the storefront reads published programs.</div>
                  </div>
                </label>
                <label className="flex items-start gap-3 p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <input
                    type="radio"
                    name="status"
                    value="draft"
                    className="mt-1 w-4 h-4 text-black focus:ring-black border-gray-300"
                    defaultChecked={initial?.status === "draft"}
                  />
                  <div>
                    <div className="font-medium text-gray-900">Draft</div>
                    <div className="text-sm text-gray-500">Hidden from public listings (status = draft).</div>
                  </div>
                </label>
              </div>
            </div>

            <div className="flex flex-wrap justify-between gap-4">
              <button
                type="button"
                onClick={() => setActiveTab("curriculum")}
                className="px-6 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
              >
                Back
              </button>
              <div className="flex gap-3">
                <button
                  type="submit"
                  form="create-program-form"
                  disabled={pending}
                  className="bg-[#ccff00] text-black px-8 py-2.5 rounded-lg text-sm font-bold hover:bg-[#b3e600] transition-colors shadow-sm disabled:opacity-60"
                >
                  {pending ? "Saving…" : programId ? "Save changes" : "Save & publish"}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>

      <AiProgramGeneratorModal
        open={aiModalOpen}
        onClose={() => setAiModalOpen(false)}
        locations={locations}
        members={members}
        onApply={applyAiDraft}
      />
    </div>
  );
}
