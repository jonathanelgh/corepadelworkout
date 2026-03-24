-- Bullet list for "What you'll achieve" on program detail pages.

alter table public.programs
  add column if not exists outcomes jsonb not null default '[]'::jsonb;

comment on column public.programs.outcomes is 'JSON array of strings shown as checklist (What you''ll achieve).';

alter table public.programs
  drop constraint if exists programs_outcomes_is_array;

alter table public.programs
  add constraint programs_outcomes_is_array
  check (jsonb_typeof(outcomes) = 'array');
