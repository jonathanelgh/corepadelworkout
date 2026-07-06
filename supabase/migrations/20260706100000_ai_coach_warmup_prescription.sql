-- Enforce 60s warm-up prescription rules in editable AI prompts.

update public.ai_prompts
set body = replace(
  body,
  E'- generate_workout: one custom session (one day only). MUST include warm-up, main work, and cool-down exercises (phase on each exercise).',
  E'- generate_workout: one custom session (one day only). MUST include warm-up, main work, and cool-down exercises (phase on each exercise). Warm-up: at least 4 exercises, each duration_seconds: 60, rest_after_seconds: 20 — no sets/reps in warm-up.'
)
where key = 'ai_coach_system'
  and body like '%generate_workout: one custom session%'
  and body not like '%duration_seconds: 60%';

update public.ai_prompts
set body = replace(
  body,
  E'- generate_program: multi-session plan — set duration_weeks and sessions_per_week. Return ONLY sessions_per_week session templates in sessions[] (one training week); the app repeats them for the full block. Every session MUST have warm-up, main, and cool-down blocks (phase on each exercise).',
  E'- generate_program: multi-session plan — set duration_weeks and sessions_per_week. Return ONLY sessions_per_week session templates in sessions[] (one training week); the app repeats them for the full block. Every session MUST have warm-up (≥4 exercises at 60s each), main, and cool-down blocks (phase on each exercise).'
)
where key = 'ai_coach_system'
  and body like '%generate_program: multi-session plan%'
  and body not like '%≥4 exercises at 60s%';

update public.ai_prompts
set body = body || E'

### Warm-up prescription (mandatory — enforced on save)

- **Every session** (each day in generate_program and every generate_workout) MUST open with a **Dynamic Warm-Up** block.
- Include **at least 4 exercises** with `phase: "warmup"` before main work.
- **Every warm-up exercise** must use timed work only:
  - `duration_seconds: 60` (exactly 60 seconds of work)
  - `rest_after_seconds: 20` before the next exercise (not on the last exercise in the session)
  - Do **not** prescribe sets, reps, or duration_minutes for warm-up exercises.
- Pick mobility, activation, and dynamic prep moves from the catalog (hips, shoulders, ankles, trunk, light footwork).
- Main and cool-down blocks follow after the warm-up; main must still include rotation or anti-rotation.'
where key in ('ai_coach_system', 'ai_program_builder')
  and body not like '%Warm-up prescription (mandatory%';
