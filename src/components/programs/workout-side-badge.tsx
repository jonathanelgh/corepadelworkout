import type { WorkoutSide } from "@/lib/programs/expand-workout-playlist";
import { workoutSideLabel } from "@/lib/programs/expand-workout-playlist";

type WorkoutSideBadgeProps = {
  side: WorkoutSide;
  className?: string;
  /** Smaller badge for dense overlays; default is large/hero for the active work UI. */
  size?: "lg" | "md";
};

/** High-visibility left/right cue for both_sides playback steps. */
export function WorkoutSideBadge({
  side,
  className = "",
  size = "lg",
}: WorkoutSideBadgeProps) {
  const isLeft = side === "left";
  const sizeClass =
    size === "lg"
      ? "px-5 py-2.5 text-xl sm:text-2xl tracking-wide"
      : "px-4 py-2 text-base sm:text-lg tracking-wide";

  return (
    <span
      role="status"
      aria-label={workoutSideLabel(side)}
      className={[
        "inline-flex items-center justify-center rounded-2xl border-2 font-bold uppercase",
        isLeft
          ? "border-[#ccff00] bg-[#ccff00] text-black shadow-[0_0_24px_rgba(204,255,0,0.35)]"
          : "border-white bg-white text-black shadow-[0_0_24px_rgba(255,255,255,0.25)]",
        sizeClass,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {workoutSideLabel(side)}
    </span>
  );
}
