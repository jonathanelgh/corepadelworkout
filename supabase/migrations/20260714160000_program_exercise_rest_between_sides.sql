-- Rest pause when switching sides on bilateral timed exercises.
alter table public.program_exercises
  add column if not exists rest_between_sides_seconds integer;

comment on column public.program_exercises.rest_between_sides_seconds is
  'Seconds of rest when switching from left to right on bilateral timed exercises.';
