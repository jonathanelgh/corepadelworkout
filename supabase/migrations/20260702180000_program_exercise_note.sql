-- Optional coach note per exercise slot in a program session.

alter table public.program_exercises
  add column if not exists note text;

comment on column public.program_exercises.note is 'Optional coach note shown during the workout for this exercise slot.';
