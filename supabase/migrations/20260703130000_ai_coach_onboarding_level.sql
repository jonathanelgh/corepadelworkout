-- Distinguish member onboarding level vs admin training level override in AI Coach prompt.

update public.ai_prompts
set body = replace(
  body,
  'When the athlete profile includes **Onboarding level** (beginner | intermediate | advanced from onboarding), that value determines which mandatory workout structure and level engine to apply below. Do not override it unless the admin explicitly requests a different difficulty. If no onboarding level is set, infer conservatively from consultation; when unsure, default to Beginner.',
  E'**Training level selection:**\n- **Member AI coach** — use **Onboarding level** from the athlete''s own profile (set during onboarding).\n- **Admin AI coach** — when the athlete profile includes **Training level (admin)**, that value overrides everything and determines the mandatory workout structure and level engine. When only **Onboarding level** is present (member personalized, no admin override), use that. If neither is set, infer conservatively from consultation; when unsure, default to Beginner.'
)
where key = 'ai_coach_system'
  and body like '%When the athlete profile includes **Onboarding level**%'
  and body not like '%Training level (admin)%';
