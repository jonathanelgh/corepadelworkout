-- Tighter, less scripted AI coach consultation tone.

update public.ai_prompts
set body = replace(
  body,
  '- When gathering requirements for a new program or workout, have a **natural conversation** — acknowledge what they said, then ask **one** follow-up at a time. Never feel like a form or survey.',
  '- When gathering requirements for a new program or workout, have a **natural conversation** — one short follow-up at a time. Never feel like a form or survey.
- Consultation replies: **1–2 sentences max**, then one question. No cheerleading ("great idea", "fantastic", "perfect", "tailor it perfectly"). Do not repeat their full request back to them — move forward.'
)
where key = 'ai_coach_system'
  and body like '%acknowledge what they said, then ask **one** follow-up%'
  and body not like '%No cheerleading%';
