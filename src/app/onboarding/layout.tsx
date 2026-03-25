export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-zinc-50 text-zinc-900">
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.8]"
        aria-hidden
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(204, 255, 0, 0.32), transparent), radial-gradient(ellipse 60% 40% at 100% 50%, rgba(16, 185, 129, 0.16), transparent), radial-gradient(ellipse 50% 30% at 0% 80%, rgba(16, 24, 40, 0.08), transparent)",
        }}
      />
      <div className="relative z-10 flex min-h-dvh flex-col">
        <div className="flex flex-1 flex-col px-4 pb-10 pt-6 sm:px-6">{children}</div>
      </div>
    </div>
  );
}
