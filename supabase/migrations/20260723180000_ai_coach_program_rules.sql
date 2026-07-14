-- Align AI coach prompts with enforced program prescription rules (5 warm-ups, 5 cool-downs, tags, rest, strength).

update public.ai_prompts
set body = replace(
  body,
  E'at least 4 exercises',
  E'at least 5 exercises'
)
where key in ('ai_coach_system', 'ai_program_builder', 'ai_member_coach_system')
  and body like '%at least 4 exercises%';

update public.ai_prompts
set body = replace(
  body,
  E'rest_after_seconds: 20',
  E'rest_after_seconds: 15'
)
where key in ('ai_coach_system', 'ai_program_builder', 'ai_member_coach_system')
  and body like '%rest_after_seconds: 20%';

update public.ai_prompts
set body = replace(
  body,
  E'≥4 exercises at 60s',
  E'≥5 exercises at 60s'
)
where key in ('ai_coach_system', 'ai_program_builder')
  and body like '%≥4 exercises at 60s%';

update public.ai_prompts
set body = body || E'

### Program prescription rules (mandatory — enforced on save)

- Warm-up: 5 exercises, 60s work / 15s rest. Cool-down: at least 5 exercises, 60s / 15s, including ≥1 mobility move.
- Main-block rest between strength, agility, and footwork: Beginner 30–45s; Intermediate/Advanced 60–90s.
- Strength exercises: sets and reps only. Weekly progression changes reps OR sets OR load — never all three in one week.
- Every session: ≥1 core, ≥2 footwork, ≥1 mobility in cool-down.
- Rehab/prehab: use kinetic-chain exercise selection (e.g. elbow → wrist, elbow, shoulder, upper back).
- Never start main work with sprint, shuffle, or jump.'
where key in ('ai_coach_system', 'ai_program_builder', 'ai_member_coach_system')
  and body not like '%Program prescription rules (mandatory%';
