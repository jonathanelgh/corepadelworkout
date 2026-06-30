-- Enforce warm-up / main / cool-down structure in AI generation prompts.

update public.ai_prompts
set body = replace(
  body,
  '- generate_workout: one custom session (one day only).',
  '- generate_workout: one custom session (one day only). MUST include warm-up, main work, and cool-down exercises (phase on each exercise). Prefer mobility/activation for warm-up, stretching/mobility for cool-down. Optional: 1–2 choice_group alternatives in warm-up and/or cool-down (2–3 exercises per group).'
)
where key = 'ai_coach_system'
  and body like '%generate_workout: one custom session%'
  and body not like '%choice_group%';

update public.ai_prompts
set body = replace(
  body,
  '- Sessions should progress logically (warm-up → main work → accessory/mobility where appropriate).',
  '- Sessions should progress logically: warm-up (mobility/activation) → main work → cool-down (stretching/mobility).
- Every exercise must include phase: warmup, main, or cooldown.
- For warm-up and cool-down, you may add choice_group on 2–3 alternative exercises (same choice_group = athlete picks one).'
)
where key = 'ai_program_builder'
  and body like '%warm-up → main work → accessory%';
