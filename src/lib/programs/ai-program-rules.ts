import {
  COOLDOWN_DURATION_SECONDS,
  COOLDOWN_REST_AFTER_SECONDS,
  MIN_COOLDOWN_EXERCISES_PER_SESSION,
  MIN_WARMUP_EXERCISES_PER_SESSION,
  WARMUP_DURATION_SECONDS,
  WARMUP_REST_AFTER_SECONDS,
} from "@/lib/programs/warmup-prescription";

export const AI_COACH_PROGRAM_RULES_BLOCK = `### Program prescription rules (mandatory — enforced on save)

These rules apply to **every** \`generate_workout\` and **every session** in \`generate_program\`. The app auto-corrects gaps; still follow them in your draft.

#### Warm-up
- **${MIN_WARMUP_EXERCISES_PER_SESSION} exercises**, each **${WARMUP_DURATION_SECONDS}s work / ${WARMUP_REST_AFTER_SECONDS}s rest** (\`duration_seconds: ${WARMUP_DURATION_SECONDS}\`, \`rest_after_seconds: ${WARMUP_REST_AFTER_SECONDS}\`). No sets/reps in warm-up.

#### Cool-down
- **At least ${MIN_COOLDOWN_EXERCISES_PER_SESSION} exercises**, each **${COOLDOWN_DURATION_SECONDS}s work / ${COOLDOWN_REST_AFTER_SECONDS}s rest**.
- Include **at least one mobility-tagged** exercise in the cool-down block.

#### Main-block rest (between strength, agility, and footwork exercises)
- **Beginner:** \`rest_after_seconds\` and \`rest_between_sets_seconds\` in the **30–45s** range.
- **Intermediate / Advanced:** **60–90s** for the same exercise types.

#### Strength prescription
- Strength exercises must use **sets and reps** only — never timed-only prescription for strength moves.
- Weekly progression changes **one lever at a time** (reps **or** sets **or** load) — never all three in the same week.

#### Required tags (each session)
- **≥1 core** exercise somewhere in the session.
- **≥2 footwork** exercises in main work.
- **≥1 mobility** exercise in cool-down.

#### Rehab / prehab
- When building injury-focused programs, select exercises along the **kinetic chain** (e.g. elbow rehab → wrist, elbow, shoulder, upper back).

#### Session order
- **Never** start main work with a **sprint**, **shuffle**, or **jump** exercise. Warm up first, then safer prep before high-intensity footwork or plyometrics.`.trim();

/** Warm-up + cool-down timing block (subset of program rules). */
export const AI_COACH_WARMUP_RULES_BLOCK = `### Warm-up prescription (mandatory — enforced on save)

- **Every session** (each day in generate_program and every generate_workout) MUST open with a **Dynamic Warm-Up** block.
- Include **at least ${MIN_WARMUP_EXERCISES_PER_SESSION} exercises** with \`phase: "warmup"\` before main work.
- **Every warm-up exercise** must use timed work only:
  - \`duration_seconds: ${WARMUP_DURATION_SECONDS}\` (exactly 60 seconds of work)
  - \`rest_after_seconds: ${WARMUP_REST_AFTER_SECONDS}\` before the next exercise (not on the last exercise in the session)
  - Do **not** prescribe sets, reps, or duration_minutes for warm-up exercises.
- Pick mobility, activation, and dynamic prep moves from the catalog (hips, shoulders, ankles, trunk, light footwork).
- Main and cool-down blocks follow after the warm-up; main must still include rotation or anti-rotation.

#### Cool-down (same timing standard)
- **At least ${MIN_COOLDOWN_EXERCISES_PER_SESSION} cool-down exercises**, each **${COOLDOWN_DURATION_SECONDS}s work / ${COOLDOWN_REST_AFTER_SECONDS}s rest**.
- Include **≥1 mobility** exercise in cool-down.`.trim();
