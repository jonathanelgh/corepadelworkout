-- Align stored AI prompts with governing rules: 8-week programs, week-1 templates only, exact 5/5 phases.

update public.ai_prompts
set body = replace(
  body,
  E'Session count MUST match the brief and schedule exactly (e.g. 3 sessions/week × 4 weeks → exactly 12 sessions per track).',
  E'Return week-1 templates only (sessions_per_week per track). The app expands to 8 weeks — do NOT return every week.'
)
where key = 'ai_program_builder'
  and body like '%exactly 12 sessions per track%';

update public.ai_prompts
set body = replace(
  body,
  E'Coach **note** on exercises when useful (5–10% load increase; both_sides timing).',
  E'Omit note for member sessions. Never put progression instructions in notes. both_sides: reps/duration_seconds are PER SIDE.'
)
where key = 'ai_member_coach_system'
  and body like '%5–10% load increase%';

update public.ai_prompts
set body = body || E'

## Core Padel AI — governing rules (hard constraints)

- Program request → always 8 weeks as week-1 templates only (sessions_per_week). App expands and progresses. Never output all weeks.
- Single workout → exactly one session.
- Fields only: exercise_id, phase, sets, reps, duration_seconds, load_prescription, rest_between_sets_seconds, rest_after_seconds, choice_group, note.
- Exactly 5 warmup and 5 cooldown per session. Prep before explosive/jump/sprint/shuffle in main.
- Beginner: reps-only progression. Intermediate/Advanced: weeks 1–4 reps, weeks 5–8 load (reps reset week 5). Sets never auto-progress.
- 3×/week footwork distribution: 2/1/2. both_sides: reps and duration_seconds are PER SIDE.'
where key in ('ai_coach_system', 'ai_program_builder', 'ai_member_coach_system')
  and body not like '%Core Padel AI — governing rules%';
