/** Canonical warm-up and cool-down timing for AI-generated sessions. */
export const WARMUP_DURATION_SECONDS = 60;
export const WARMUP_REST_AFTER_SECONDS = 15;
// MVP philosophy: AI decides warm-up/cool-down structure. We only use these as defaults
// when the model omits timing fields entirely.
export const MIN_WARMUP_EXERCISES_PER_SESSION = 0;

export const COOLDOWN_DURATION_SECONDS = 60;
export const COOLDOWN_REST_AFTER_SECONDS = 15;
export const MIN_COOLDOWN_EXERCISES_PER_SESSION = 0;

export {
  AI_COACH_GOVERNING_RULES_BLOCK,
  AI_COACH_PROGRAM_RULES_BLOCK,
  AI_COACH_WARMUP_RULES_BLOCK,
} from "@/lib/programs/ai-program-rules";
