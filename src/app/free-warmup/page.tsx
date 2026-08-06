import { redirect } from "next/navigation";
import { COURT_WARMUP_LANDING_PATH } from "@/lib/programs/court-warmup-funnel";

/** Legacy free-warmup URL → dedicated court warm-up landing. */
export default function FreeWarmupRedirectPage() {
  redirect(COURT_WARMUP_LANDING_PATH);
}
