export function TrainingRouteLoading({
  title = "Loading workout",
}: {
  title?: string;
}) {
  return (
    <div className="min-h-dvh bg-zinc-50 font-sans text-zinc-900">
      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
        <div className="flex items-center gap-3">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-800" />
          <p className="text-sm font-semibold text-zinc-800">{title}</p>
        </div>
        <div className="mt-6 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
          <div className="aspect-[21/9] animate-pulse bg-zinc-200" />
          <div className="space-y-3 p-5">
            <div className="h-4 w-2/3 animate-pulse rounded bg-zinc-200" />
            <div className="h-3 w-full animate-pulse rounded bg-zinc-100" />
            <div className="h-3 w-5/6 animate-pulse rounded bg-zinc-100" />
          </div>
        </div>
        <div className="mt-6 space-y-2">
          <div className="h-16 animate-pulse rounded-2xl border border-zinc-200 bg-white" />
          <div className="h-16 animate-pulse rounded-2xl border border-zinc-200 bg-white" />
          <div className="h-16 animate-pulse rounded-2xl border border-zinc-200 bg-white" />
        </div>
      </div>
    </div>
  );
}
