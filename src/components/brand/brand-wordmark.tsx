/**
 * The COREPADEL lockup. CORE and PADEL always use the same colors and tracking.
 * On light backgrounds PADEL uses a darker lime so the same mark stays readable.
 */
export function BrandWordmark({
  tone = "onLight",
  className = "",
}: {
  tone?: "onLight" | "onDark";
  className?: string;
}) {
  const core = tone === "onDark" ? "text-white" : "text-zinc-950";
  const padel = tone === "onDark" ? "text-[#ccff00]" : "text-[#6b8f00]";

  return (
    <span
      className={`inline-block whitespace-nowrap text-lg font-bold uppercase leading-none tracking-[0.16em] ${core} ${className}`}
    >
      CORE<span className={padel}>PADEL</span>
    </span>
  );
}
