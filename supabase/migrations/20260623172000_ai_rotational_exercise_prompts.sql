-- Require rotational / anti-rotational exercise in AI-generated workouts.

update public.ai_prompts
set body = replace(
  body,
  '- Do NOT invent exercises, IDs, or names not in the catalog.',
  '- REQUIRED: Every workout/session MUST include at least one rotational or anti-rotational exercise (catalog move: tag contains Rotation, Anti-rotation, or Rotational transfer). Place it in the main block unless it fits warm-up mobility.
- Do NOT invent exercises, IDs, or names not in the catalog.'
)
where key = 'ai_coach_system'
  and body not like '%REQUIRED: Every workout/session MUST include at least one rotational%';

update public.ai_prompts
set body = replace(
  body,
  '- Typical session: 6–12 exercises. Vary movement patterns; include padel-relevant rotation, legs, shoulders, and core.',
  '- REQUIRED: Every session MUST include at least one rotational or anti-rotational exercise (catalog move: Rotation, Anti-rotation, or Rotational transfer). This is non-negotiable for padel trunk control.
- Typical session: 6–12 exercises. Also include legs, shoulders, and core variety.'
)
where key = 'ai_program_builder'
  and body like '%padel-relevant rotation%';
