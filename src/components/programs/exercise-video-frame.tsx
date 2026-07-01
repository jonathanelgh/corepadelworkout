import type { ReactNode } from "react";

/** 1:1 cropped exercise video — full width on mobile, wider square on desktop. */
export const exerciseVideoFrameClass =
  "relative aspect-square w-full max-w-none overflow-hidden bg-black md:mx-auto md:max-w-xl lg:max-w-2xl";

/** Break out of horizontal page padding so the video is edge-to-edge on small screens. */
export const exerciseVideoBleedClass = "-mx-4 w-[calc(100%+2rem)] sm:mx-0 sm:w-full";

type Props = {
  children: ReactNode;
  className?: string;
  bleed?: boolean;
  rounded?: boolean;
};

export function ExerciseVideoFrame({
  children,
  className = "",
  bleed = false,
  rounded = true,
}: Props) {
  return (
    <div
      className={[
        exerciseVideoFrameClass,
        bleed ? exerciseVideoBleedClass : "",
        rounded ? "rounded-none sm:rounded-2xl" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </div>
  );
}
