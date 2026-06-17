type BothSidesChipProps = {
  className?: string;
  /** Dark overlay on workout video vs light page backgrounds */
  variant?: "dark" | "light";
};

export function BothSidesChip({ className = "", variant = "light" }: BothSidesChipProps) {
  const styles =
    variant === "dark"
      ? "border-white/25 bg-white/10 text-white/90"
      : "border-amber-200 bg-amber-50 text-amber-900";

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${styles} ${className}`}
    >
      Both sides
    </span>
  );
}
