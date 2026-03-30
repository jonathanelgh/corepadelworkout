-- Per-exercise prescription when placed in a program session (time + sets/reps).
alter table public.program_exercises
  add column if not exists duration_minutes integer,
  add column if not exists sets integer,
  add column if not exists reps integer;

comment on column public.program_exercises.duration_minutes is 'Suggested work time for this exercise in this session (minutes); optional.';
comment on column public.program_exercises.sets is 'Suggested sets for this exercise in this session; optional.';
comment on column public.program_exercises.reps is 'Suggested reps per set for this exercise in this session; optional.';
