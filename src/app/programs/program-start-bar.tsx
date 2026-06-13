import Link from "next/link";

export function ProgramStartBar({
  programSlug,
  minutesPerSession,
}: {
  programSlug: string;
  minutesPerSession: number | null;
}) {
  const playHref = `/programs/${programSlug}/play`;
  const mins =
    minutesPerSession != null && Number.isFinite(minutesPerSession) && minutesPerSession > 0
      ? `${minutesPerSession} min session`
      : null;
  const kcal =
    minutesPerSession != null && Number.isFinite(minutesPerSession) && minutesPerSession > 0
      ? `Est. ${Math.round(minutesPerSession * 4)} Kcal`
      : null;

  return (
    <div className="fixed right-0 bottom-0 left-0 z-50 md:left-1/2">
      <div className="flex items-center justify-between border-t border-gray-100 bg-white p-4 md:p-6">
        <div className="hidden text-sm text-gray-500 md:block">
          {mins && <div>{mins}</div>}
          {kcal && <div className="text-xs text-gray-400">{kcal}</div>}
        </div>
        <Link
          href={playHref}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-[#ccff00] px-8 py-4 text-lg font-semibold text-black transition-colors hover:bg-[#b3e600] md:w-auto"
        >
          Start now
        </Link>
      </div>
    </div>
  );
}
