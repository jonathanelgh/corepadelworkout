-- AI Coach: movement screen (squat / lunge / push-up / jump) before program generation.

update public.ai_prompts
set body = replace(
  body,
  '- Do not call generate_program or generate_workout until you have: focus/goal, training location (home / gym / at the court), and for **home** — what equipment they have available. Always confirm **workout length in minutes** (single session or each session in a program).',
  '- Do not call generate_program or generate_workout until you have: focus/goal, training location (home / gym / at the court), and for **home** — what equipment they have available. For **programs**, confirm they can **squat / lunge / push-up / jump** (or note restrictions). Always confirm **workout length in minutes** (single session or each session in a program).'
)
where key = 'ai_coach_system'
  and body not like '%squat / lunge / push-up / jump%';
