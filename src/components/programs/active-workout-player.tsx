"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, Info, Minus, Pause, Play, Plus, SkipForward, X, ChevronLeft, ChevronRight, Moon, Music2, VolumeX } from "lucide-react";
import type { ProgramExerciseItem } from "@/lib/programs/program-exercises";
import {
  exerciseUsesTimedPlayback,
  formatExerciseMeta,
  formatExpandedBothSidesWorkLabel,
  formatSetsRepsLabel,
  CHOOSE_WEIGHT_HINT,
  hasTimedSets,
  hasRestBetweenSets,
  restBetweenSetsSeconds,
  restDurationSeconds,
  setsCount,
  workDurationSeconds,
} from "@/lib/programs/program-exercises";
import {
  expandWorkoutPlaybackPlaylist,
  isBilateralPlaybackStep,
  type WorkoutPlaybackStep,
} from "@/lib/programs/expand-workout-playlist";
import { resolveExerciseVideoSource } from "@/lib/programs/exercise-video-url";
import { useProgramWorkoutMusic } from "@/lib/programs/program-workout-music";
import { playExerciseEndBeeps, playExerciseStartBeeps, playRestEndingCue, playWorkEndingCue, prepareWorkoutAudio } from "@/lib/programs/workout-beeps";
import {
  defaultChoiceSelections,
  listChoiceGroups,
  resolveWorkoutPlaylist,
  SESSION_PHASE_LABELS,
} from "@/lib/programs/session-phase";
import {
  logProgramSessionComplete,
  logProgramSessionProgress,
  logProgramSessionStart,
} from "@/app/programs/program-progress-actions";
import { saveExerciseLoad } from "@/app/programs/exercise-load-actions";
import type { MemberExerciseLoad, WeightUnit } from "@/lib/programs/member-exercise-loads";
import { usesProgramProgress, type ProgramFormat } from "@/lib/programs/program-format";
import { programDayHref, programCatalogHref } from "@/lib/programs/program-routes";
import { BackButton } from "@/components/navigation/back-button";
import { ExerciseVideoFrame } from "@/components/programs/exercise-video-frame";
import { WorkoutCompletionOverlay } from "@/components/programs/workout-completion-overlay";
import { BothSidesChip } from "@/components/programs/both-sides-chip";
import { WorkoutSideBadge } from "@/components/programs/workout-side-badge";
import { ExerciseCoachGuidance } from "@/components/programs/rpe-info-button";

type Phase = "work" | "setRest" | "rest";

/** Seconds to preview the first exercise before the work timer starts. */
const FIRST_EXERCISE_PREP_SECONDS = 5;

function workPeriodFollowedByRest(
  step: WorkoutPlaybackStep,
  set: number,
  isLastStep: boolean
): boolean {
  if (isBilateralPlaybackStep(step)) {
    return step.postWorkRestSeconds > 0;
  }
  if (hasTimedSets(step) && set < setsCount(step)) {
    return hasRestBetweenSets(step) && restBetweenSetsSeconds(step) > 0;
  }
  return !isLastStep && restDurationSeconds(step) > 0;
}

const IFRAME_ALLOW =
  "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen";

function WorkoutVideo({
  url,
  playing,
  onReady,
  className = "",
}: {
  url: string | null;
  playing: boolean;
  onReady?: () => void;
  className?: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const player = useMemo(
    () => (url ? resolveExerciseVideoSource(url, playing) : null),
    [url, playing]
  );

  useEffect(() => {
    const v = videoRef.current;
    if (!v || player?.mode !== "video") return;
    if (playing) {
      void v.play().catch(() => {});
    } else {
      v.pause();
    }
  }, [playing, player?.mode, player?.src]);

  useEffect(() => {
    if (player?.mode === "iframe") {
      const t = window.setTimeout(() => onReady?.(), 1500);
      return () => window.clearTimeout(t);
    }
  }, [player, onReady]);

  if (!player) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-zinc-900 text-sm text-zinc-400">
        No video
      </div>
    );
  }

  if (player.mode === "iframe") {
    return (
      <iframe
        src={player.src}
        title="Exercise video"
        className={`absolute top-1/2 left-1/2 h-full w-[177.78%] max-w-none -translate-x-1/2 -translate-y-1/2 border-0 ${className}`}
        allow={IFRAME_ALLOW}
        allowFullScreen
      />
    );
  }

  return (
    <video
      ref={videoRef}
      src={player.src}
      className={`absolute inset-0 h-full w-full object-cover ${className}`}
      playsInline
      loop
      muted
      preload="auto"
      onCanPlayThrough={() => onReady?.()}
      onLoadedData={() => onReady?.()}
    />
  );
}

export function ActiveWorkoutPlayer({
  programId,
  programSlug,
  programTitle,
  programFormat,
  sessionId,
  sessionName,
  coverImageUrl: _coverImageUrl,
  songUrl,
  exercises,
  initialLoads = {},
  resumeStepIndex = null,
  nextSessionHref = null,
  nextSessionLabel = null,
  programComplete = false,
}: {
  programId: string;
  programSlug: string;
  programTitle: string;
  programFormat: ProgramFormat;
  sessionId: string;
  sessionName: string;
  coverImageUrl: string | null;
  songUrl: string | null;
  exercises: ProgramExerciseItem[];
  initialLoads?: Record<string, MemberExerciseLoad>;
  /** When set, continue an in-progress day at this 0-based playback step. */
  resumeStepIndex?: number | null;
  nextSessionHref?: string | null;
  nextSessionLabel?: string | null;
  programComplete?: boolean;
}) {
  const detailHref = usesProgramProgress(programFormat)
    ? programDayHref(programSlug, sessionId)
    : programCatalogHref(programSlug);

  const shouldResume = resumeStepIndex != null && resumeStepIndex >= 0;
  const [workoutStarted, setWorkoutStarted] = useState(shouldResume);
  const [workoutFinished, setWorkoutFinished] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(() =>
    shouldResume ? Math.max(0, Math.floor(resumeStepIndex)) : 0
  );
  const [currentSet, setCurrentSet] = useState(1);
  const [phase, setPhase] = useState<Phase>("work");
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const [isRunning, setIsRunning] = useState(!shouldResume);
  const [videoReady, setVideoReady] = useState(false);
  const [musicMuted, setMusicMuted] = useState(false);
  /** Non-null while counting down before the first exercise begins. */
  const [prepCountdown, setPrepCountdown] = useState<number | null>(null);
  /**
   * Preview the current exercise until the athlete taps Start/Continue.
   * Used for timed→timed handoff, resume, and sets×reps → timed.
   */
  const [awaitingTimedStart, setAwaitingTimedStart] = useState(shouldResume);
  /** True only for the initial resume landing screen (not later timed previews). */
  const [resumeEntry, setResumeEntry] = useState(shouldResume);
  const [completionLogged, setCompletionLogged] = useState(false);
  const [startLogged, setStartLogged] = useState(shouldResume);
  const resumeAppliedRef = useRef(false);
  const lastSavedStepRef = useRef<number | null>(
    shouldResume ? Math.max(0, Math.floor(resumeStepIndex)) : null
  );

  type LoadDraft = { value: string; unit: WeightUnit };
  const [loadDrafts, setLoadDrafts] = useState<Record<string, LoadDraft>>(() => {
    const init: Record<string, LoadDraft> = {};
    for (const [exerciseId, load] of Object.entries(initialLoads)) {
      init[exerciseId] = {
        value: String(load.weightValue),
        unit: load.weightUnit,
      };
    }
    return init;
  });
  const savedLoadsRef = useRef<Record<string, { weightValue: number; weightUnit: WeightUnit }>>(
    {}
  );
  const loadDraftsRef = useRef(loadDrafts);
  loadDraftsRef.current = loadDrafts;

  const restCuePlayedRef = useRef(false);
  const workCuePlayedRef = useRef(false);
  const prepCuePlayedRef = useRef(false);

  const choiceGroups = useMemo(() => listChoiceGroups(exercises), [exercises]);
  const [choiceSelections, setChoiceSelections] = useState<Record<string, string>>(() =>
    defaultChoiceSelections(listChoiceGroups(exercises))
  );

  const [showTips, setShowTips] = useState(false);

  useEffect(() => {
    setChoiceSelections(defaultChoiceSelections(choiceGroups));
  }, [choiceGroups]);

  const resolvedExercises = useMemo(
    () => resolveWorkoutPlaylist(exercises, choiceSelections),
    [exercises, choiceSelections]
  );

  const playbackSteps = useMemo(
    () => expandWorkoutPlaybackPlaylist(resolvedExercises),
    [resolvedExercises]
  );

  const len = playbackSteps.length;
  const current = len > 0 ? playbackSteps[Math.min(currentIndex, len - 1)] : null;
  const next =
    len > 0 && currentIndex < len - 1 ? playbackSteps[currentIndex + 1] : null;
  const previousPhase =
    currentIndex > 0 ? playbackSteps[currentIndex - 1]?.sessionPhase : null;
  const showPhaseBanner =
    workoutStarted &&
    current != null &&
    currentIndex > 0 &&
    previousPhase != null &&
    current.sessionPhase !== previousPhase;
  const isLast = len > 0 && currentIndex >= len - 1;
  const currentIsTimed = current != null && exerciseUsesTimedPlayback(current);
  const inPrep = workoutStarted && prepCountdown !== null && prepCountdown > 0;
  const inTimedPreview = workoutStarted && awaitingTimedStart && !inPrep;
  const inSetRest =
    workoutStarted && !inPrep && !inTimedPreview && currentIsTimed && phase === "setRest";
  const inExerciseRest =
    workoutStarted && !inPrep && !inTimedPreview && currentIsTimed && phase === "rest";
  const inRest = inSetRest || inExerciseRest;
  const totalSets = current
    ? isBilateralPlaybackStep(current)
      ? current.playbackSetsTotal
      : setsCount(current)
    : 1;
  const currentSetNumber = current
    ? isBilateralPlaybackStep(current)
      ? current.playbackSet
      : currentSet
    : 1;
  const showSetProgress =
    currentIsTimed &&
    current != null &&
    (isBilateralPlaybackStep(current)
      ? current.playbackSetsTotal > 1
      : hasTimedSets(current));

  const showProgressDots = !inPrep && !inTimedPreview;

  const displayVideoUrl =
    inExerciseRest ||
    (inSetRest &&
      current != null &&
      isBilateralPlaybackStep(current) &&
      current.postWorkRestKind === "side_switch")
      ? (next?.video_url ?? null)
      : (current?.video_url ?? null);
  const firstStep = playbackSteps[0] ?? null;

  useEffect(() => {
    // Hide tips when moving between steps
    setShowTips(false);
  }, [currentIndex]);

  useEffect(() => {
    if (workoutStarted) return;
    setVideoReady(false);
    if (!firstStep?.video_url?.trim()) {
      setVideoReady(true);
    }
  }, [workoutStarted, firstStep?.id, firstStep?.video_url]);

  // Clamp resume index once the resolved playlist length is known.
  useEffect(() => {
    if (!shouldResume || resumeAppliedRef.current || len === 0) return;
    resumeAppliedRef.current = true;
    const clamped = Math.min(Math.max(0, Math.floor(resumeStepIndex ?? 0)), len - 1);
    setCurrentIndex(clamped);
    setWorkoutStarted(true);
    setAwaitingTimedStart(true);
    setStartLogged(true);
    setIsRunning(false);
    setSecondsLeft(null);
    setPhase("work");
    const step = playbackSteps[clamped];
    if (step) {
      setCurrentSet(isBilateralPlaybackStep(step) ? step.playbackSet : 1);
    }
    lastSavedStepRef.current = clamped;
  }, [shouldResume, resumeStepIndex, len, playbackSteps]);

  const persistResumeStep = useCallback(
    (stepIndex: number) => {
      if (workoutFinished) return;
      const index = Math.max(0, Math.floor(stepIndex));
      if (lastSavedStepRef.current === index) return;
      lastSavedStepRef.current = index;
      void logProgramSessionProgress({
        programId,
        sessionId,
        stepIndex: index,
      });
    },
    [programId, sessionId, workoutFinished]
  );

  useEffect(() => {
    if (!workoutStarted || workoutFinished) return;
    persistResumeStep(currentIndex);
  }, [workoutStarted, workoutFinished, currentIndex, persistResumeStep]);

  useEffect(() => {
    if (!workoutStarted || workoutFinished) return;
    const flush = () => persistResumeStep(currentIndex);
    const onVis = () => {
      if (document.visibilityState === "hidden") flush();
    };
    window.addEventListener("pagehide", flush);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.removeEventListener("pagehide", flush);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [workoutStarted, workoutFinished, currentIndex, persistResumeStep]);

  useProgramWorkoutMusic(songUrl, {
    enabled: workoutStarted && Boolean(songUrl?.trim()) && !inPrep && !inTimedPreview,
    muted: musicMuted,
    isRestPhase: inRest,
    isRunning,
  });

  useEffect(() => {
    if (!workoutFinished || completionLogged) return;
    setCompletionLogged(true);
    void logProgramSessionComplete({
      programId,
      programSlug,
      sessionId,
      programFormat,
    });
  }, [workoutFinished, completionLogged, programId, programSlug, sessionId, programFormat]);

  useEffect(() => {
    setVideoReady(false);
    const fallback = window.setTimeout(() => setVideoReady(true), 4000);
    return () => window.clearTimeout(fallback);
  }, [currentIndex, workoutStarted, inExerciseRest]);

  const beginWorkForCurrent = useCallback(
    (index: number) => {
      const ex = playbackSteps[index]!;
      setAwaitingTimedStart(false);
      setCurrentSet(isBilateralPlaybackStep(ex) ? ex.playbackSet : 1);
      setPhase("work");
      if (exerciseUsesTimedPlayback(ex)) {
        playExerciseStartBeeps();
        setSecondsLeft(workDurationSeconds(ex));
        setIsRunning(true);
      } else {
        setSecondsLeft(null);
        setIsRunning(true);
      }
    },
    [playbackSteps]
  );

  const persistLoadForExercise = useCallback(
    (ex: ProgramExerciseItem | WorkoutPlaybackStep | null | undefined) => {
      if (!ex?.usesExternalLoad || !ex.exerciseId) return;
      const draft = loadDraftsRef.current[ex.exerciseId];
      if (!draft) return;
      const weightValue = Number.parseFloat(draft.value.replace(",", "."));
      if (!Number.isFinite(weightValue) || weightValue <= 0) return;

      const prev = savedLoadsRef.current[ex.exerciseId];
      if (prev && prev.weightValue === weightValue && prev.weightUnit === draft.unit) {
        return;
      }
      savedLoadsRef.current[ex.exerciseId] = { weightValue, weightUnit: draft.unit };

      void saveExerciseLoad({
        exerciseId: ex.exerciseId,
        programId,
        sessionId,
        programExerciseId: ex.id,
        weightValue,
        weightUnit: draft.unit,
      });
    },
    [programId, sessionId]
  );

  const advanceExercise = useCallback(() => {
    persistLoadForExercise(playbackSteps[currentIndex] ?? null);
    if (len === 0) return;
    if (currentIndex >= len - 1) {
      setAwaitingTimedStart(false);
      setWorkoutFinished(true);
      setIsRunning(false);
      setSecondsLeft(null);
      return;
    }
    const nextIndex = currentIndex + 1;
    setCurrentIndex(nextIndex);
    beginWorkForCurrent(nextIndex);
  }, [len, currentIndex, beginWorkForCurrent, playbackSteps, persistLoadForExercise]);

  const persistCurrentLoad = useCallback(() => {
    persistLoadForExercise(current);
  }, [current, persistLoadForExercise]);

  /** Sets×reps → timed: land on a preview with Start now (do not auto-start the timer). */
  const advanceFromSetsReps = useCallback(() => {
    persistLoadForExercise(playbackSteps[currentIndex] ?? null);
    if (len === 0) return;
    if (currentIndex >= len - 1) {
      setAwaitingTimedStart(false);
      setWorkoutFinished(true);
      setIsRunning(false);
      setSecondsLeft(null);
      return;
    }
    const nextIndex = currentIndex + 1;
    const nextEx = playbackSteps[nextIndex]!;
    setCurrentIndex(nextIndex);
    if (exerciseUsesTimedPlayback(nextEx)) {
      setAwaitingTimedStart(true);
      setCurrentSet(isBilateralPlaybackStep(nextEx) ? nextEx.playbackSet : 1);
      setPhase("work");
      setSecondsLeft(null);
      setIsRunning(false);
      return;
    }
    beginWorkForCurrent(nextIndex);
  }, [len, currentIndex, playbackSteps, beginWorkForCurrent, persistLoadForExercise]);

  const finishWorkPhase = useCallback(() => {
    if (!current) return;
    if (isBilateralPlaybackStep(current)) {
      if (current.postWorkRestSeconds > 0) {
        const kind = current.postWorkRestKind;
        setPhase(kind === "between_exercises" ? "rest" : "setRest");
        setSecondsLeft(current.postWorkRestSeconds);
        return;
      }
      advanceExercise();
      return;
    }
    if (hasTimedSets(current) && currentSet < setsCount(current)) {
      const between = hasRestBetweenSets(current) ? restBetweenSetsSeconds(current) : 0;
      if (between > 0) {
        setPhase("setRest");
        setSecondsLeft(between);
        return;
      }
      setCurrentSet((s) => s + 1);
      playExerciseStartBeeps();
      setSecondsLeft(workDurationSeconds(current));
      return;
    }
    const rest = restDurationSeconds(current);
    if (rest > 0 && !isLast) {
      setPhase("rest");
      setSecondsLeft(rest);
      return;
    }
    advanceExercise();
  }, [current, currentSet, isLast, advanceExercise]);

  useEffect(() => {
    if (prepCountdown === null || prepCountdown <= 0) return;
    const t = window.setTimeout(() => setPrepCountdown((c) => (c == null ? c : c - 1)), 1000);
    return () => window.clearTimeout(t);
  }, [prepCountdown]);

  useEffect(() => {
    if (prepCountdown !== 0) return;
    setPrepCountdown(null);
    setIsRunning(true);
    beginWorkForCurrent(0);
  }, [prepCountdown, beginWorkForCurrent]);

  useEffect(() => {
    if (phase === "setRest" || phase === "rest") {
      restCuePlayedRef.current = false;
    }
    if (phase === "work") {
      workCuePlayedRef.current = false;
    }
  }, [phase, currentIndex, currentSet]);

  useEffect(() => {
    if (!workoutStarted || prepCountdown !== 3 || prepCuePlayedRef.current) return;
    prepCuePlayedRef.current = true;
    playRestEndingCue();
  }, [workoutStarted, prepCountdown]);

  useEffect(() => {
    if (!workoutStarted || !currentIsTimed || inPrep || inTimedPreview || !isRunning) return;
    if (phase !== "work" || !current) return;
    if (secondsLeft !== 3 || workCuePlayedRef.current) return;
    if (!workPeriodFollowedByRest(current, currentSet, isLast)) return;
    workCuePlayedRef.current = true;
    playWorkEndingCue();
  }, [
    workoutStarted,
    currentIsTimed,
    inPrep,
    inTimedPreview,
    isRunning,
    phase,
    secondsLeft,
    current,
    currentSet,
    isLast,
  ]);

  useEffect(() => {
    if (!workoutStarted || !currentIsTimed || inPrep || inTimedPreview || !isRunning) return;
    if (phase !== "setRest" && phase !== "rest") return;
    if (secondsLeft !== 3 || restCuePlayedRef.current) return;
    restCuePlayedRef.current = true;
    playRestEndingCue();
  }, [workoutStarted, currentIsTimed, inPrep, inTimedPreview, isRunning, phase, secondsLeft]);

  useEffect(() => {
    if (!workoutStarted || !currentIsTimed || inPrep || inTimedPreview) return;
    if (secondsLeft !== 0) return;

    if (phase === "work") {
      playExerciseEndBeeps();
      finishWorkPhase();
      return;
    }

    if (phase === "setRest") {
      if (current && isBilateralPlaybackStep(current)) {
        advanceExercise();
        return;
      }
      playExerciseStartBeeps();
      setCurrentSet((s) => s + 1);
      setPhase("work");
      if (current) setSecondsLeft(workDurationSeconds(current));
      return;
    }

    if (phase === "rest") {
      advanceExercise();
    }
  }, [
    workoutStarted,
    currentIsTimed,
    inPrep,
    inTimedPreview,
    secondsLeft,
    phase,
    current,
    finishWorkPhase,
    advanceExercise,
  ]);

  useEffect(() => {
    if (
      !workoutStarted ||
      !currentIsTimed ||
      inPrep ||
      inTimedPreview ||
      !isRunning ||
      secondsLeft === null
    )
      return;
    if (secondsLeft <= 0) return;
    const t = window.setTimeout(() => setSecondsLeft((s) => (s == null ? s : s - 1)), 1000);
    return () => window.clearTimeout(t);
  }, [workoutStarted, currentIsTimed, inPrep, inTimedPreview, isRunning, secondsLeft]);

  function exerciseMeta(ex: ProgramExerciseItem | WorkoutPlaybackStep): string {
    // Bilateral playback steps already have per-side durationSeconds — never use the
    // overview "total · /side" formatter (that would halve again, e.g. 15 → 7).
    const perSide = formatExpandedBothSidesWorkLabel(ex);
    if (perSide) return perSide;
    return formatExerciseMeta(ex);
  }

  function startWorkout() {
    if (len === 0) return;
    prepareWorkoutAudio();
    prepCuePlayedRef.current = false;
    restCuePlayedRef.current = false;
    workCuePlayedRef.current = false;
    setAwaitingTimedStart(false);
    setResumeEntry(false);
    setWorkoutStarted(true);
    setPhase("work");
    setPrepCountdown(FIRST_EXERCISE_PREP_SECONDS);
    setSecondsLeft(null);
    setIsRunning(false);
    persistResumeStep(0);
    if (!startLogged) {
      setStartLogged(true);
      void logProgramSessionStart({ programId, programSlug, sessionId });
    }
  }

  function startTimedFromPreview() {
    if (!current || !awaitingTimedStart) return;
    prepareWorkoutAudio();
    setResumeEntry(false);
    beginWorkForCurrent(currentIndex);
  }

  function goPrev() {
    if (currentIndex <= 0) return;
    persistCurrentLoad();
    const prev = currentIndex - 1;
    setCurrentIndex(prev);
    beginWorkForCurrent(prev);
  }

  function goNext() {
    if (awaitingTimedStart) {
      startTimedFromPreview();
      return;
    }
    if (!currentIsTimed) {
      advanceFromSetsReps();
      return;
    }
    if (phase === "rest") {
      advanceExercise();
      return;
    }
    if (phase === "setRest") {
      if (current && isBilateralPlaybackStep(current)) {
        advanceExercise();
        return;
      }
      playExerciseStartBeeps();
      setCurrentSet((s) => s + 1);
      setPhase("work");
      if (current) setSecondsLeft(workDurationSeconds(current));
      return;
    }
    finishWorkPhase();
  }

  const displayExercise =
    inExerciseRest && next
      ? next
      : inSetRest && next && current && isBilateralPlaybackStep(current)
        ? next
        : current;
  const displayNote = displayExercise?.note?.trim() || null;
  const sideSwitchRest =
    inSetRest &&
    current != null &&
    isBilateralPlaybackStep(current) &&
    current.postWorkRestKind === "side_switch";
  const bilateralRoundRest =
    inSetRest &&
    current != null &&
    isBilateralPlaybackStep(current) &&
    current.postWorkRestKind === "between_sets";

  if (len === 0) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-zinc-950 px-6 text-center text-white">
        <p className="text-lg font-medium">No exercises in this program</p>
        <Link href={detailHref} className="mt-6 text-sm text-[#ccff00] underline">
          Back to program
        </Link>
      </div>
    );
  }

  return (
    <div className="relative flex h-dvh max-h-dvh flex-col overflow-hidden bg-zinc-950 text-white">
      <header className="absolute inset-x-0 top-0 z-30 flex items-center justify-between px-4 py-3 h-16">
        <div className="flex-none w-12">
          <BackButton
            fallbackHref={detailHref}
            ariaLabel="Go back"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-md"
          >
            <ArrowLeft className="h-5 w-5" />
          </BackButton>
        </div>
        
        {workoutStarted && showProgressDots && (
          <div className="flex-1 flex flex-col justify-center px-4 max-w-sm">
            {showPhaseBanner && current && (
              <p className="text-[10px] font-bold tracking-widest text-white/80 uppercase text-center mb-1.5 drop-shadow-md">
                {SESSION_PHASE_LABELS[current.sessionPhase]}
              </p>
            )}
            <div className="flex w-full gap-1 drop-shadow-md">
              {playbackSteps.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 flex-1 rounded-full ${i <= currentIndex ? "bg-[#ccff00]" : "bg-white/40"}`}
                />
              ))}
            </div>
          </div>
        )}
        
        <div className="flex-none w-12 flex justify-end">
          {workoutStarted && (displayNote || current?.rpe?.trim()) ? (
            <button
              type="button"
              onClick={() => setShowTips((prev) => !prev)}
              className={`flex h-10 w-10 items-center justify-center rounded-full backdrop-blur-md transition-colors ${showTips ? "bg-[#ccff00] text-black" : "bg-black/40 text-white"}`}
              aria-label="Exercise info"
            >
              <Info className="h-5 w-5" />
            </button>
          ) : workoutStarted && songUrl?.trim() ? (
            <button
              type="button"
              onClick={() => setMusicMuted((m) => !m)}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-black/40 backdrop-blur-md text-white"
              aria-label={musicMuted ? "Unmute music" : "Mute music"}
            >
              {musicMuted ? <VolumeX className="h-5 w-5" /> : <Music2 className="h-5 w-5" />}
            </button>
          ) : (
            <div className="w-10" />
          )}
        </div>
      </header>

      {!workoutStarted ? (
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
            {firstStep && (
              <div className="relative z-20 mx-auto mt-16 max-w-3xl px-4 text-center">
                <p className="text-xs font-bold tracking-wider text-white/60 uppercase">
                  {SESSION_PHASE_LABELS[firstStep.sessionPhase]}
                </p>
              </div>
            )}
            <ExerciseVideoFrame className="relative z-10 max-h-[42dvh] aspect-auto! h-[min(100vw,42dvh)] sm:h-auto sm:max-h-none sm:aspect-square!">
              <WorkoutVideo
                url={firstStep?.video_url ?? null}
                playing={false}
                onReady={() => setVideoReady(true)}
              />
              <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-black/30" />
            </ExerciseVideoFrame>

            <div className="relative z-20 mx-auto max-w-lg px-6 py-4 md:py-5">
              <p className="text-xs font-bold tracking-wider text-white/50 uppercase">
                Exercise 1 of {len}
              </p>
              <h2 className="mt-1 text-2xl font-semibold">{firstStep?.title ?? sessionName}</h2>
              {firstStep?.workoutSide ? (
                <div className="mt-3">
                  <WorkoutSideBadge side={firstStep.workoutSide} />
                </div>
              ) : firstStep?.bothSides ? (
                <div className="mt-3">
                  <BothSidesChip variant="dark" />
                </div>
              ) : null}
              {firstStep && (
                <p className="mt-3 text-lg font-medium text-[#ccff00]">{exerciseMeta(firstStep)}</p>
              )}
              {firstStep && (firstStep.note?.trim() || firstStep.rpe?.trim()) && (
                <ExerciseCoachGuidance
                  note={firstStep.note}
                  rpe={firstStep.rpe}
                  className="mt-3"
                  noteClassName="rounded-xl border border-[#ccff00]/25 bg-[#ccff00]/10 px-4 py-3 text-white/90"
                />
              )}
              <p className="mt-3 text-sm text-white/60">
                Watch the demo, then tap Start workout when you are ready.
              </p>

              {choiceGroups.length > 0 && (
                <div className="mt-6 space-y-4">
                  {choiceGroups.map((group) => (
                    <div
                      key={group.id}
                      className="rounded-2xl border border-white/15 bg-white/5 p-4"
                    >
                      <p className="text-xs font-bold tracking-wider text-[#ccff00] uppercase">
                        {SESSION_PHASE_LABELS[group.phase]} · pick one
                      </p>
                      <div className="mt-3 flex flex-col gap-2">
                        {group.options.map((opt) => {
                          const selected = choiceSelections[group.id] === opt.id;
                          return (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() =>
                                setChoiceSelections((prev) => ({ ...prev, [group.id]: opt.id }))
                              }
                              className={`rounded-xl border px-3 py-2.5 text-left text-sm transition ${
                                selected
                                  ? "border-[#ccff00] bg-[#ccff00]/10 text-white"
                                  : "border-white/15 bg-white/5 text-white/80 hover:border-white/30"
                              }`}
                            >
                              <span className="font-medium">{opt.title}</span>
                              <span className="mt-0.5 block text-xs text-white/60">
                                {exerciseMeta(opt)}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <nav
            className="relative z-30 shrink-0 border-t border-white/10 bg-black/80 px-4 py-3 backdrop-blur-md"
            style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}
          >
            <div className="mx-auto max-w-lg">
              <button
                type="button"
                disabled={!videoReady && Boolean(firstStep?.video_url)}
                onClick={startWorkout}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#ccff00] py-3.5 text-sm font-semibold text-black transition hover:bg-[#b3e600] disabled:opacity-50"
              >
                <Play className="h-4 w-4 fill-current" />
                {!firstStep?.video_url || videoReady ? "Start workout" : "Loading video…"}
              </button>
            </div>
          </nav>
        </div>
      ) : (
        <div className="relative flex min-h-0 flex-1 flex-col bg-black">
          <div className="absolute inset-0 z-0 bg-zinc-900">
            <ExerciseVideoFrame className="w-full h-full object-cover [&>video]:object-cover!">
              <WorkoutVideo
                url={displayVideoUrl}
                playing={!workoutFinished && (inPrep || inTimedPreview || isRunning)}
                onReady={() => setVideoReady(true)}
              />
              <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-black/30" />
              
              <div className="absolute inset-x-0 top-16 z-20 px-6 flex flex-col items-center">
                {showProgressDots && !inRest && (
                  <div className="w-full flex flex-col items-center">
                    {current && (
                      <div className="mt-2 flex flex-col items-center drop-shadow-lg w-full">
                        <h2 className="flex items-center justify-center gap-2 text-xl font-bold">
                          {current.title}
                        </h2>
                        {current.workoutSide ? (
                          <div className="mt-2">
                            <WorkoutSideBadge side={current.workoutSide} size="sm" />
                          </div>
                        ) : displayExercise?.bothSides && !displayExercise.workoutSide ? (
                          <div className="mt-2">
                            <BothSidesChip variant="dark" />
                          </div>
                        ) : null}
                        
                        {!inRest && showTips && (displayNote || displayExercise?.rpe?.trim()) && (
                          <div className="mt-4 w-full max-w-sm text-left rounded-2xl border border-white/15 bg-zinc-900/90 p-4 text-white/90 backdrop-blur-md">
                            <div className="flex items-center justify-between mb-2 text-[#ccff00]">
                              <div className="flex items-center gap-1.5">
                                <Info className="h-4 w-4" />
                                <span className="text-[10px] font-bold tracking-wider uppercase">Execution Tips</span>
                              </div>
                              <button onClick={() => setShowTips(false)} className="p-1 -mr-1 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition">
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                            <ExerciseCoachGuidance
                              note={displayNote}
                              rpe={displayExercise?.rpe}
                              noteClassName=""
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {inPrep && current && (
                  <div className="w-full text-center mt-2">
                    <p className="text-sm font-bold tracking-wider text-white/60 uppercase">Get ready</p>
                    <p className="mt-1 text-xl font-bold text-white">{current.title}</p>
                  </div>
                )}

                {inExerciseRest && next && secondsLeft != null && (
                  <div className="w-full text-center mt-2">
                    <p className="text-sm font-bold tracking-wider text-white/60 uppercase">Next</p>
                    <p className="mt-1 text-xl font-bold text-white tracking-wide">{next.title}</p>
                    {(next.note?.trim() || next.rpe?.trim()) && (
                      <div className="mx-auto mt-4 max-w-sm text-left rounded-2xl border border-white/15 bg-zinc-900/90 p-4 text-white/90 backdrop-blur-md">
                        <div className="flex items-center gap-1.5 mb-2 text-[#ccff00]">
                          <Info className="h-4 w-4" />
                          <span className="text-[10px] font-bold tracking-wider uppercase">Execution Tips</span>
                        </div>
                        <ExerciseCoachGuidance
                          note={next.note}
                          rpe={next.rpe}
                          noteClassName=""
                        />
                      </div>
                    )}
                  </div>
                )}

                {inSetRest && current && secondsLeft != null && sideSwitchRest && next && (
                  <div className="w-full text-center mt-2">
                    <p className="text-sm font-bold tracking-wider text-[#ccff00] uppercase">Switch sides</p>
                    <p className="mt-1 text-xl font-bold text-white">{next.title}</p>
                  </div>
                )}

                {inSetRest && current && secondsLeft != null && bilateralRoundRest && (
                  <div className="w-full text-center mt-2">
                    <p className="text-sm font-bold tracking-wider text-white/60 uppercase">Rest between rounds</p>
                    <p className="mt-1 text-xl font-bold text-white">{current.title}</p>
                  </div>
                )}

                {inSetRest && current && secondsLeft != null && !sideSwitchRest && !bilateralRoundRest && (
                  <div className="w-full text-center mt-2">
                    <p className="text-sm font-bold tracking-wider text-white/60 uppercase">Rest between sets</p>
                    <p className="mt-1 text-xl font-bold text-white">{current.title}</p>
                  </div>
                )}
              </div>

              {inRest && (
                <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center pointer-events-none">
                  <p className="text-5xl font-black tracking-widest text-[#ccff00] drop-shadow-2xl">REST</p>
                </div>
              )}
            </ExerciseVideoFrame>
          </div>
          
          <div className="relative z-10 flex flex-col flex-1 h-full pt-4 pb-48 overflow-y-auto pointer-events-none justify-end">
            {/* We keep this scrolling container for any notes or inputs that need interaction */}
            <div className="pointer-events-auto flex flex-col justify-end min-h-full pb-8">
            {inTimedPreview && current && (
              <div className="relative z-20 mx-auto mb-4 flex w-full max-w-lg flex-col items-center rounded-3xl border border-white/15 bg-black/80 px-6 py-6 text-center shadow-2xl backdrop-blur-xl md:py-8">
              <p className="text-sm font-bold tracking-widest text-[#ccff00] uppercase mb-1">
                {resumeEntry ? "Continue workout" : "Up next"}
              </p>
              <p className="text-xs font-bold tracking-wider text-white/50 uppercase mb-4">
                {currentIsTimed ? "Timed exercise · " : ""}
                step {currentIndex + 1} of {len}
              </p>
              <h2 className="text-3xl font-bold text-white tracking-tight">{current.title}</h2>
              {current.workoutSide && (
                <div className="mt-4">
                  <WorkoutSideBadge side={current.workoutSide} />
                </div>
              )}
              <p className="mt-4 text-xl font-semibold text-[#ccff00]">{exerciseMeta(current)}</p>
              {(displayNote || displayExercise?.rpe?.trim()) && (
                <ExerciseCoachGuidance
                  note={displayNote}
                  rpe={displayExercise?.rpe}
                  className="mt-6 w-full text-left"
                  noteClassName="rounded-2xl border border-white/15 bg-white/5 px-5 py-4 text-white/90 w-full"
                />
              )}
              <p className="mt-6 text-sm text-white/50 font-medium">
                {resumeEntry
                  ? "Pick up where you left off — tap Continue when you are ready."
                  : "Watch the demo, then tap Start now when you are ready."}
              </p>
            </div>
          )}

            {!inPrep && !inTimedPreview && (
              <div className="relative z-20 mx-auto max-w-lg px-6 py-4 md:py-5 flex flex-col items-center mt-auto">
                {!inRest && current?.usesExternalLoad && (
                  <div className="mt-3 space-y-2">
                    <p className="text-sm text-white/55">{CHOOSE_WEIGHT_HINT}</p>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        inputMode="decimal"
                        min={0}
                        step="any"
                        placeholder="Weight"
                        value={loadDrafts[current.exerciseId]?.value ?? ""}
                        onChange={(e) => {
                          const value = e.target.value;
                          setLoadDrafts((prev) => ({
                            ...prev,
                            [current.exerciseId]: {
                              value,
                              unit: prev[current.exerciseId]?.unit ?? "kg",
                            },
                          }));
                        }}
                        onBlur={() => persistCurrentLoad()}
                        className="w-28 rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-base text-white placeholder:text-white/35 outline-none focus:border-[#ccff00]/60"
                        aria-label="Weight used"
                      />
                      <div className="flex overflow-hidden rounded-xl border border-white/20">
                        {(["kg", "lb"] as const).map((unit) => {
                          const active =
                            (loadDrafts[current.exerciseId]?.unit ?? "kg") === unit;
                          return (
                            <button
                              key={unit}
                              type="button"
                              onClick={() => {
                                const value = loadDrafts[current.exerciseId]?.value ?? "";
                                setLoadDrafts((prev) => ({
                                  ...prev,
                                  [current.exerciseId]: { value, unit },
                                }));
                                const weightValue = Number.parseFloat(value.replace(",", "."));
                                if (!Number.isFinite(weightValue) || weightValue <= 0) return;
                                savedLoadsRef.current[current.exerciseId] = {
                                  weightValue,
                                  weightUnit: unit,
                                };
                                void saveExerciseLoad({
                                  exerciseId: current.exerciseId,
                                  programId,
                                  sessionId,
                                  programExerciseId: current.id,
                                  weightValue,
                                  weightUnit: unit,
                                });
                              }}
                              className={`px-3 py-2 text-sm font-semibold ${
                                active
                                  ? "bg-[#ccff00] text-black"
                                  : "bg-white/5 text-white/70"
                              }`}
                            >
                              {unit}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
                {!currentIsTimed && (
                  <div className="mt-8 mb-32 flex justify-center">
                    <button
                      type="button"
                      onClick={goNext}
                      className="rounded-xl bg-[#ccff00] px-8 py-4 text-lg font-bold text-black transition hover:bg-[#b3e600]"
                    >
                      {isLast ? "Finish Workout" : "Next Exercise"}
                    </button>
                  </div>
                )}
              </div>
            )}
            </div>
          </div>

          {!inPrep && (
            <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 pb-12 pt-32 bg-linear-to-t from-black via-black/80 to-transparent flex flex-col items-center">
              {inTimedPreview ? (
                <div className="pointer-events-auto mx-auto mb-8 flex w-full max-w-sm items-center justify-center gap-4 px-6">
                  <button
                    type="button"
                    onClick={goPrev}
                    disabled={currentIndex <= 0}
                    className="flex h-14 w-14 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 disabled:opacity-30"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </button>
                  <button
                    type="button"
                    onClick={startTimedFromPreview}
                    disabled={!videoReady}
                    className="flex h-14 min-w-[168px] items-center justify-center gap-2 rounded-full bg-[#ccff00] px-7 text-base font-bold text-black transition hover:bg-[#b3e600] disabled:opacity-50"
                  >
                    <Play className="h-5 w-5 fill-current" />
                    <span>
                      {videoReady
                        ? resumeEntry
                          ? "Continue"
                          : "Start now"
                        : "Loading…"}
                    </span>
                  </button>
                </div>
              ) : (
                <div className="relative mx-auto flex w-full max-w-sm items-center justify-center mb-6">
                  <div className="pointer-events-auto flex items-center justify-center gap-4">
                    <button
                      type="button"
                      onClick={goPrev}
                      disabled={currentIndex <= 0}
                      className="flex h-14 w-14 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 disabled:opacity-30"
                    >
                      <ChevronLeft className="h-6 w-6" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsRunning((r) => !r)}
                      className="flex h-14 min-w-[120px] items-center justify-center gap-2 rounded-full border border-white/20 bg-black/50 px-6 font-semibold text-white backdrop-blur-md transition hover:bg-black/70"
                      aria-label={isRunning ? "Pause" : "Play"}
                    >
                      {isRunning ? (
                        <>
                          <Pause className="h-5 w-5 fill-current" />
                          <span>Pause</span>
                        </>
                      ) : (
                        <>
                          <Play className="h-5 w-5 fill-current" />
                          <span>Play</span>
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={goNext}
                      className="flex h-14 w-14 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
                    >
                      <ChevronRight className="h-6 w-6" />
                    </button>
                  </div>
                </div>
              )}

              {/* Timer & Meta Text */}
              {phase === "work" && currentIsTimed && secondsLeft != null && (
                <div className="px-6 text-center mt-2">
                  <p className="font-mono text-8xl font-bold tabular-nums tracking-tighter text-white drop-shadow-lg leading-none">{secondsLeft}</p>
                  {current && (
                    <p className="mt-2 text-base font-semibold tracking-wide text-[#ccff00] drop-shadow-md">
                      {exerciseMeta(current)}
                    </p>
                  )}
                </div>
              )}
              {inRest && secondsLeft != null && (
                <div className="px-6 text-center mt-2">
                  <p className="font-mono text-8xl font-bold tabular-nums tracking-tighter text-white drop-shadow-lg leading-none">{secondsLeft}</p>
                  {current && (
                    <p className="mt-2 text-base font-semibold tracking-wide text-[#ccff00] drop-shadow-md">
                      {exerciseMeta(current)}
                    </p>
                  )}
                </div>
              )}
              {!currentIsTimed && phase === "work" && current && !inTimedPreview && (
                <div className="px-6 text-center mt-4">
                  <p className="text-lg font-semibold tracking-wide text-[#ccff00] drop-shadow-md">
                    {formatSetsRepsLabel(current) ?? "Go at your pace"}
                  </p>
                </div>
              )}
            </div>
          )}

          {inPrep && (
            <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 pb-12 pt-32 bg-linear-to-t from-black via-black/80 to-transparent flex flex-col items-center">
              <div className="px-6 text-center mt-2">
                <p className="font-mono text-8xl font-bold tabular-nums tracking-tighter text-white drop-shadow-lg leading-none">{prepCountdown}</p>
                {current && (
                  <p className="mt-2 text-base font-semibold tracking-wide text-[#ccff00] drop-shadow-md">
                    {currentIsTimed ? exerciseMeta(current) : (formatSetsRepsLabel(current) ?? "Go at your pace")}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {workoutFinished && (
        <WorkoutCompletionOverlay
          programTitle={programTitle}
          sessionName={sessionName}
          detailHref={detailHref}
          nextSessionHref={usesProgramProgress(programFormat) ? nextSessionHref : null}
          nextSessionLabel={nextSessionLabel}
          programComplete={programComplete}
          isSingleWorkout={!usesProgramProgress(programFormat)}
        />
      )}
    </div>
  );
}
