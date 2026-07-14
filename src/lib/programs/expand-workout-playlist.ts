import type { ProgramExerciseItem } from "@/lib/programs/program-exercises";
import {
  exerciseUsesTimedPlayback,
  hasRestBetweenSets,
  restBetweenSetsSeconds,
  restBetweenSidesSeconds,
  restDurationSeconds,
  setsCount,
} from "@/lib/programs/program-exercises";

export type WorkoutSide = "left" | "right";

export type PostWorkRestKind = "side_switch" | "between_sets" | "between_exercises";

export type WorkoutPlaybackStep = ProgramExerciseItem & {
  playbackKey: string;
  workoutSide: WorkoutSide | null;
  playbackSet: number;
  playbackSetsTotal: number;
  postWorkRestSeconds: number;
  postWorkRestKind: PostWorkRestKind | null;
};

export function workoutSideLabel(side: WorkoutSide): string {
  return side === "left" ? "Left side" : "Right side";
}

export function isBilateralPlaybackStep(step: WorkoutPlaybackStep): boolean {
  return step.workoutSide != null;
}

export function shouldExpandBothSides(ex: ProgramExerciseItem): boolean {
  return ex.bothSides && exerciseUsesTimedPlayback(ex);
}

/** Split bilateral timed exercises into left/right work steps with rests between. */
export function expandWorkoutPlaybackPlaylist(
  exercises: ProgramExerciseItem[]
): WorkoutPlaybackStep[] {
  const steps: WorkoutPlaybackStep[] = [];

  for (let exIndex = 0; exIndex < exercises.length; exIndex++) {
    const ex = exercises[exIndex]!;
    const isLastExercise = exIndex === exercises.length - 1;

    if (!shouldExpandBothSides(ex)) {
      steps.push({
        ...ex,
        playbackKey: ex.id,
        workoutSide: null,
        playbackSet: 1,
        playbackSetsTotal: setsCount(ex),
        postWorkRestSeconds: 0,
        postWorkRestKind: null,
      });
      continue;
    }

    const rounds = setsCount(ex);
    const sideRest = restBetweenSidesSeconds(ex);
    const roundRest = hasRestBetweenSets(ex) ? restBetweenSetsSeconds(ex) : 0;
    const exerciseRest = !isLastExercise ? restDurationSeconds(ex) : 0;

    for (let round = 1; round <= rounds; round++) {
      const sides: WorkoutSide[] = ["left", "right"];
      for (let sideIndex = 0; sideIndex < sides.length; sideIndex++) {
        const side = sides[sideIndex]!;
        const isLastSide = side === "right";
        const isLastRound = round === rounds;

        let postRest = 0;
        let postKind: PostWorkRestKind | null = null;

        if (!isLastSide) {
          postRest = sideRest;
          postKind = "side_switch";
        } else if (!isLastRound && roundRest > 0) {
          postRest = roundRest;
          postKind = "between_sets";
        } else if (isLastRound && exerciseRest > 0) {
          postRest = exerciseRest;
          postKind = "between_exercises";
        }

        steps.push({
          ...ex,
          playbackKey: `${ex.id}-r${round}-${side}`,
          workoutSide: side,
          playbackSet: round,
          playbackSetsTotal: rounds,
          postWorkRestSeconds: postRest,
          postWorkRestKind: postKind,
        });
      }
    }
  }

  return steps;
}
