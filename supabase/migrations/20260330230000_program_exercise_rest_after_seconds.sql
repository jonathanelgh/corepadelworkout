-- Optional rest/pause after an exercise before the next (e.g. transition time on court).
alter table public.program_exercises
  add column if not exists rest_after_seconds integer;

comment on column public.program_exercises.rest_after_seconds is 'Seconds to pause after this exercise before the next; optional.';

alter table public.program_exercises
  drop constraint if exists program_exercises_rest_after_seconds_non_negative;

alter table public.program_exercises
  add constraint program_exercises_rest_after_seconds_non_negative
  check (rest_after_seconds is null or rest_after_seconds >= 0);
