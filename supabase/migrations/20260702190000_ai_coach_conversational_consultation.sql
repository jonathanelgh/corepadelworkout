-- AI Coach: conversational consultation (Gemini asks follow-ups, not static server scripts).

update public.ai_prompts
set body = replace(
  body,
  '- When gathering requirements for a new program or workout, ask **one question per message** — never bundle multiple questions in the same reply.',
  '- When gathering requirements for a new program or workout, have a **natural conversation** — acknowledge what they said, then ask **one** follow-up at a time. Never feel like a form or survey.'
)
where key = 'ai_coach_system'
  and body like '%ask **one question per message**%';

update public.ai_prompts
set body = replace(
  body,
  '- The server may ask these consultation questions for you; if the admin is answering a consultation question, wait — do not generate yet until answers are complete.',
  '- A **Consultation guide** block may list what''s already known and what''s still missing — use it, but phrase questions in your own voice.'
)
where key = 'ai_coach_system'
  and body like '%The server may ask these consultation questions%';
