/** Dedicated landing funnel for free court warm-up programs. */

export const COURT_WARMUP_PROGRAM_SLUG = "court-warm-up";

/** Where signed-up users land after creating an account from the warm-up LP. */
export const COURT_WARMUP_DEST_PATH = `/programs/${COURT_WARMUP_PROGRAM_SLUG}`;

/** Marketing landing URL (not the in-app program page). */
export const COURT_WARMUP_LANDING_PATH = "/court-warm-up";

export type FreeWarmupProgramCard = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  coverImageUrl: string | null;
  minutesPerSession: number | null;
};

export function isCourtWarmupFunnelPath(path: string | null | undefined): boolean {
  const trimmed = path?.trim() ?? "";
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) return false;
  return (
    trimmed === COURT_WARMUP_DEST_PATH ||
    trimmed.startsWith(`${COURT_WARMUP_DEST_PATH}/`) ||
    trimmed === COURT_WARMUP_LANDING_PATH
  );
}
