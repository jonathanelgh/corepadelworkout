import Link from "next/link";
import { ArrowLeft, Clock, Dumbbell, Play } from "lucide-react";
import {
  formatExerciseMeta,
  uniqueEquipmentLabels,
  type ProgramExerciseItem,
} from "@/lib/programs/program-exercises";
import { playHrefForSession } from "@/lib/programs/program-progress";
import { programTrainingHref } from "@/lib/programs/program-routes";
import { groupExercisesByPhase, SESSION_PHASE_LABELS } from "@/lib/programs/session-phase";

const COVER_FALLBACK = "/Padel_coach_standing.webp";

export function ProgramDayOverview({
  programSlug,
  programTitle,
  coverImageUrl,
  sessionId,
  sessionLabel,
  description,
  durationMinutes,
  exercises,
  inProgress,
  completed,
}: {
  programSlug: string;
  programTitle: string;
  coverImageUrl: string | null;
  sessionId: string;
  sessionLabel: string;
  description: string | null;
  durationMinutes: number | null;
  exercises: ProgramExerciseItem[];
  inProgress: boolean;
  completed: boolean;
}) {
  const cover = coverImageUrl?.trim() || COVER_FALLBACK;
  const equipment = uniqueEquipmentLabels(exercises);
  const phases = groupExercisesByPhase(exercises);
  const playHref = playHrefForSession(programSlug, sessionId);
  const trainingHref = programTrainingHref(programSlug);
  const durationLabel =
    durationMinutes != null && durationMinutes > 0 ? `~${durationMinutes} min` : null;
  const ctaLabel = inProgress ? "Continue workout" : completed ? "Train again" : "Start workout";

  return (
    <div className="min-h-dvh bg-zinc-50 pb-28 font-sans text-zinc-900">
      <header className="sticky top-0 z-40 border-b border-zinc-200/80 bg-zinc-50/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-2xl items-center px-4 sm:px-6">
          <Link
            href={trainingHref}
            aria-label="Back to training plan"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-600 transition hover:text-zinc-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
          <div className="relative aspect-[21/9] w-full overflow-hidden bg-zinc-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={cover} alt="" className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-5">
              <p className="text-xs font-semibold tracking-wide text-white/70 uppercase">{programTitle}</p>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                {sessionLabel}
              </h1>
              {inProgress && (
                <p className="mt-1 text-sm font-medium text-[#ccff00]">In progress — pick up where you left off</p>
              )}
              {completed && !inProgress && (
                <p className="mt-1 text-sm font-medium text-emerald-200">Completed — you can train this day again</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 divide-x divide-zinc-100 border-b border-zinc-100">
            <div className="flex items-center gap-2.5 px-4 py-4">
              <Clock className="h-4 w-4 shrink-0 text-zinc-400" />
              <div>
                <p className="text-sm font-semibold tabular-nums text-zinc-900">
                  {durationLabel ?? "—"}
                </p>
                <p className="text-xs text-zinc-500">Duration</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 px-4 py-4">
              <Dumbbell className="h-4 w-4 shrink-0 text-zinc-400" />
              <div>
                <p className="text-sm font-semibold tabular-nums text-zinc-900">{exercises.length}</p>
                <p className="text-xs text-zinc-500">
                  Exercise{exercises.length === 1 ? "" : "s"}
                </p>
              </div>
            </div>
          </div>

          {description?.trim() && (
            <div className="border-b border-zinc-100 px-5 py-4">
              <p className="text-sm leading-relaxed text-zinc-600">{description.trim()}</p>
            </div>
          )}

          <div className="px-5 py-4">
            <p className="text-xs font-semibold tracking-wide text-zinc-500 uppercase">
              Equipment needed
            </p>
            {equipment.length > 0 ? (
              <ul className="mt-3 flex flex-wrap gap-2">
                {equipment.map((item) => (
                  <li
                    key={item}
                    className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-sm text-zinc-800"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-zinc-600">No equipment needed — bodyweight only.</p>
            )}
          </div>
        </div>

        <section className="mt-8">
          <h2 className="mb-4 text-sm font-semibold tracking-wide text-zinc-500 uppercase">
            Exercises
          </h2>
          {exercises.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-zinc-200 bg-white px-5 py-8 text-center text-sm text-zinc-500">
              No exercises in this day yet.
            </p>
          ) : (
            <div className="space-y-6">
              {(() => {
                let n = 0;
                return phases.map(({ phase, items }) => (
                  <div key={phase}>
                    {phases.length > 1 && (
                      <h3 className="mb-2 text-xs font-semibold tracking-wide text-zinc-400 uppercase">
                        {SESSION_PHASE_LABELS[phase]}
                      </h3>
                    )}
                    <ol className="space-y-2">
                      {items.map((ex) => {
                        n += 1;
                        return <ExerciseRow key={ex.id} exercise={ex} index={n} />;
                      })}
                    </ol>
                  </div>
                ));
              })()}
            </div>
          )}
        </section>
      </main>

      <div
        className="fixed inset-x-0 bottom-0 z-50 border-t border-zinc-200/80 bg-white/95 px-4 py-3 backdrop-blur-md"
        style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
      >
        <div className="mx-auto max-w-2xl">
          <Link
            href={playHref}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#ccff00] py-3.5 text-base font-semibold text-black shadow-sm transition hover:bg-[#b3e600]"
          >
            <Play className="h-5 w-5 fill-current" />
            {ctaLabel}
          </Link>
        </div>
      </div>
    </div>
  );
}

function ExerciseRow({ exercise, index }: { exercise: ProgramExerciseItem; index: number }) {
  const meta = formatExerciseMeta(exercise);
  const thumb = exercise.image_url?.trim() || null;
  return (
    <li className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-xs font-semibold tabular-nums text-zinc-600">
        {index}
      </span>
      {thumb ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={thumb}
          alt=""
          className="h-12 w-12 shrink-0 rounded-xl object-cover bg-zinc-100"
        />
      ) : (
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-400">
          <Dumbbell className="h-5 w-5" />
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-zinc-900">{exercise.title}</p>
        <p className="mt-0.5 truncate text-xs text-zinc-500">
          {meta}
          {exercise.choiceGroup ? " · pick one option" : ""}
        </p>
      </div>
    </li>
  );
}
