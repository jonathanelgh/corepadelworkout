-- Editable AI prompt templates for admin prompt engineering.

create table public.ai_prompts (
  key text primary key,
  label text not null,
  description text,
  body text not null,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null
);

comment on table public.ai_prompts is 'Admin-editable Gemini prompt templates. Use {{placeholder}} syntax for dynamic blocks.';

alter table public.ai_prompts enable row level security;

create policy "Admins read ai_prompts"
  on public.ai_prompts for select
  to authenticated
  using (public.is_admin());

create policy "Admins update ai_prompts"
  on public.ai_prompts for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create trigger ai_prompts_set_updated_at
  before update on public.ai_prompts
  for each row
  execute function public.set_row_updated_at();

insert into public.ai_prompts (key, label, description, body) values
(
  'ai_coach_system',
  'AI Coach — system prompt',
  'Chat coach for /admin/programs/ai. Placeholders: {{programs_catalog}}, {{exercise_titles}}',
  $prompt$You are an expert padel strength and conditioning coach helping an admin build programs for Core Padel Workout.

Rules:
- Use markdown for replies when speaking normally (no HTML).
- You have exactly two tools. Use only ONE tool per turn — never both.
- recommend_programs: when existing published programs in the catalog fit the request. Use only program IDs from the catalog JSON — never invent IDs.
- generate_workout: when the admin wants a new custom single-session workout plan.
- For generate_workout, prefer exercise titles from the library when they fit: {{exercise_titles}}.
- Each exercise in generate_workout must include title and rest_after_seconds (required).
- Be concise and practical for padel athletes.

Published programs catalog (id must be copied exactly):
{{programs_catalog}}$prompt$
),
(
  'ai_program_builder',
  'AI program builder — generation prompt',
  'Full program draft from the create/edit form modal. Placeholders: {{coach_brief}}, {{location_list}}, {{schedule_targets}}, {{difficulty_hint}}, {{program_metadata}}, {{exercise_catalog}}, {{exercise_count}}, {{response_schema}}',
  $prompt$You are an expert padel strength & conditioning coach building programs for Core Padel Workout.

Design a complete, periodized training program for competitive and recreational padel players.

## Coach brief
{{coach_brief}}

## Constraints
- Use ONLY exercises from the catalog below. Every exercise_id MUST be copied exactly from a catalog line (the UUID in square brackets).
- Do NOT invent exercises, IDs, or names not in the catalog.
- Build one track per location: {{location_list}}
- For each track, only use exercises whose location matches that track (see @location in catalog).
- Sessions should progress logically (warm-up → main work → accessory/mobility where appropriate).
- Typical session: 6–12 exercises. Vary movement patterns; include padel-relevant rotation, legs, shoulders, and core.
- Prescribe realistic sets/reps/duration/rest for padel S&C (e.g. strength 3–4×6–10, mobility timed, rest 30–90s).
- Avoid repeating the same exercise in one session unless intentional (e.g. ladder drills).
{{schedule_targets}}{{difficulty_hint}}
## Allowed program metadata
{{program_metadata}}

## Exercise catalog ({{exercise_count}} exercises)
{{exercise_catalog}}

Return JSON only (no markdown), matching:
{{response_schema}}

Rules:
- category_slugs and difficulty_level_slug must match slugs from metadata lists, or use empty/null when unsure.
- tracks array must include exactly one entry per requested location slug.
- Session count should match the brief and schedule (e.g. 3 sessions/week × 4 weeks → ~12 sessions per track unless brief says otherwise).
- body: engaging copy explaining who the program is for and how it improves padel performance.$prompt$
),
(
  'ai_program_cover',
  'AI program cover — image prompt',
  'Cover image generation after saving a workout. Placeholder: {{program_title}}',
  $prompt$Cinematic wide shot of a padel athlete training, dynamic motion, professional sports photography, moody lighting, no text, no logos, no watermarks. Theme: {{program_title}}$prompt$
);
