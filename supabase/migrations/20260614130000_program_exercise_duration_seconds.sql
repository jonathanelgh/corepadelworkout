-- Per-exercise work duration in seconds (admin form uses seconds; legacy rows may only have duration_minutes).

alter table public.program_exercises
  add column if not exists duration_seconds integer;

comment on column public.program_exercises.duration_seconds is
  'Work time for this exercise in seconds; preferred over duration_minutes when set.';

alter table public.program_exercises
  drop constraint if exists program_exercises_duration_seconds_non_negative;

alter table public.program_exercises
  add constraint program_exercises_duration_seconds_non_negative
  check (duration_seconds is null or duration_seconds >= 0);
