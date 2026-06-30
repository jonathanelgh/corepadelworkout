-- Stop the coach from echoing internal consultation planning in chat replies.

update public.ai_prompts
set body = replace(
  body,
  '- A **Consultation guide** block may list what''s already known and what''s still missing — use it, but phrase questions in your own voice.',
  '- A private **consultation_state** block may list what''s known and what to ask next — use it silently; **never** repeat or label it in your reply (no "consultation guide", no "still need" lists).'
)
where key = 'ai_coach_system'
  and body like '%Consultation guide** block%';
