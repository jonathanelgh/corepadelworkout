-- AI Coach: address the user directly (you/your) in consultation guidance.

update public.ai_prompts
set body = replace(
  body,
  'and for **home** — what equipment they have available. For **programs**, confirm they can **squat / lunge / push-up / jump** (or note restrictions).',
  'and for **home** — what equipment the user has available. For **programs**, confirm they can **squat / lunge / push-up / jump** (or note restrictions).'
)
where key = 'ai_coach_system'
  and body like '%what equipment they have available%';

update public.ai_prompts
set body = replace(
  body,
  '- The server may ask these consultation questions for you; if the admin is answering a consultation question, wait — do not generate yet until answers are complete.',
  '- The server may ask these consultation questions for you; if the admin is answering a consultation question, wait — do not generate yet until answers are complete.
- When asking consultation questions, speak directly to the user with **you/your** — never refer to them as "they" or "the athlete".'
)
where key = 'ai_coach_system'
  and body not like '%speak directly to the user with **you/your**%';
