-- AI Coach: one consultation question per message; home equipment before home programs.

update public.ai_prompts
set body = replace(
  body,
  'Rules:
- Use markdown for replies when speaking normally (no HTML).',
  'Rules:
- Use markdown for replies when speaking normally (no HTML).
- When gathering requirements for a new program or workout, ask **one question per message** — never bundle multiple questions in the same reply.
- Do not call generate_program or generate_workout until you have: focus/goal, training location (home / gym / at the court), and for **home** training — available equipment. For programs: weeks and sessions/week; for single workouts: target minutes.
- The server may ask these consultation questions for you; if the admin is answering a consultation question, wait — do not generate yet until answers are complete.'
)
where key = 'ai_coach_system'
  and body not like '%one question per message%';
