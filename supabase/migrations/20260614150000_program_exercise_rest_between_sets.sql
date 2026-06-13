-- Rest pause between sets within the same exercise (distinct from rest_after_seconds).

alter table public.program_exercises
  add column if not exists rest_between_sets_seconds integer;

comment on column public.program_exercises.rest_between_sets_seconds is
  'Rest between sets when an exercise uses timed sets (e.g. 2×20s with 30s between).';

alter table public.program_exercises
  drop constraint if exists program_exercises_rest_between_sets_non_negative;

alter table public.program_exercises
  add constraint program_exercises_rest_between_sets_non_negative
  check (rest_between_sets_seconds is null or rest_between_sets_seconds >= 0);
