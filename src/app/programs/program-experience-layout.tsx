import { ArrowLeft, Clock, Music, Star, Target, Zap } from "lucide-react";
import Link from "next/link";
import { ProgramHeroPlayer } from "./program-hero-player";

type Props = {
  programTitle: string;
  subtitle: string;
  difficultyLabel: string;
  heroImage: string;
  promoVideoUrl: string | null | undefined;
  /** Optional MP3 or other audio URL for program soundtrack */
  songUrl?: string | null | undefined;
  statWeeks: string;
  statFrequency: string;
  statMinutes: string;
  backHref: string;
  backLabel: string;
  /** Shown under the title on desktop (e.g. “Continue training”) */
  desktopEyebrow?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
};

export function ProgramExperienceLayout({
  programTitle,
  subtitle,
  difficultyLabel,
  heroImage,
  promoVideoUrl,
  songUrl,
  statWeeks,
  statFrequency,
  statMinutes,
  backHref,
  backLabel,
  desktopEyebrow,
  children,
  footer,
}: Props) {
  return (
    <div className="min-h-screen bg-white pb-24 font-sans text-black selection:bg-[#ccff00] selection:text-black md:pb-0">
      <div className="fixed top-0 right-0 left-0 z-50 flex items-center justify-between bg-linear-to-b from-white via-white/80 to-transparent px-4 pt-4 pb-6 md:hidden">
        <Link
          href={backHref}
          className="-ml-2 rounded-full bg-white/50 p-2 text-gray-800 shadow-sm backdrop-blur-md hover:text-black"
        >
          <ArrowLeft className="h-6 w-6" />
        </Link>
        <span className="max-w-[55%] truncate rounded-full bg-white/50 px-4 py-1.5 text-sm font-semibold shadow-sm backdrop-blur-md">
          {programTitle}
        </span>
        <div className="w-10" />
      </div>

      <div className="flex min-h-screen flex-col md:flex-row">
        <div className="relative h-[60vh] w-full md:fixed md:top-0 md:bottom-0 md:left-0 md:h-screen md:w-1/2">
          <ProgramHeroPlayer
            coverImageUrl={heroImage}
            title={programTitle}
            promoVideoUrl={promoVideoUrl}
            className="h-full min-h-[60vh] md:min-h-0"
          />

          <Link
            href={backHref}
            className="absolute top-8 left-8 z-20 hidden items-center gap-2 rounded-full bg-black/20 px-4 py-2 text-sm font-medium text-white/80 backdrop-blur-md transition-colors hover:text-white md:flex"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>{backLabel}</span>
          </Link>

          <div className="absolute right-0 bottom-0 left-0 z-20 p-6 text-white md:hidden">
            <div className="mb-3 flex items-center gap-2">
              <span className="rounded-full bg-[#ccff00] px-3 py-1 text-xs font-bold tracking-wide text-black uppercase">
                {difficultyLabel}
              </span>
              <span className="flex items-center gap-1 rounded-full bg-white/20 px-3 py-1 text-xs font-medium text-white backdrop-blur-md">
                <Star className="h-3 w-3 fill-current" /> 4.9 (128 reviews)
              </span>
            </div>
            <h1 className="mb-2 text-4xl leading-tight font-medium">{programTitle}</h1>
            <p className="line-clamp-3 text-sm text-gray-300">{subtitle}</p>
          </div>
        </div>

        <div className="relative z-10 -mt-6 w-full overflow-hidden rounded-t-3xl bg-white md:mt-0 md:ml-[50%] md:w-1/2 md:rounded-none">
          <div className="mx-auto max-w-2xl p-6 md:p-12 lg:p-16">
            <div className="mb-12 hidden md:block">
              {desktopEyebrow && (
                <p className="mb-2 text-xs font-bold tracking-wider text-gray-400 uppercase">{desktopEyebrow}</p>
              )}
              <div className="mb-6 flex items-center gap-3">
                <span className="rounded-full bg-[#ccff00] px-3 py-1 text-xs font-bold tracking-wide text-black uppercase">
                  {difficultyLabel}
                </span>
                <span className="flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                  <Star className="h-3 w-3 fill-current text-[#ffc107]" /> 4.9 (128 reviews)
                </span>
              </div>
              <h1 className="mb-4 text-5xl leading-tight font-medium tracking-tight lg:text-6xl">{programTitle}</h1>
              <p className="text-lg text-gray-500">{subtitle}</p>
            </div>

            <div className="mb-12 grid grid-cols-3 gap-4 border-y border-gray-100 py-6">
              <div className="flex flex-col items-center text-center">
                <Clock className="mb-2 h-6 w-6 text-gray-400" />
                <span className="text-sm font-semibold tabular-nums">{statWeeks}</span>
                <span className="text-xs text-gray-500">Duration</span>
              </div>
              <div className="flex flex-col items-center border-x border-gray-100 text-center">
                <Target className="mb-2 h-6 w-6 text-gray-400" />
                <span className="text-sm font-semibold tabular-nums">{statFrequency}</span>
                <span className="text-xs text-gray-500">Frequency</span>
              </div>
              <div className="flex flex-col items-center text-center">
                <Zap className="mb-2 h-6 w-6 text-gray-400" />
                <span className="text-sm font-semibold tabular-nums">{statMinutes}</span>
                <span className="text-xs text-gray-500">Per Session</span>
              </div>
            </div>

            {songUrl?.trim() && (
              <div className="mb-10 rounded-2xl border border-gray-100 bg-gray-50/80 p-5">
                <div className="mb-3 flex items-center gap-2 text-sm font-medium text-gray-900">
                  <Music className="h-4 w-4 shrink-0 text-gray-600" aria-hidden />
                  Program music
                </div>
                <audio
                  controls
                  className="h-10 w-full max-w-full"
                  preload="metadata"
                  src={songUrl.trim()}
                >
                  <a href={songUrl.trim()} className="text-sm text-gray-600 underline">
                    Download audio
                  </a>
                </audio>
              </div>
            )}

            {children}

            <div className="h-24 md:h-0" />
          </div>
        </div>
      </div>

      {footer}
    </div>
  );
}
