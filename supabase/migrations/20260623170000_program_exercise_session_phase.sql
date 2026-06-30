-- Session structure: warm-up, main work, cool-down; optional OR-alternatives per choice_group.

do $$ begin
  create type public.program_session_phase as enum ('warmup', 'main', 'cooldown');
exception
  when duplicate_object then null;
end $$;

alter table public.program_exercises
  add column if not exists session_phase public.program_session_phase not null default 'main',
  add column if not exists choice_group text;

comment on column public.program_exercises.session_phase is
  'Block within a session: warm-up, main work, or cool-down.';
comment on column public.program_exercises.choice_group is
  'Exercises with the same choice_group are alternatives; the athlete picks one.';
