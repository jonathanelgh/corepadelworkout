/** Canonical warm-up timing for AI-generated sessions. */
export const WARMUP_DURATION_SECONDS = 60;
export const WARMUP_REST_AFTER_SECONDS = 20;
export const MIN_WARMUP_EXERCISES_PER_SESSION = 4;

/** Appended to system prompts when missing — keeps DB-edited prompts aligned with enforcement. */
export const AI_COACH_WARMUP_RULES_BLOCK = `### Warm-up prescription (mandatory — enforced on save)

- **Every session** (each day in generate_program and every generate_workout) MUST open with a **Dynamic Warm-Up** block.
- Include **at least ${MIN_WARMUP_EXERCISES_PER_SESSION} exercises** with \`phase: "warmup"\` before main work.
- **Every warm-up exercise** must use timed work only:
  - \`duration_seconds: ${WARMUP_DURATION_SECONDS}\` (exactly 60 seconds of work)
  - \`rest_after_seconds: ${WARMUP_REST_AFTER_SECONDS}\` before the next exercise (not on the last exercise in the session)
  - Do **not** prescribe sets, reps, or duration_minutes for warm-up exercises.
- Pick mobility, activation, and dynamic prep moves from the catalog (hips, shoulders, ankles, trunk, light footwork).
- Main and cool-down blocks follow after the warm-up; main must still include rotation or anti-rotation.`.trim();
