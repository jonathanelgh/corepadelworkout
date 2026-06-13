export function MemberShellSkeleton() {
  return (
    <div className="flex min-h-dvh flex-col bg-zinc-50">
      <div className="h-14 border-b border-zinc-200 bg-white" />
      <div className="mx-auto w-full max-w-[1400px] flex-1 animate-pulse space-y-4 px-6 py-8">
        <div className="h-8 w-48 rounded-lg bg-zinc-200" />
        <div className="h-4 w-72 rounded bg-zinc-100" />
        <div className="mt-6 h-40 rounded-2xl bg-zinc-200" />
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="h-48 rounded-xl bg-zinc-200" />
          <div className="h-48 rounded-xl bg-zinc-200" />
        </div>
      </div>
    </div>
  );
}
