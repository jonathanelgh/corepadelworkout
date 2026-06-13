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
import { resolveExerciseVideoSource } from "@/lib/programs/exercise-video-url";
import { useProgramWorkoutMusic } from "@/lib/programs/program-workout-music";
import { playDoubleBeep } from "@/lib/programs/workout-beeps";
import { WorkoutCompletionOverlay } from "@/components/programs/workout-completion-overlay";

type Phase = "work" | "setRest" | "rest";

/** Seconds to preview the first exercise before the work timer starts. */
const FIRST_EXERCISE_PREP_SECONDS = 5;

const IFRAME_ALLOW =
  "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen";

const COVER_FALLBACK = "/Padel_coach_standing.webp";

function WorkoutVideo({
  url,
  playing,
  onReady,
}: {
  url: string | null;
  playing: boolean;
  onReady?: () => void;
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
      <div className="flex h-full w-full items-center justify-center bg-zinc-900 text-sm text-zinc-400">
        No video
      </div>
    );
  }

  if (player.mode === "iframe") {
    return (
      <iframe
        src={player.src}
        title="Exercise video"
        className="h-full w-full border-0"
        allow={IFRAME_ALLOW}
        allowFullScreen
      />
    );
  }

  return (
    <video
      ref={videoRef}
      src={player.src}
      className="h-full w-full object-cover"
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
  programSlug,
  programTitle,
  coverImageUrl,
  songUrl,
  exercises,
}: {
  programSlug: string;
  programTitle: string;
  coverImageUrl: string | null;
  songUrl: string | null;
  exercises: ProgramExerciseItem[];
}) {
  const detailHref = `/programs/${programSlug}`;

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

  const len = exercises.length;
  const current = len > 0 ? exercises[Math.min(currentIndex, len - 1)] : null;
  const next =
    len > 0 && currentIndex < len - 1 ? exercises[currentIndex + 1] : null;
  const isLast = len > 0 && currentIndex >= len - 1;
  const currentIsTimed = current != null && exerciseUsesTimedPlayback(current);
  const inPrep = workoutStarted && prepCountdown !== null && prepCountdown > 0;
  const inSetRest = workoutStarted && !inPrep && currentIsTimed && phase === "setRest";
  const inExerciseRest = workoutStarted && !inPrep && currentIsTimed && phase === "rest";
  const inRest = inSetRest || inExerciseRest;
  const totalSets = current ? setsCount(current) : 1;
  const showSetProgress = currentIsTimed && current != null && hasTimedSets(current);

  const displayVideoUrl = inExerciseRest ? (next?.video_url ?? null) : (current?.video_url ?? null);
  const cover = coverImageUrl?.trim() || COVER_FALLBACK;

  useProgramWorkoutMusic(songUrl, {
    enabled: workoutStarted && Boolean(songUrl?.trim()) && !inPrep,
    muted: musicMuted,
    isRestPhase: inRest,
    isRunning,
  });

  useEffect(() => {
    setVideoReady(false);
    const fallback = window.setTimeout(() => setVideoReady(true), 4000);
    return () => window.clearTimeout(fallback);
  }, [currentIndex, workoutStarted, inExerciseRest]);

  const beginWorkForCurrent = useCallback(
    (index: number) => {
      const ex = exercises[index]!;
      setCurrentSet(1);
      setPhase("work");
      if (exerciseUsesTimedPlayback(ex)) {
        setSecondsLeft(workDurationSeconds(ex));
      } else {
        setSecondsLeft(null);
      }
    },
    [exercises]
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
    if (hasTimedSets(current) && currentSet < setsCount(current)) {
      const between = hasRestBetweenSets(current) ? restBetweenSetsSeconds(current) : 0;
      if (between > 0) {
        playDoubleBeep();
        setPhase("setRest");
        setSecondsLeft(between);
        return;
      }
      setCurrentSet((s) => s + 1);
      setSecondsLeft(workDurationSeconds(current));
      return;
    }
    const rest = restDurationSeconds(current);
    if (rest > 0 && !isLast) {
      playDoubleBeep();
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
    playDoubleBeep();
    setIsRunning(true);
    beginWorkForCurrent(0);
  }, [prepCountdown, beginWorkForCurrent]);

  useEffect(() => {
    if (!workoutStarted || !currentIsTimed || inPrep) return;
    if (secondsLeft !== 0) return;

    if (phase === "work") {
      finishWorkPhase();
      return;
    }

    if (phase === "setRest") {
      playDoubleBeep();
      setCurrentSet((s) => s + 1);
      setPhase("work");
      if (current) setSecondsLeft(workDurationSeconds(current));
      return;
    }

    if (phase === "rest") {
      playDoubleBeep();
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
    setWorkoutStarted(true);
    setPhase("work");
    setPrepCountdown(FIRST_EXERCISE_PREP_SECONDS);
    setSecondsLeft(null);
    setIsRunning(false);
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
      playDoubleBeep();
      advanceExercise();
      return;
    }
    if (phase === "setRest") {
      playDoubleBeep();
      setCurrentSet((s) => s + 1);
      setPhase("work");
      if (current) setSecondsLeft(workDurationSeconds(current));
      return;
    }
    finishWorkPhase();
  }

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
    <div className="relative min-h-dvh bg-zinc-950 text-white">
      {!workoutStarted && (
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${cover})` }}
          aria-hidden
        />
      )}
      {!workoutStarted && <div className="absolute inset-0 bg-black/55" aria-hidden />}

      <header className="relative z-30 flex items-center justify-between px-4 py-3">
        <Link
          href={detailHref}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-md"
          aria-label="Back"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
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
          <h1 className="text-2xl font-semibold">{programTitle}</h1>
          <p className="mt-2 text-sm text-white/75">
            {len} exercises · follows each exercise prescription
          </p>

          <div className="pointer-events-none absolute -left-[9999px] h-px w-px overflow-hidden opacity-0">
            <WorkoutVideo url={exercises[0]?.video_url ?? null} playing={false} onReady={() => setVideoReady(true)} />
          </div>

          <div className="mt-8 rounded-2xl border border-white/15 bg-black/40 p-5 backdrop-blur-md">
            <p className="text-xs font-bold tracking-wider text-[#ccff00] uppercase">Up first</p>
            <p className="mt-2 text-xl font-semibold">{exercises[0]?.title}</p>
            <p className="mt-1 text-sm text-white/70">
              {exerciseMeta(exercises[0]!)}
            </p>
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
        <>
          <div className="relative z-10 mx-auto aspect-video w-full max-w-3xl overflow-hidden bg-black">
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
                <p className="mt-6 font-mono text-7xl font-bold tabular-nums">{prepCountdown}</p>
                <p className="mt-2 text-sm text-white/60">Starting in…</p>
              </div>
            )}
            {inExerciseRest && next && (
              <div className="absolute inset-x-0 bottom-6 px-6 text-center">
                <p className="text-xs font-bold tracking-wider text-white/70 uppercase">Get ready for</p>
                <p className="mt-1 text-lg font-semibold">{next.title}</p>
              </div>
            )}
            {inSetRest && current && (
              <div className="absolute inset-x-0 bottom-6 px-6 text-center">
                <p className="text-xs font-bold tracking-wider text-white/70 uppercase">Rest between sets</p>
                <p className="mt-1 text-lg font-semibold">{current.title}</p>
              </div>
            )}
          </div>

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
            <>
              <div className="relative z-20 mx-auto max-w-lg px-6 py-6">
                <div className="mb-4 flex gap-1">
                  {exercises.map((_, i) => (
                    <div
                      key={i}
                      className={`h-1 flex-1 rounded-full ${i <= currentIndex ? "bg-[#ccff00]" : "bg-white/20"}`}
                    />
                  ))}
                </div>

                <p className="text-xs font-bold tracking-wider text-white/50 uppercase">
                  {inSetRest
                    ? `Rest · set ${currentSet} of ${totalSets}`
                    : inExerciseRest
                      ? "Rest"
                      : showSetProgress
                        ? `Set ${currentSet} of ${totalSets} · exercise ${currentIndex + 1} of ${len}`
                        : `Exercise ${currentIndex + 1} of ${len}`}
                </p>
                <h2 className="mt-1 text-2xl font-semibold">
                  {inExerciseRest && next ? next.title : current?.title}
                </h2>

                {currentIsTimed && secondsLeft != null && (
                  <p className="mt-3 font-mono text-5xl font-semibold tabular-nums">{secondsLeft}</p>
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

              <nav
                className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-black/80 px-4 py-4 backdrop-blur-md"
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
            </>
          )}
        </>
      )}

      {workoutFinished && (
        <WorkoutCompletionOverlay programTitle={programTitle} detailHref={detailHref} />
      )}
    </div>
  );
}
