"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Music2, Pause, Play, SkipForward, VolumeX } from "lucide-react";
import type { ProgramExerciseItem } from "@/lib/programs/program-exercises";
import {
  exerciseUsesTimedPlayback,
  formatExerciseMeta,
  formatSetsRepsLabel,
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
  workoutSideLabel,
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
import { logProgramSessionComplete, logProgramSessionStart } from "@/app/programs/program-progress-actions";
import { usesProgramProgress, type ProgramFormat } from "@/lib/programs/program-format";
import { programTrainingHref } from "@/lib/programs/program-routes";
import { BackButton } from "@/components/navigation/back-button";
import { ExerciseVideoFrame } from "@/components/programs/exercise-video-frame";
import { WorkoutCompletionOverlay } from "@/components/programs/workout-completion-overlay";
import { BothSidesChip } from "@/components/programs/both-sides-chip";

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

const COVER_FALLBACK = "/Padel_coach_standing.webp";

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
  coverImageUrl,
  songUrl,
  exercises,
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
  nextSessionHref?: string | null;
  nextSessionLabel?: string | null;
  programComplete?: boolean;
}) {
  const detailHref = usesProgramProgress(programFormat)
    ? programTrainingHref(programSlug)
    : `/programs/${programSlug}`;

  const [workoutStarted, setWorkoutStarted] = useState(false);
  const [workoutFinished, setWorkoutFinished] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentSet, setCurrentSet] = useState(1);
  const [phase, setPhase] = useState<Phase>("work");
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const [isRunning, setIsRunning] = useState(true);
  const [videoReady, setVideoReady] = useState(false);
  const [musicMuted, setMusicMuted] = useState(false);
  /** Non-null while counting down before the first exercise begins. */
  const [prepCountdown, setPrepCountdown] = useState<number | null>(null);
  const [completionLogged, setCompletionLogged] = useState(false);
  const [startLogged, setStartLogged] = useState(false);

  const restCuePlayedRef = useRef(false);
  const workCuePlayedRef = useRef(false);
  const prepCuePlayedRef = useRef(false);

  const choiceGroups = useMemo(() => listChoiceGroups(exercises), [exercises]);
  const [choiceSelections, setChoiceSelections] = useState<Record<string, string>>(() =>
    defaultChoiceSelections(listChoiceGroups(exercises))
  );

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
  const inSetRest = workoutStarted && !inPrep && currentIsTimed && phase === "setRest";
  const inExerciseRest = workoutStarted && !inPrep && currentIsTimed && phase === "rest";
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

  const displayVideoUrl =
    inExerciseRest ||
    (inSetRest &&
      current != null &&
      isBilateralPlaybackStep(current) &&
      current.postWorkRestKind === "side_switch")
      ? (next?.video_url ?? null)
      : (current?.video_url ?? null);
  const cover = coverImageUrl?.trim() || COVER_FALLBACK;

  useProgramWorkoutMusic(songUrl, {
    enabled: workoutStarted && Boolean(songUrl?.trim()) && !inPrep,
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
      setCurrentSet(isBilateralPlaybackStep(ex) ? ex.playbackSet : 1);
      setPhase("work");
      if (exerciseUsesTimedPlayback(ex)) {
        playExerciseStartBeeps();
        setSecondsLeft(workDurationSeconds(ex));
      } else {
        setSecondsLeft(null);
      }
    },
    [playbackSteps]
  );

  const advanceExercise = useCallback(() => {
    if (len === 0) return;
    if (currentIndex >= len - 1) {
      setWorkoutFinished(true);
      setIsRunning(false);
      setSecondsLeft(null);
      return;
    }
    const nextIndex = currentIndex + 1;
    setCurrentIndex(nextIndex);
    beginWorkForCurrent(nextIndex);
  }, [len, currentIndex, beginWorkForCurrent]);

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
    if (!workoutStarted || !currentIsTimed || inPrep || !isRunning) return;
    if (phase !== "work" || !current) return;
    if (secondsLeft !== 3 || workCuePlayedRef.current) return;
    if (!workPeriodFollowedByRest(current, currentSet, isLast)) return;
    workCuePlayedRef.current = true;
    playWorkEndingCue();
  }, [
    workoutStarted,
    currentIsTimed,
    inPrep,
    isRunning,
    phase,
    secondsLeft,
    current,
    currentSet,
    isLast,
  ]);

  useEffect(() => {
    if (!workoutStarted || !currentIsTimed || inPrep || !isRunning) return;
    if (phase !== "setRest" && phase !== "rest") return;
    if (secondsLeft !== 3 || restCuePlayedRef.current) return;
    restCuePlayedRef.current = true;
    playRestEndingCue();
  }, [workoutStarted, currentIsTimed, inPrep, isRunning, phase, secondsLeft]);

  useEffect(() => {
    if (!workoutStarted || !currentIsTimed || inPrep) return;
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
    secondsLeft,
    phase,
    current,
    finishWorkPhase,
    advanceExercise,
  ]);

  useEffect(() => {
    if (!workoutStarted || !currentIsTimed || inPrep || !isRunning || secondsLeft === null) return;
    if (secondsLeft <= 0) return;
    const t = window.setTimeout(() => setSecondsLeft((s) => (s == null ? s : s - 1)), 1000);
    return () => window.clearTimeout(t);
  }, [workoutStarted, currentIsTimed, inPrep, isRunning, secondsLeft]);

  function exerciseMeta(ex: ProgramExerciseItem): string {
    return formatExerciseMeta(ex);
  }

  function startWorkout() {
    if (len === 0) return;
    prepareWorkoutAudio();
    prepCuePlayedRef.current = false;
    restCuePlayedRef.current = false;
    workCuePlayedRef.current = false;
    setWorkoutStarted(true);
    setPhase("work");
    setPrepCountdown(FIRST_EXERCISE_PREP_SECONDS);
    setSecondsLeft(null);
    setIsRunning(false);
    if (!startLogged) {
      setStartLogged(true);
      void logProgramSessionStart({ programId, programSlug, sessionId });
    }
  }

  function goPrev() {
    if (currentIndex <= 0) return;
    const prev = currentIndex - 1;
    setCurrentIndex(prev);
    beginWorkForCurrent(prev);
  }

  function goNext() {
    if (!currentIsTimed) {
      advanceExercise();
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
    <div className="relative flex min-h-dvh flex-col bg-zinc-950 text-white">
      {!workoutStarted && (
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${cover})` }}
          aria-hidden
        />
      )}
      {!workoutStarted && <div className="absolute inset-0 bg-black/55" aria-hidden />}

      <header className="relative z-30 flex shrink-0 items-center justify-between px-4 py-3">
        <BackButton
          fallbackHref={detailHref}
          ariaLabel="Go back"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-md"
        >
          <ArrowLeft className="h-5 w-5" />
        </BackButton>
        {workoutStarted && songUrl?.trim() && (
          <button
            type="button"
            onClick={() => setMusicMuted((m) => !m)}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-black/40 backdrop-blur-md"
            aria-label={musicMuted ? "Unmute music" : "Mute music"}
          >
            {musicMuted ? <VolumeX className="h-5 w-5" /> : <Music2 className="h-5 w-5" />}
          </button>
        )}
      </header>

      {!workoutStarted ? (
        <div className="relative z-20 mx-auto flex max-w-lg flex-col px-6 pb-32 pt-8">
          <h1 className="text-2xl font-semibold">{sessionName}</h1>
          <p className="mt-1 text-sm text-white/60">{programTitle}</p>
          <p className="mt-2 text-sm text-white/75">
            {len} exercise{len === 1 ? "" : "s"} · follows each exercise prescription
          </p>

          <div className="pointer-events-none absolute -left-[9999px] h-px w-px overflow-hidden opacity-0">
            <WorkoutVideo
              url={resolvedExercises[0]?.video_url ?? null}
              playing={false}
              onReady={() => setVideoReady(true)}
            />
          </div>

          {choiceGroups.length > 0 && (
            <div className="mt-6 space-y-4">
              {choiceGroups.map((group) => (
                <div
                  key={group.id}
                  className="rounded-2xl border border-white/15 bg-black/40 p-4 backdrop-blur-md"
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

          <div className="mt-8 rounded-2xl border border-white/15 bg-black/40 p-5 backdrop-blur-md">
            <p className="text-xs font-bold tracking-wider text-[#ccff00] uppercase">Up first</p>
            <p className="mt-2 text-xl font-semibold">{playbackSteps[0]?.title}</p>
            <p className="mt-1 text-sm text-white/70">
              {playbackSteps[0] ? exerciseMeta(playbackSteps[0]) : ""}
            </p>
            {playbackSteps[0]?.bothSides && (
              <div className="mt-3">
                <BothSidesChip variant="dark" />
              </div>
            )}
          </div>

          <button
            type="button"
            disabled={!videoReady}
            onClick={startWorkout}
            className="mt-8 w-full rounded-xl bg-[#ccff00] py-4 text-base font-semibold text-black transition hover:bg-[#b3e600] disabled:opacity-50"
          >
            {videoReady ? "Start now" : "Loading video…"}
          </button>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-28">
            {showPhaseBanner && current && (
              <div className="relative z-20 mx-auto max-w-3xl px-4 pt-2 text-center">
                <p className="text-xs font-bold tracking-wider text-[#ccff00] uppercase">
                  {SESSION_PHASE_LABELS[current.sessionPhase]}
                </p>
              </div>
            )}
            <ExerciseVideoFrame className="relative z-10">
              <WorkoutVideo
                url={displayVideoUrl}
                playing={!workoutFinished && (inPrep || isRunning)}
                onReady={() => setVideoReady(true)}
              />
              <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-black/30" />
              {inPrep && current && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/45 px-6 text-center backdrop-blur-[2px]">
                  <p className="text-xs font-bold tracking-wider text-[#ccff00] uppercase">Get ready</p>
                  <p className="mt-2 text-2xl font-semibold">{current.title}</p>
                  <p className="mt-2 text-sm text-white/80">
                    {exerciseMeta(current)}
                  </p>
                  {current.bothSides && !current.workoutSide && (
                    <div className="mt-3">
                      <BothSidesChip variant="dark" />
                    </div>
                  )}
                  {current.workoutSide && (
                    <p className="mt-3 text-sm font-semibold text-[#ccff00]">
                      {workoutSideLabel(current.workoutSide)}
                    </p>
                  )}
                  {current.note?.trim() && (
                    <p className="mt-4 max-w-md rounded-xl border border-white/15 bg-black/35 px-4 py-3 text-sm leading-relaxed text-white/90">
                      {current.note.trim()}
                    </p>
                  )}
                  <p className="mt-6 font-mono text-7xl font-bold tabular-nums">{prepCountdown}</p>
                  <p className="mt-2 text-sm text-white/60">Starting in…</p>
                </div>
              )}
              {inExerciseRest && next && secondsLeft != null && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/30 px-6 text-center">
                  <p className="text-xs font-bold tracking-wider text-[#ccff00] uppercase">Get ready for</p>
                  <p className="mt-2 text-2xl font-semibold">{next.title}</p>
                  <p className="mt-2 text-sm text-white/80">{exerciseMeta(next)}</p>
                  {next.workoutSide && (
                    <p className="mt-3 text-sm font-semibold text-[#ccff00]">
                      {workoutSideLabel(next.workoutSide)}
                    </p>
                  )}
                  {next.bothSides && !next.workoutSide && (
                    <div className="mt-3">
                      <BothSidesChip variant="dark" />
                    </div>
                  )}
                  {next.note?.trim() && (
                    <p className="mt-4 max-w-md rounded-xl border border-white/15 bg-black/35 px-4 py-3 text-sm leading-relaxed text-white/90">
                      {next.note.trim()}
                    </p>
                  )}
                  <p className="mt-6 font-mono text-7xl font-bold tabular-nums">{secondsLeft}</p>
                  <p className="mt-2 text-sm text-white/60">Rest</p>
                </div>
              )}
              {inSetRest && current && secondsLeft != null && sideSwitchRest && next && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/30 px-6 text-center">
                  <p className="text-xs font-bold tracking-wider text-[#ccff00] uppercase">Switch sides</p>
                  <p className="mt-2 text-2xl font-semibold">{next.title}</p>
                  <p className="mt-2 text-sm font-semibold text-[#ccff00]">
                    {next.workoutSide ? workoutSideLabel(next.workoutSide) : exerciseMeta(next)}
                  </p>
                  <p className="mt-6 font-mono text-7xl font-bold tabular-nums">{secondsLeft}</p>
                  <p className="mt-2 text-sm text-white/60">Rest</p>
                </div>
              )}
              {inSetRest && current && secondsLeft != null && bilateralRoundRest && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/30 px-6 text-center">
                  <p className="text-xs font-bold tracking-wider text-[#ccff00] uppercase">Rest between rounds</p>
                  <p className="mt-2 text-2xl font-semibold">{current.title}</p>
                  <p className="mt-2 text-sm text-white/80">
                    Round {current.playbackSet} of {current.playbackSetsTotal} complete
                  </p>
                  <p className="mt-6 font-mono text-7xl font-bold tabular-nums">{secondsLeft}</p>
                  <p className="mt-2 text-sm text-white/60">Next round starting soon</p>
                </div>
              )}
              {inSetRest && current && secondsLeft != null && !sideSwitchRest && !bilateralRoundRest && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/30 px-6 text-center">
                  <p className="text-xs font-bold tracking-wider text-[#ccff00] uppercase">Rest between sets</p>
                  <p className="mt-2 text-2xl font-semibold">{current.title}</p>
                  <p className="mt-2 text-sm text-white/80">
                    Set {currentSetNumber} of {totalSets} · {exerciseMeta(current)}
                  </p>
                  <p className="mt-6 font-mono text-7xl font-bold tabular-nums">{secondsLeft}</p>
                  <p className="mt-2 text-sm text-white/60">Next set starting soon</p>
                </div>
              )}
              {phase === "work" && !inPrep && currentIsTimed && secondsLeft != null && (
                <div className="pointer-events-none absolute inset-x-0 bottom-6 z-10 px-6 text-center">
                  <p className="font-mono text-7xl font-bold tabular-nums">{secondsLeft}</p>
                  {current?.workoutSide && (
                    <p className="mt-1 text-sm font-semibold text-[#ccff00]">
                      {workoutSideLabel(current.workoutSide)}
                    </p>
                  )}
                  {showSetProgress && current && (
                    <p className="mt-1 text-sm text-white/70">
                      Round {currentSetNumber} of {totalSets}
                    </p>
                  )}
                </div>
              )}
            </ExerciseVideoFrame>

            {inPrep && (
              <div className="relative z-20 mx-auto max-w-lg px-6 py-6 text-center">
                <p className="text-xs font-bold tracking-wider text-white/50 uppercase">
                  Exercise 1 of {len}
                </p>
                <p className="mt-2 text-sm text-white/60">
                  Watch the demo above — your timer starts when the countdown ends.
                </p>
              </div>
            )}

            {!inPrep && (
              <div className="relative z-20 mx-auto max-w-lg px-6 py-4 md:py-5">
                <div className="mb-4 flex gap-1">
                  {playbackSteps.map((_, i) => (
                    <div
                      key={i}
                      className={`h-1 flex-1 rounded-full ${i <= currentIndex ? "bg-[#ccff00]" : "bg-white/20"}`}
                    />
                  ))}
                </div>

                <p className="text-xs font-bold tracking-wider text-white/50 uppercase">
                  {sideSwitchRest
                    ? "Switch sides"
                    : bilateralRoundRest
                      ? `Rest · round ${currentSetNumber} of ${totalSets}`
                      : inSetRest
                        ? `Rest · set ${currentSetNumber} of ${totalSets}`
                        : inExerciseRest
                          ? "Rest"
                          : showSetProgress
                            ? `Round ${currentSetNumber} of ${totalSets} · step ${currentIndex + 1} of ${len}`
                            : `Step ${currentIndex + 1} of ${len}`}
                </p>
                {!inRest && (
                  <h2 className="mt-1 text-2xl font-semibold">{current?.title}</h2>
                )}
                {!inRest && current?.workoutSide && (
                  <p className="mt-1 text-sm font-semibold text-[#ccff00]">
                    {workoutSideLabel(current.workoutSide)}
                  </p>
                )}
                {!inRest && displayExercise?.bothSides && !displayExercise.workoutSide && (
                  <div className="mt-2">
                    <BothSidesChip variant="dark" />
                  </div>
                )}
                {!inRest && displayNote && (
                  <p className="mt-3 rounded-xl border border-[#ccff00]/25 bg-[#ccff00]/10 px-4 py-3 text-sm leading-relaxed text-white/90">
                    {displayNote}
                  </p>
                )}

                {currentIsTimed && showSetProgress && phase === "work" && current && (
                  <p className="mt-2 text-sm text-white/60">
                    {exerciseMeta(current)}
                  </p>
                )}

                {!currentIsTimed && current && (
                  <p className="mt-3 text-lg font-medium text-[#ccff00]">
                    {formatSetsRepsLabel(current) ?? "Go at your pace"}
                  </p>
                )}
                {!currentIsTimed && (
                  <p className="mt-2 text-sm text-white/60">Tap Next when you finish this exercise.</p>
                )}
              </div>
            )}
          </div>

          {!inPrep && (
            <nav
              className="fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-black/80 px-4 py-4 backdrop-blur-md"
              style={{ paddingBottom: "max(16px, env(safe-area-inset-bottom))" }}
            >
              <div className="mx-auto flex max-w-lg items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={goPrev}
                  disabled={currentIndex <= 0}
                  className="rounded-xl border border-white/20 px-4 py-3 text-sm font-semibold disabled:opacity-30"
                >
                  Prev
                </button>
                <button
                  type="button"
                  onClick={() => setIsRunning((r) => !r)}
                  className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-black"
                  aria-label={isRunning ? "Pause" : "Play"}
                >
                  {isRunning ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                </button>
                <button
                  type="button"
                  onClick={goNext}
                  className="inline-flex items-center gap-1 rounded-xl bg-[#ccff00] px-4 py-3 text-sm font-semibold text-black"
                >
                  {!currentIsTimed && isLast ? "Finish" : "Next"}
                  <SkipForward className="h-4 w-4" />
                </button>
              </div>
            </nav>
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
